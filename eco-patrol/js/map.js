import { MAP_CENTER, MAP_ZOOM, PROBLEM_TYPES, STATUSES } from './config.js';
import { element, formatDate } from './utils.js';

/** Создаёт Leaflet-карту и возвращает API, скрывая экземпляры карты и маркеров. */
export function initMap({ onSelect, onStatus, onDelete, onError }) {
  const L = globalThis.L;
  if (!L) throw new Error('Карта не загрузилась. Проверьте интернет и доступ к unpkg.com, затем обновите страницу.');
  const map = L.map('map', { zoomControl: false }).setView(MAP_CENTER, MAP_ZOOM);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }).addTo(map);
  let tileWarningShown = false;
  tiles.on('tileerror', () => {
    if (!tileWarningShown) { tileWarningShown = true; onError('Не удалось загрузить фон карты. Проверьте интернет. Метки и список остаются доступны.'); }
  });
  const markers = new Map();
  let temporary = null;
  let picking = false;
  let pendingFocus = null;
  const cancelFocus = () => {
    if (pendingFocus) { map.off('moveend', pendingFocus); pendingFocus = null; }
  };
  const makeIcon = (type, isTemporary = false) => {
    const problem = PROBLEM_TYPES[type];
    return L.divIcon({ className: 'eco-marker-shell', html: `<span class="eco-marker marker-${type}${isTemporary ? ' marker-temporary' : ''}" style="--marker-color:${problem.color}"><span>${problem.emoji}</span></span>`, iconSize: [38, 46], iconAnchor: [19, 44], popupAnchor: [0, -40] });
  };
  const makePopup = report => {
    const root = element('article', 'map-popup');
    const type = PROBLEM_TYPES[report.type];
    root.append(element('span', `popup-type type-${report.type}`, `${type.emoji} ${type.label}`), element('h3', '', report.title));
    if (report.photo) {
      const photo = element('img', 'popup-photo'); photo.src = report.photo; photo.alt = `Фото: ${report.title}`; root.append(photo);
    }
    if (report.description) root.append(element('p', 'popup-description', report.description));
    root.append(element('p', 'popup-address', report.address || `${report.lat.toFixed(5)}, ${report.lng.toFixed(5)}`));
    const meta = element('div', 'popup-meta');
    meta.append(element('span', `status-badge status-${report.status}`, STATUSES[report.status]), element('time', '', formatDate(report.createdAt)));
    root.append(meta);
    const actions = element('div', 'popup-actions');
    const status = element('button', 'button button-soft button-small', 'Изменить статус'); status.type = 'button';
    status.addEventListener('click', () => onStatus(report.id, { new: 'in_progress', in_progress: 'resolved', resolved: 'new' }[report.status]));
    const remove = element('button', 'button button-danger button-small', 'Удалить'); remove.type = 'button';
    remove.addEventListener('click', () => onDelete(report.id));
    actions.append(status, remove); root.append(actions);
    L.DomEvent.disableClickPropagation(root);
    return root;
  };
  map.on('click', event => {
    picking = false;
    document.getElementById('map').classList.remove('is-picking');
    onSelect({ lat: event.latlng.lat, lng: event.latlng.lng, address: null });
  });
  const api = {
    /** Перерисовывает только выбранные фильтрами метки, сохраняя открытый popup. */
    render(reports) {
      cancelFocus();
      const openId = [...markers].find(([, marker]) => marker.isPopupOpen())?.[0];
      markers.forEach(marker => marker.remove()); markers.clear();
      reports.forEach(report => {
        const marker = L.marker([report.lat, report.lng], { icon: makeIcon(report.type), title: report.title, alt: report.title }).bindPopup(makePopup(report), { maxWidth: 310, minWidth: 240, autoPanPadding: [18, 84] }).addTo(map);
        markers.set(report.id, marker);
      });
      if (openId && markers.has(openId)) markers.get(openId).openPopup();
    },
    /** Приближает карту к метке и открывает безопасный DOM-popup. */
    focus(id) {
      const marker = markers.get(id);
      if (!marker) return;
      cancelFocus();
      map.stop();
      map.closePopup();
      const point = marker.getLatLng();
      if (map.getZoom() === 16 && map.getCenter().equals(point)) { marker.openPopup(); return; }
      // Popup открывается после полёта: иначе flyTo отменяет его автопрокрутку.
      pendingFocus = () => {
        pendingFocus = null;
        if (markers.get(id) === marker) marker.openPopup();
      };
      map.once('moveend', pendingFocus);
      map.flyTo(point, 16, { duration: 0.9 });
    },
    /** Показывает выбранную точку до отправки формы. */
    preview(point) {
      cancelFocus();
      api.clearPreview();
      temporary = L.marker([point.lat, point.lng], { icon: makeIcon('subbotnik', true), interactive: false }).addTo(map);
      map.flyTo([point.lat, point.lng], 16, { duration: 1 });
    },
    clearPreview() { if (temporary) { temporary.remove(); temporary = null; } },
    startPicking() {
      picking = !picking;
      document.getElementById('map').classList.toggle('is-picking', picking);
      return picking;
    },
    /** Возвращает карту к Алматы. */
    home() { cancelFocus(); map.closePopup(); map.flyTo(MAP_CENTER, MAP_ZOOM, { duration: 0.8 }); },
    resize() { map.invalidateSize(); },
  };
  return api;
}
