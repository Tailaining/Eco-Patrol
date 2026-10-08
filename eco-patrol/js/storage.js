import { STORAGE_KEY, PROBLEM_TYPES, STATUSES } from './config.js';

/** Проверяет полную модель: импортированный JSON тоже считается недоверенным. */
export function validateReport(report) {
  if (!report || typeof report !== 'object' || Array.isArray(report)) throw new Error('Метка должна быть объектом.');
  if (typeof report.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(report.id)) throw new Error('Некорректный идентификатор метки.');
  if (typeof report.type !== 'string' || typeof report.status !== 'string' || !Object.hasOwn(PROBLEM_TYPES, report.type) || !Object.hasOwn(STATUSES, report.status)) throw new Error('Неизвестный тип или статус метки.');
  if (typeof report.title !== 'string' || report.title.trim().length < 3 || report.title.trim().length > 60) throw new Error('Заголовок должен содержать от 3 до 60 символов.');
  if (typeof report.description !== 'string' || report.description.length > 500) throw new Error('Описание должно содержать не более 500 символов.');
  if (!Number.isFinite(report.lat) || Math.abs(report.lat) > 90 || !Number.isFinite(report.lng) || Math.abs(report.lng) > 180) throw new Error('Некорректные координаты метки.');
  if (report.address !== null && (typeof report.address !== 'string' || report.address.length > 1000)) throw new Error('Некорректный адрес метки.');
  if (report.photo !== null && (typeof report.photo !== 'string' || report.photo.length > 14_000_000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(report.photo))) throw new Error('Фото должно быть JPEG в формате dataURL.');
  if (typeof report.createdAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(report.createdAt) || !Number.isFinite(Date.parse(report.createdAt))) throw new Error('Некорректная дата создания метки.');
  // Копируем только поля модели: посторонние свойства из импорта не попадают в приложение.
  return Object.fromEntries(['id', 'type', 'title', 'description', 'lat', 'lng', 'address', 'photo', 'status', 'createdAt'].map(key => [key, report[key]]));
}

/** Проверяет массив целиком до записи, включая повторяющиеся идентификаторы. */
export function validateReports(data) {
  if (!Array.isArray(data) || data.length > 5000) throw new Error('JSON должен содержать массив не более 5000 меток.');
  const reports = data.map(validateReport);
  if (new Set(reports.map(report => report.id)).size !== reports.length) throw new Error('В JSON повторяются идентификаторы меток.');
  return reports;
}

/** Читает сохранённые данные. null означает отсутствие ключа, [] — пустой список. */
export function loadReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === null ? null : validateReports(JSON.parse(raw));
  } catch (error) {
    throw new Error('Не удалось прочитать сохранённые метки. Проверьте доступ к хранилищу и корректность JSON.', { cause: error });
  }
}

/** Записывает данные атомарно: при ошибке квоты предыдущая запись сохраняется. */
export function saveReports(reports) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validateReports(reports)));
  } catch (error) {
    if (error.name === 'QuotaExceededError') throw new Error('Хранилище переполнено. Экспортируйте данные, удалите старые метки или выберите фото меньшего размера.', { cause: error });
    throw new Error('Не удалось сохранить метки. Разрешите браузеру использовать localStorage.', { cause: error });
  }
}
