import { MAX_IMAGE_BYTES, IMAGE_MAX_SIDE, IMAGE_QUALITY } from './config.js';

/** Читает FileReader и сжимает фотографию до JPEG с максимальной стороной 800 px. */
export async function compressImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('Выберите файл изображения.');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Фото слишком большое. Максимальный размер — 10 МБ.');
  const dataURL = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Не удалось прочитать фото.'));
    reader.readAsDataURL(file);
  });
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Браузер не смог открыть это изображение. Попробуйте JPEG или PNG.'));
    img.src = dataURL;
  });
  const scale = Math.min(1, IMAGE_MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Сжатие фото недоступно в этом браузере.');
  context.fillStyle = '#ffffff'; // Прозрачные PNG получают белый фон вместо чёрного.
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', IMAGE_QUALITY);
}
