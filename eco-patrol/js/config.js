/** Настройки, общие для карты, формы и хранилища. */
export const MAP_CENTER = [43.2389, 76.8897];
export const MAP_ZOOM = 12;
export const STORAGE_KEY = 'ecopatrol_reports';
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const IMAGE_MAX_SIDE = 800;
export const IMAGE_QUALITY = 0.7;
export const GEOCODER_URL = 'https://nominatim.openstreetmap.org/search';
export const PROBLEM_TYPES = Object.freeze({
  dump: { label: 'Стихийная свалка', emoji: '🗑️', color: '#dc6153' },
  bin: { label: 'Переполненная урна', emoji: '🚮', color: '#db942d' },
  bench: { label: 'Сломанная скамейка', emoji: '🪑', color: '#4c84c0' },
  subbotnik: { label: 'Нужен субботник', emoji: '🌳', color: '#22845f' },
});
export const STATUSES = Object.freeze({
  new: 'Новая', in_progress: 'В работе', resolved: 'Решена',
});

/** Примеры появляются только при отсутствии ключа, а не после удаления всех меток. */
export const SEED_REPORTS = [
  { id: 'seed-1', type: 'dump', title: 'Мусор у прогулочной дорожки', description: 'После выходных остались пакеты и бутылки. Давайте вернём парку чистоту.', lat: 43.2587, lng: 76.9488, address: 'Алматы, Центральный парк', photo: null, status: 'new', createdAt: '2026-09-20T09:00:00.000Z' },
  { id: 'seed-2', type: 'bin', title: 'Урна переполнена', description: 'У входа в сквер нужна уборка. Рядом остановка и много прохожих.', lat: 43.2520, lng: 76.9360, address: 'Алматы, парк 28 гвардейцев-панфиловцев', photo: null, status: 'in_progress', createdAt: '2026-09-21T10:30:00.000Z' },
  { id: 'seed-3', type: 'bench', title: 'Сломана доска скамейки', description: 'На скамейке возле пешеходной зоны сломано сиденье.', lat: 43.2562, lng: 76.9290, address: 'Алматы, Арбат', photo: null, status: 'new', createdAt: '2026-09-22T12:00:00.000Z' },
  { id: 'seed-4', type: 'subbotnik', title: 'Здесь нужен субботник!', description: 'Соберём соседей и приведём в порядок зелёную зону.', lat: 43.2292, lng: 76.9450, address: 'Алматы, площадь Республики', photo: null, status: 'new', createdAt: '2026-09-23T08:00:00.000Z' },
  { id: 'seed-5', type: 'dump', title: 'Двор снова чистый', description: 'Жители собрали мусор и передали его на вывоз. Спасибо всем участникам!', lat: 43.2380, lng: 76.8990, address: 'Алматы, улица Байтурсынова', photo: null, status: 'resolved', createdAt: '2026-09-24T15:00:00.000Z' },
];
