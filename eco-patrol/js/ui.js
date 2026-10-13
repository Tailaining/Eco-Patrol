import { PROBLEM_TYPES, STATUSES } from './config.js';
import { compressImage } from './image.js';
import { debounce, element, formatDate } from './utils.js';

/** Показывает уведомление; текст не интерпретируется как HTML. */
export function toast(message, kind = 'success') {
  const container = document.getElementById('toasts');
  // dialog находится в верхнем слое браузера: уведомление должно быть в том же слое.
  const activeDialog = document.querySelector('dialog[open]');
  (activeDialog || document.body).append(container);
  const item = element('div', `toast toast-${kind}`);
  item.setAttribute('role', kind === 'error' ? 'alert' : 'status');
  item.append(element('span', 'toast-icon', kind === 'error' ? '!' : '✓'), element('span', '', message));
  const close = element('button', 'toast-close', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Закрыть уведомление');
  close.addEventListener('click', () => item.remove()); item.append(close); container.append(item);
  setTimeout(() => item.remove(), kind === 'error' ? 9000 : 5000);
}

/** Управляет нативными dialog: Escape, удержание фокуса и возврат к кнопке. */
export function openDialog(dialog) { if (!dialog.open) dialog.showModal(); }
export function closeDialog(dialog) { if (dialog.open) dialog.close(); }

/** Связывает формы, список и фильтры; вся запись проходит через переданные callbacks. */
export function initUI({ onCreate, onFilters, onFocus, onFormClose }) {
  document.querySelectorAll('dialog').forEach(modal => modal.addEventListener('close', () => {
    const container = document.getElementById('toasts');
    if (modal.contains(container)) document.body.append(container);
  }));
  const form = document.getElementById('report-form');
  const dialog = document.getElementById('report-dialog');
  const title = document.getElementById('report-title');
  const description = document.getElementById('report-description');
  const photoInput = document.getElementById('report-photo');
  const photoPreview = document.getElementById('photo-preview');
  const submit = document.getElementById('report-submit');
  const type = document.getElementById('report-type');
  let point = null;
  let photo = null;
  let imagePending = false;
  let imageVersion = 0;
  let titleTouched = false;
  let photoError = '';
  Object.entries(PROBLEM_TYPES).forEach(([value, problem]) => {
    const option = element('option', '', `${problem.emoji} ${problem.label}`); option.value = value; type.append(option);
  });
  const setError = (field, message) => {
    document.getElementById(`${field.id}-error`).textContent = message;
    field.setAttribute('aria-invalid', String(Boolean(message)));
  };
  const validate = (showAll = false) => {
    const length = title.value.trim().length;
    const titleError = length < 3 || length > 60 ? 'Введите заголовок от 3 до 60 символов.' : '';
    const descriptionError = description.value.length > 500 ? 'Максимум 500 символов.' : '';
    if (titleTouched || showAll) setError(title, titleError);
    setError(description, descriptionError);
    setError(photoInput, photoError);
    submit.disabled = Boolean(titleError || descriptionError || photoError || imagePending || !point);
    document.getElementById('description-count').textContent = `${description.value.length} / 500`;
    return !submit.disabled;
  };
  title.addEventListener('input', () => { titleTouched = true; validate(); });
  title.addEventListener('blur', () => { titleTouched = true; validate(); });
  description.addEventListener('input', () => validate());
  photoInput.addEventListener('change', async () => {
    const currentVersion = ++imageVersion;
    const file = photoInput.files[0];
    photo = null; photoError = ''; photoPreview.hidden = true; photoPreview.removeAttribute('src');
    if (!file) { imagePending = false; validate(); return; }
    imagePending = true; validate();
    document.getElementById('photo-label').textContent = 'Сжимаем фото…';
    try {
      const compressed = await compressImage(file);
      if (currentVersion !== imageVersion) return;
      photo = compressed; photoPreview.src = photo; photoPreview.hidden = false;
    } catch (error) { if (currentVersion === imageVersion) photoError = error.message; }
    finally {
      if (currentVersion === imageVersion) { imagePending = false; document.getElementById('photo-label').textContent = 'Выбрать фото'; validate(); }
    }
  });
  document.getElementById('remove-photo').addEventListener('click', () => {
    ++imageVersion; imagePending = false; photo = null; photoError = ''; photoInput.value = ''; photoPreview.hidden = true; photoPreview.removeAttribute('src');
    document.getElementById('photo-label').textContent = 'Выбрать фото'; validate();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!validate(true)) return;
    submit.disabled = true;
    try {
      await onCreate({ ...point, type: type.value, title: title.value.trim(), description: description.value.trim(), photo });
      closeDialog(dialog);
    } catch (error) { toast(error.message, 'error'); }
    finally { validate(); }
  });
  document.getElementById('close-report').addEventListener('click', () => closeDialog(dialog));
  document.getElementById('cancel-report').addEventListener('click', () => closeDialog(dialog));
  dialog.addEventListener('close', () => { ++imageVersion; imagePending = false; onFormClose(); });
  const filters = () => ({
    types: [...document.querySelectorAll('[name="type-filter"]:checked')].map(input => input.value),
    status: document.getElementById('status-filter').value,
    query: document.getElementById('text-search').value,
  });
  document.querySelectorAll('[name="type-filter"], #status-filter').forEach(input => input.addEventListener('change', () => onFilters(filters())));
  document.getElementById('text-search').addEventListener('input', debounce(() => onFilters(filters()), 300));
  document.getElementById('reset-filters').addEventListener('click', () => {
    document.querySelectorAll('[name="type-filter"]').forEach(input => { input.checked = true; });
    document.getElementById('status-filter').value = 'all'; document.getElementById('text-search').value = ''; onFilters(filters());
  });
  const menu = document.getElementById('menu-button');
  const panel = document.getElementById('sidebar');
  const layout = document.querySelector('.app-layout');
  const desktop = matchMedia('(min-width: 901px)');
  const setPanel = open => {
    panel.classList.toggle('is-open', open);
    layout.classList.toggle('panel-hidden', !open);
    menu.setAttribute('aria-expanded', String(open));
    if (!open && panel.contains(document.activeElement)) menu.focus();
  };
  setPanel(desktop.matches);
  desktop.addEventListener('change', event => setPanel(event.matches));
  menu.addEventListener('click', () => setPanel(!panel.classList.contains('is-open')));
  document.getElementById('close-sidebar').addEventListener('click', () => setPanel(false));
  document.getElementById('sidebar-backdrop').addEventListener('click', () => setPanel(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !document.querySelector('dialog[open]')) setPanel(false);
  });
  return {
    filters,
    collapsePanel() { setPanel(false); },
    /** Открывает форму с координатами; предыдущие фото и ошибки сбрасываются. */
    openForm(selectedPoint) {
      point = selectedPoint; photo = null; photoError = ''; imagePending = false; ++imageVersion; titleTouched = false;
      form.reset(); photoPreview.hidden = true; photoPreview.removeAttribute('src');
      document.getElementById('photo-label').textContent = 'Выбрать фото';
      [title, description, photoInput].forEach(field => setError(field, ''));
      document.getElementById('selected-location').textContent = point.address || `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
      setPanel(false); validate(); openDialog(dialog); title.focus();
    },
    /** Рисует карточки без innerHTML; текст поиска не превращается в разметку. */
    render(reports, counts) {
      const list = document.getElementById('report-list'); list.replaceChildren();
      document.getElementById('visible-count').textContent = `${reports.length} из ${counts.total}`;
      Object.entries(counts).forEach(([key, value]) => { document.getElementById(`count-${key}`).textContent = value; });
      if (!reports.length) {
        const empty = element('div', 'empty-state');
        empty.append(element('span', 'empty-icon', '🌱'), element('h3', '', 'Пока нет меток. Кликните по карте'), element('p', '', counts.total ? 'Или сбросьте фильтры, чтобы увидеть все проблемы.' : 'Первый шаг к чистому городу — заметить проблему.'));
        list.append(empty);
      }
      reports.forEach(report => {
        const problem = PROBLEM_TYPES[report.type];
        const card = element('button', 'report-card'); card.type = 'button'; card.dataset.reportId = report.id; card.setAttribute('aria-label', `Показать на карте: ${report.title}`);
        const top = element('div', 'card-top'); top.append(element('span', `card-type type-${report.type}`, `${problem.emoji} ${problem.label}`), element('span', 'card-arrow', '→'));
        const bottom = element('div', 'card-bottom'); bottom.append(element('span', `status-badge status-${report.status}`, STATUSES[report.status]), element('time', '', formatDate(report.createdAt)));
        card.append(top, element('h3', '', report.title), element('p', 'card-address', report.address || `${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}`), bottom);
        card.addEventListener('click', () => { setPanel(false); onFocus(report.id); }); list.append(card);
      });
    },
  };
}
