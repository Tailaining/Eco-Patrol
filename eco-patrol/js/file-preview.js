/**
 * Выбирает режим запуска: HTTP загружает ES-модули, file:// показывает только карту.
 * Это обычный script без глобальных переменных и без встроенного JavaScript в HTML.
 */
(() => {
  if (window.location.protocol !== 'file:') {
    const entry = document.createElement('script');
    entry.type = 'module';
    entry.src = new URL('main.js', document.currentScript.src).href;
    document.head.append(entry);
    return;
  }
  const ready = () => {
    const notice = document.getElementById('file-preview-notice');
    notice.hidden = false;
    document.querySelector('.map-hint div > span').textContent = 'Нажмите на маркер, чтобы открыть пример';
    const layout = document.querySelector('.app-layout');
    const panel = document.getElementById('sidebar');
    const menu = document.getElementById('menu-button');
    let panelOpen = window.innerWidth > 900;
    const setPanel = open => {
      panelOpen = open;
      panel.classList.toggle('is-open', open);
      layout.classList.toggle('panel-hidden', !open);
      menu.setAttribute('aria-expanded', String(open));
    };
    setPanel(panelOpen);
    menu.addEventListener('click', () => setPanel(!panelOpen));
    document.getElementById('close-sidebar').addEventListener('click', () => setPanel(false));
    document.getElementById('sidebar-backdrop').addEventListener('click', () => setPanel(false));
    document.getElementById('address-form').addEventListener('submit', event => event.preventDefault());
    // При локальном просмотре изменять данные нельзя: это честно обозначено в интерфейсе.
    ['add-button', 'address-submit', 'location-button', 'reset-filters'].forEach(id => {
      const button = document.getElementById(id); button.disabled = true; button.title = 'Доступно после запуска через start.py';
    });
    document.querySelectorAll('.filters input, .filters select, #address-search').forEach(input => { input.disabled = true; });
    const L = window.L;
    if (!L) {
      const map = document.getElementById('map'); map.classList.add('map-unavailable');
      map.textContent = 'Карта не загрузилась. Для предпросмотра нужен доступ к unpkg.com и OpenStreetMap.';
      return;
    }
    const map = L.map('map', { zoomControl: false }).setView([43.2389, 76.8897], 12);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(map);
    document.getElementById('home-button').addEventListener('click', () => map.flyTo([43.2389, 76.8897], 12));
    // Данные предпросмотра встроены в HTML из config.js; это не пользовательские отчёты.
    const examples = JSON.parse(document.getElementById('preview-reports').textContent);
    const types = { dump: ['🗑️', '#dc6153'], bin: ['🚮', '#db942d'], bench: ['🪑', '#4c84c0'], subbotnik: ['🌳', '#22845f'] };
    const list = document.getElementById('report-list');
    examples.forEach(report => {
      const [emoji, color] = types[report.type];
      const icon = L.divIcon({ className: 'eco-marker-shell', html: `<span class="eco-marker marker-${report.type}" style="--marker-color:${color}"><span>${emoji}</span></span>`, iconSize: [38, 46], iconAnchor: [19, 44] });
      const popup = document.createElement('div');
      const heading = document.createElement('strong'); heading.textContent = report.title;
      const description = document.createElement('p'); description.textContent = report.description;
      popup.append(heading, description);
      const marker = L.marker([report.lat, report.lng], { icon, title: report.title }).bindPopup(popup).addTo(map);
      const card = document.createElement('button'); card.type = 'button'; card.className = 'report-card';
      const title = document.createElement('h3'); title.textContent = `${emoji} ${report.title}`;
      const address = document.createElement('p'); address.className = 'card-address'; address.textContent = report.address;
      card.append(title, address); card.addEventListener('click', () => { setPanel(false); map.setView(marker.getLatLng(), 15); marker.openPopup(); });
      list.append(card);
    });
    ['new', 'in_progress', 'resolved'].forEach(status => { document.getElementById(`count-${status}`).textContent = examples.filter(report => report.status === status).length; });
    document.getElementById('count-total').textContent = examples.length;
    document.getElementById('visible-count').textContent = `${examples.length} примеров`;
    window.addEventListener('resize', () => map.invalidateSize());
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true });
  else ready();
})();
