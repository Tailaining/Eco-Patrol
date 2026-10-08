/** Получает координаты пользователя; разрешение спрашивает сам браузер. */
export async function getLocation() {
  if (!navigator.geolocation) throw new Error('Этот браузер не поддерживает геолокацию. Выберите точку на карте.');
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude, address: null }),
      error => reject(new Error({ 1: 'Доступ к геолокации запрещён. Разрешите его в настройках браузера или выберите точку на карте.', 2: 'Не удалось определить местоположение. Выберите точку на карте.', 3: 'Геолокация не ответила вовремя. Попробуйте ещё раз.' }[error.code] || 'Ошибка геолокации.')),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  });
}
