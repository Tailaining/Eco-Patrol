import { GEOCODER_URL } from './config.js';

/** Общий для поиска и демо шлюз: один активный запрос и не чаще раза в секунду. */
export function createGeocoder() {
  let busy = false;
  let lastStarted = -Infinity;
  return async function geocode(address) {
    const query = address.trim();
    if (query.length < 3) throw new Error('Введите адрес: не менее 3 символов.');
    if (busy) throw new Error('Поиск уже выполняется. Подождите немного.');
    if (!navigator.onLine) throw new Error('Нет интернета. Проверьте подключение и повторите поиск.');
    busy = true;
    const controller = new AbortController();
    let timeout;
    try {
      const wait = Math.max(0, 1100 - (performance.now() - lastStarted));
      if (wait) await new Promise(resolve => setTimeout(resolve, wait));
      lastStarted = performance.now();
      const url = new URL(GEOCODER_URL);
      url.search = new URLSearchParams({ q: query, format: 'json', limit: '1', countrycodes: 'kz', 'accept-language': 'ru' });
      timeout = setTimeout(() => controller.abort(), 12000);
      // Никакого autocomplete: запрос выполняется только после явного нажатия.
      const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(response.status === 429 ? 'Сервис просит подождать. Повторите поиск позже.' : 'Сервис поиска адресов временно недоступен.');
      const results = await response.json();
      if (!Array.isArray(results) || !results.length) throw new Error('Адрес не найден. Укажите город, улицу и номер дома в Казахстане.');
      const lat = Number(results[0].lat);
      const lng = Number(results[0].lon);
      if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180) throw new Error('Сервис вернул некорректные координаты.');
      return { lat, lng, address: String(results[0].display_name || query).slice(0, 1000) };
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Поиск занял слишком много времени. Попробуйте ещё раз.');
      if (error instanceof TypeError) throw new Error('Не удалось связаться с сервисом поиска. Проверьте интернет.');
      throw error;
    } finally { clearTimeout(timeout); busy = false; }
  };
}
