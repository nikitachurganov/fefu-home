// Нарисованные заглушки вместо фотографий аудиторий: настоящих снимков в прототипе пока нет.
// Возвращают data-URI, поэтому подходят для <img src> без отдельных файлов.
export function classroomPlaceholder(from, to) {
  const desks = [0, 1, 2].map((row) => `<rect x="${70 + row * 40}" y="${170 + row * 45}" width="${460 - row * 80}" height="22" rx="4"/>`).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 350"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="600" height="350" fill="url(#g)"/><rect x="40" y="30" width="520" height="90" rx="6" fill="#fff" opacity=".35"/><g fill="#fff" opacity=".55">${desks}</g></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
