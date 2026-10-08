/** Создаёт идентификатор, в том числе в браузерах без randomUUID. */
export function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Форматирует дату для русскоязычного интерфейса. */
export function formatDate(iso) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

/** Экранирует текст, если его необходимо вставить в HTML-шаблон. */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

/** Откладывает вызов до паузы во вводе; используется для поиска по меткам. */
export function debounce(callback, delay = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => callback(...args), delay); };
}

/** Создаёт DOM-узел. Пользовательский текст всегда передаётся через textContent. */
export function element(tag, className = '', text = '') {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}
