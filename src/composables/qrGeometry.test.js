import { describe, expect, it } from 'vitest'
import { codeBox, coverMap, cropRect, toScreen, toVideo } from './qrGeometry'

describe('coverMap', () => {
  it('портретный экран, горизонтальное видео: масштаб по высоте, обрезаны бока', () => {
    const map = coverMap({ w: 1280, h: 720 }, { w: 400, h: 800 })
    expect(map.scale).toBeCloseTo(800 / 720)
    expect(map.dy).toBe(0)
    expect(map.dx).toBeCloseTo((1280 * (800 / 720) - 400) / 2)
  })

  it('экранные и видео-координаты переводятся друг в друга без потерь', () => {
    const map = coverMap({ w: 1280, h: 720 }, { w: 400, h: 800 })
    const point = { x: 123, y: 456 }
    const back = toVideo(map, toScreen(map, point))
    expect(back.x).toBeCloseTo(point.x)
    expect(back.y).toBeCloseTo(point.y)
  })

  it('центр экрана — центр видео', () => {
    const map = coverMap({ w: 1280, h: 720 }, { w: 400, h: 800 })
    const center = toVideo(map, { x: 200, y: 400 })
    expect(center.x).toBeCloseTo(640)
    expect(center.y).toBeCloseTo(360)
  })
})

describe('cropRect', () => {
  const video = { w: 1280, h: 720 }
  const map = coverMap(video, { w: 400, h: 800 })

  it('область вокруг рамки, середина совпадает с серединой рамки', () => {
    const frame = { x: 80, y: 280, w: 240, h: 240 }
    const crop = cropRect(map, frame, video)
    expect(crop.x + crop.w / 2).toBeCloseTo(640)
    expect(crop.y + crop.h / 2).toBeCloseTo(360)
    expect(crop.w).toBeGreaterThan(240 / map.scale)
  })

  it('не выходит за границы кадра', () => {
    const crop = cropRect(map, { x: -2000, y: -2000, w: 5000, h: 5000 }, video)
    expect(crop).toMatchObject({ x: 0, y: 0 })
    expect(crop.x + crop.w).toBeLessThanOrEqual(video.w)
    expect(crop.y + crop.h).toBeLessThanOrEqual(video.h)
  })
})

describe('codeBox', () => {
  it('охватывает три поисковых узора с запасом до края кода', () => {
    const box = codeBox([{ x: 100, y: 200 }, { x: 100, y: 100 }, { x: 200, y: 100 }])
    expect(box.x).toBeLessThan(100)
    expect(box.y).toBeLessThan(100)
    expect(box.x + box.w).toBeGreaterThan(200)
    expect(box.y + box.h).toBeGreaterThan(200)
    expect(box.w).toBeCloseTo(box.h)
  })

  it('четвёртая точка (выравнивающий узор) рамку не раздвигает', () => {
    const three = codeBox([{ x: 0, y: 100 }, { x: 0, y: 0 }, { x: 100, y: 0 }])
    const four = codeBox([{ x: 0, y: 100 }, { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 90, y: 90 }])
    expect(four).toEqual(three)
  })

  it('меньше трёх точек — рамки нет', () => {
    expect(codeBox([{ x: 1, y: 1 }])).toBeNull()
  })
})
