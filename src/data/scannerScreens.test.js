import { beforeEach, describe, expect, it } from 'vitest'
import { activeLessons, endClass, findScheduledLesson, startClass } from './actionCodes'
import { findAsset } from './assets'
import { buildCode, parseCode } from './scanCodes'
import { resolveScan } from './scanModel'

describe('Экраны сканера и обработка помещений (Figma 983-7797)', () => {
  beforeEach(() => {
    // Очищаем активные сессии перед каждым тестом
    for (const key of Object.keys(activeLessons)) {
      delete activeLessons[key]
    }
  })

  it('Экран 1: Парсинг кода и валидация формата сканера', () => {
    const raw = buildCode('passport', 'RM-0703')
    const parsed = parseCode(raw)
    expect(parsed).toEqual({ kind: 'passport', id: 'RM-0703' })
  })

  it('Экран 2: Результат скана кода помещения преподом, если у него там есть пара', () => {
    const asset = findAsset('RM-0703')
    expect(asset).toBeTruthy()
    expect(asset.type).toBe('room')
    expect(asset.roomCode).toBe('F703')

    // Преподаватель сканирует RM-0703
    const scan = resolveScan(buildCode('passport', 'RM-0703'), { role: 'teacher' })
    expect(scan.ok).toBe(true)
    expect(scan.asset.id).toBe('RM-0703')

    // Проверяем наличие пары в расписании для преподавателя
    const scheduled = findScheduledLesson('RM-0703')
    expect(scheduled).toBeTruthy()
    expect(scheduled.title).toBe('Проектирование в дизайне (практика)')
    expect(scheduled.place).toBe('F703')
    expect(scheduled.group).toBe('М1125-38.04.02сбер')
    expect(scheduled.studentCount).toBe(16)
  })

  it('Экран 3: Результат скана кода помещения без пары и без реле (дефолтный итог)', () => {
    const asset = findAsset('RM-0705')
    expect(asset).toBeTruthy()
    expect(asset.type).toBe('room')
    expect(asset.roomCode).toBe('F705')
    expect(asset.hasRelay).toBe(false)

    // Преподаватель сканирует RM-0705 — пары нет
    const scheduledTeacher = findScheduledLesson('RM-0705')
    expect(scheduledTeacher).toBeNull()

    // Пользователь сканирует RM-0705
    const scanUser = resolveScan(buildCode('passport', 'RM-0705'), { role: 'user' })
    expect(scanUser.ok).toBe(true)
    expect(scanUser.asset.hasRelay).toBe(false)
  })

  it('Экран 4: Результат скана кода помещения, если есть реле для открытия двери', () => {
    const asset = findAsset('RM-0703')
    expect(asset).toBeTruthy()
    expect(asset.hasRelay).toBe(true)

    // Студент (роль user) сканирует аудиторию с реле
    const scan = resolveScan(buildCode('passport', 'RM-0703'), { role: 'user' })
    expect(scan.ok).toBe(true)
    expect(scan.asset.hasRelay).toBe(true)
    expect(scan.asset.roomCode).toBe('F703')
  })

  it('Экран «Занятие» (Figma 977:7128): старт пары по расписанию и генерация QR для студентов', () => {
    const lessonData = findScheduledLesson('RM-0703')
    expect(lessonData).toBeTruthy()

    const started = startClass(lessonData)
    expect(started.ok).toBe(true)
    expect(started.lessonId).toBe(lessonData.id)
    expect(activeLessons[lessonData.id]).toBeTruthy()

    // Проверяем данные экрана «Информация о паре»
    const session = activeLessons[lessonData.id]
    expect(session.lesson.title).toBe('Проектирование в дизайне (практика)')
    expect(session.lesson.discipline).toBe('Проектирование в дизайне и визуальные коммуникации')
    expect(session.lesson.teacher).toBe('Иванов Иван Иванович')
    expect(session.lesson.scheduledDate).toBe('18-06-2026, 10:10-11:40')
    expect(session.attendees).toEqual([])

    // Завершение пары
    const ended = endClass(lessonData.id)
    expect(ended.ok).toBe(true)
    expect(activeLessons[lessonData.id]).toBeUndefined()
  })
})
