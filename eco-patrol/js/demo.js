import { openDialog, closeDialog, toast } from './ui.js';

/** Демо использует тот же геокодер и сервис сохранения, что и обычные метки. */
export function initDemo({ geocode, createReport, onCreated }) {
  const dialog = document.getElementById('demo-dialog');
  const form = document.getElementById('demo-form');
  const address = document.getElementById('demo-address');
  const errorNode = document.getElementById('demo-error');
  const button = document.getElementById('demo-submit');
  let busy = false;
  let sessionVersion = 0;
  // Закрытое демо не создаёт метку после позднего ответа сервиса.
  dialog.addEventListener('close', () => { ++sessionVersion; });
  document.getElementById('demo-button').addEventListener('click', () => {
    errorNode.textContent = ''; address.setAttribute('aria-invalid', 'false'); openDialog(dialog); address.focus();
  });
  document.getElementById('close-demo').addEventListener('click', () => closeDialog(dialog));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const requestVersion = sessionVersion;
    busy = true; button.disabled = true; button.textContent = 'Ищем место…'; errorNode.textContent = '';
    try {
      const point = await geocode(address.value);
      if (!dialog.open || requestVersion !== sessionVersion) return;
      const report = createReport({ ...point, type: 'subbotnik', title: 'Здесь нужен субботник!', description: 'Место выбрано вместе с участниками демонстрации. Соберёмся и сделаем город чище!', photo: null });
      closeDialog(dialog); onCreated(report); toast('Здесь нужен субботник! Демо-метка сохранена.');
    } catch (error) {
      if (dialog.open && requestVersion === sessionVersion) {
        errorNode.textContent = error.message; address.setAttribute('aria-invalid', 'true'); toast(error.message, 'error');
      }
    } finally { busy = false; button.disabled = false; button.textContent = 'Поставить маркер'; }
  });
}
