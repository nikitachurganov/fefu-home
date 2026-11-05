// Геометрия сканера: видео вписано в экран как object-fit: cover, а читаем мы только область рамки.
// Прямоугольники везде в виде { x, y, w, h }; «экран» — координаты внутри элемента видео.

// Как видео растянуто на элемент: масштаб по большей стороне и сдвиг от обрезанных краёв.
export function coverMap(video, box) {
  const scale = Math.max(box.w / video.w, box.h / video.h)
  return { scale, dx: (video.w * scale - box.w) / 2, dy: (video.h * scale - box.h) / 2 }
}

export const toVideo = (map, p) => ({ x: (p.x + map.dx) / map.scale, y: (p.y + map.dy) / map.scale })
export const toScreen = (map, p) => ({ x: p.x * map.scale - map.dx, y: p.y * map.scale - map.dy })

// Область кадра, которую отдаём декодеру: рамка с небольшим запасом, не выходящая за кадр.
// Всё, что вне рамки, не читается — поэтому при нескольких кодах открывается тот, что в рамке.
export function cropRect(map, frame, video, pad = 0.1) {
  const a = toVideo(map, { x: frame.x - frame.w * pad, y: frame.y - frame.h * pad })
  const b = toVideo(map, { x: frame.x + frame.w * (1 + pad), y: frame.y + frame.h * (1 + pad) })
  const x = Math.max(0, Math.min(video.w, a.x))
  const y = Math.max(0, Math.min(video.h, a.y))
  return { x, y, w: Math.max(0, Math.min(video.w, b.x) - x), h: Math.max(0, Math.min(video.h, b.y) - y) }
}

// Рамка вокруг кода по трём центрам поисковых узоров (углы QR). Узор занимает 7 модулей, и до
// края кода от его центра 3,5 модуля; при типичных 25–29 модулях это около 16–19% расстояния между центрами.
const EDGE = 0.2
export function codeBox(points) {
  const corners = points.slice(0, 3)
  if (corners.length < 3) return null
  const xs = corners.map((p) => p.x)
  const ys = corners.map((p) => p.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const span = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY)
  const pad = span * EDGE
  return { x: minX - pad, y: minY - pad, w: Math.max(...xs) - minX + pad * 2, h: Math.max(...ys) - minY + pad * 2 }
}
