import { createReportsService } from './reports.js';
import { createGeocoder } from './geocoder.js';
import { getLocation } from './geolocation.js';
import { initMap } from './map.js';
import { initUI, toast } from './ui.js';

/** Точка входа только связывает модули; бизнес-логика и DOM разделены. */
function bootstrap() {
  const reports = createReportsService();
  const geocode = createGeocoder();
  let map = null;
  let ui;
  let filters;
  let selectionVersion = 0;
  const refresh = () => {
    const visible = reports.filter(filters);
    ui.render(visible, reports.counts()); map?.render(visible);
  };
  const showAllAndFocus = report => {
    ++selectionVersion;
    document.getElementById('reset-filters').click();
    map?.focus(report.id); ui.collapsePanel();
  };
  ui = initUI({
    onCreate: input => { const report = reports.create(input); toast('Метка добавлена'); showAllAndFocus(report); },
    onFilters: next => { filters = next; refresh(); },
    onFocus: id => map?.focus(id),
    onFormClose: () => { ++selectionVersion; map?.clearPreview(); },
  });
  filters = ui.filters();
  try { reports.init(); } catch (error) { toast(error.message, 'error'); }
  try {
    map = initMap({
      onSelect: point => { ++selectionVersion; map.preview(point); ui.openForm(point); },
      onStatus: (id, status) => { try { reports.setStatus(id, status); toast('Статус обновлён'); } catch (error) { toast(error.message, 'error'); } },
      onDelete: id => {
        if (!confirm('Удалить эту метку? Это действие нельзя отменить.')) return;
        try { reports.remove(id); toast('Метка удалена'); } catch (error) { toast(error.message, 'error'); }
      },
      onError: message => toast(message, 'error'),
    });
  } catch (error) {
    const container = document.getElementById('map');
    container.classList.add('map-unavailable'); container.textContent = error.message; toast(error.message, 'error');
  }
  reports.subscribe(refresh); refresh();
  const searchForm = document.getElementById('address-form');
  searchForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = document.getElementById('address-submit');
    if (button.disabled) return;
    const requestVersion = ++selectionVersion;
    button.disabled = true; button.textContent = 'Ищем…';
    try {
      const point = await geocode(document.getElementById('address-search').value);
      // Поздний ответ не должен затереть новую форму, открытую кликом по карте.
      if (requestVersion !== selectionVersion) return;
      map?.preview(point); ui.openForm(point);
    }
    catch (error) { if (requestVersion === selectionVersion) toast(error.message, 'error'); }
    finally { button.disabled = false; button.textContent = 'Найти'; }
  });
  document.getElementById('location-button').addEventListener('click', async event => {
    const requestVersion = ++selectionVersion;
    const button = event.currentTarget; button.disabled = true;
    try {
      const point = await getLocation();
      if (requestVersion !== selectionVersion) return;
      map?.preview(point); ui.openForm(point);
    }
    catch (error) { if (requestVersion === selectionVersion) toast(error.message, 'error'); }
    finally { button.disabled = false; }
  });
  document.getElementById('add-button').addEventListener('click', () => {
    ++selectionVersion;
    ui.collapsePanel();
    if (map?.startPicking()) toast('Кликните по карте, чтобы отметить проблему');
  });
  document.getElementById('home-button').addEventListener('click', () => map?.home());
  window.addEventListener('resize', () => map?.resize());
}

// DOMContentLoaded ждёт также CDN-скрипт Leaflet с defer.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
else bootstrap();
