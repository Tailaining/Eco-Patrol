import { SEED_REPORTS } from './config.js';
import { createId } from './utils.js';
import { loadReports, saveReports, validateReport, validateReports } from './storage.js';

/** Сервис хранит состояние внутри замыкания, UI не обращается к localStorage. */
export function createReportsService() {
  let reports = [];
  let readable = false;
  const listeners = new Set();
  const list = () => reports.map(report => ({ ...report }));
  const notify = () => listeners.forEach(listener => listener(list()));
  const commit = next => {
    if (!readable) throw new Error('Хранилище не прочитано. Исправьте сохранённый JSON или восстановите данные импортом.');
    saveReports(next); // Сначала запись, затем изменение памяти и интерфейса.
    reports = next;
    notify();
  };
  return {
    /** Загружает метки, один раз предзаполняя новый браузер примерами. */
    init() {
      const stored = loadReports();
      if (stored === null) saveReports(SEED_REPORTS);
      reports = stored ?? SEED_REPORTS.map(report => ({ ...report }));
      readable = true;
      return list();
    },
    list,
    /** Подписывает интерфейс на успешные изменения. */
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    /** Создаёт и сохраняет новую метку. */
    create(input) {
      const report = validateReport({ ...input, id: createId(), status: 'new', createdAt: new Date().toISOString() });
      commit([report, ...reports]);
      return { ...report };
    },
    /** Удаляет метку по идентификатору. */
    remove(id) { commit(reports.filter(report => report.id !== id)); },
    /** Меняет статус, сохраняя остальные поля. */
    setStatus(id, status) {
      const next = reports.map(report => report.id === id ? validateReport({ ...report, status }) : report);
      commit(next);
    },
    /** Импорт объединяет данные по id; проверка и запись выполняются до обновления UI. */
    import(data) {
      const incoming = validateReports(data);
      const merged = new Map(reports.map(report => [report.id, report]));
      incoming.forEach(report => merged.set(report.id, report));
      const next = validateReports([...merged.values()]);
      saveReports(next);
      reports = next;
      readable = true;
      notify();
      return incoming.length;
    },
    /** Фильтрует копию списка по типам, статусу и тексту. */
    filter({ types, status = 'all', query = '' }) {
      const needle = query.trim().toLocaleLowerCase('ru');
      return list().filter(report => types.includes(report.type) && (status === 'all' || report.status === status) && `${report.title} ${report.description}`.toLocaleLowerCase('ru').includes(needle));
    },
    /** Счётчики относятся ко всему списку, независимо от выбранных фильтров. */
    counts() { return { total: reports.length, new: reports.filter(r => r.status === 'new').length, in_progress: reports.filter(r => r.status === 'in_progress').length, resolved: reports.filter(r => r.status === 'resolved').length }; },
  };
}
