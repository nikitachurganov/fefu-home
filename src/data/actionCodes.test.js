import { describe, expect, it } from 'vitest'
import {
  activeLessons,
  codeActionsFor,
  endClass,
  evaluateCheckin,
  evaluateClassMark,
  findScheduledLesson,
  isActionCodeActive,
  markStudentPresent,
  startClass,
} from './actionCodes'

const request = (extra) => ({ id: 'r1', source: 'events', statusGroup: 'confirmed', status: 'confirmed', eventId: 'EV-2001', ...extra })

describe('evaluateCheckin', () => {
  const now = Date.now()

  it('успех при одобренной заявке и открытом окне', () => {
    expect(evaluateCheckin('EV-2001', [request()], now)).toMatchObject({ ok: true, kind: 'checkin' })
  })

  it('неизвестное мероприятие — код не активен', () => {
    expect(evaluateCheckin('EV-0000', [request()], now)).toEqual({ ok: false, error: 'inactive' })
  })

  it('нет заявки или она не одобрена', () => {
    expect(evaluateCheckin('EV-2004', [request()], now)).toMatchObject({ ok: false, error: 'no-request' })
    const pending = evaluateCheckin('EV-2001', [request({ status: 'review', statusGroup: 'moderation' })], now)
    expect(pending).toMatchObject({ ok: false, error: 'no-request' })
    expect(pending.detail).toMatch(/модерации/)
  })

  it('уже отмечен — раньше проверки окна', () => {
    const checked = request({ eventId: 'EV-2003', status: 'checked-in', checkedInAt: new Date(now).toISOString() })
    expect(evaluateCheckin('EV-2003', [checked], now)).toMatchObject({ ok: false, error: 'already-checked' })
  })

  it('вне окна: рано и поздно', () => {
    expect(evaluateCheckin('EV-2002', [request({ eventId: 'EV-2002' })], now)).toMatchObject({ ok: false, error: 'outside-window' })
    expect(evaluateCheckin('EV-2003', [request({ eventId: 'EV-2003' })], now)).toMatchObject({ ok: false, error: 'outside-window' })
  })
})

describe('evaluateClassMark', () => {
  const now = Date.now()

  it('отмечает на идущей паре', () => {
    expect(evaluateClassMark('LC-4107', {}, now)).toMatchObject({ ok: true, kind: 'class' })
  })

  it('истёкший и неизвестный код не активны', () => {
    expect(evaluateClassMark('LC-4101', {}, now)).toEqual({ ok: false, error: 'inactive' })
    expect(evaluateClassMark('LC-0000', {}, now)).toEqual({ ok: false, error: 'inactive' })
  })

  it('повторная отметка', () => {
    const marks = { 'LC-4107': new Date(now).toISOString() }
    expect(evaluateClassMark('LC-4107', marks, now)).toMatchObject({ ok: false, error: 'already-checked' })
  })
})

describe('isActionCodeActive', () => {
  const upcoming = { id: '1', source: 'equipment', status: 'upcoming' }
  const active = { id: '2', source: 'tmc', status: 'active' }
  const place = { id: '3', source: 'workplace', status: 'active' }
  const issued = { id: '4', source: 'equipment', status: 'issued' }
  const list = [upcoming, active, place, issued]

  it('код заявки — пока предмет не выдан', () => {
    expect(isActionCodeActive({ kind: 'request', id: '1' }, list)).toBe(true)
    expect(isActionCodeActive({ kind: 'request', id: '2' }, list)).toBe(false)
    expect(isActionCodeActive({ kind: 'request', id: '4' }, list)).toBe(false)
  })

  it('код возврата — у активной заявки на оборудование или ТМЦ', () => {
    expect(isActionCodeActive({ kind: 'return', id: '2' }, list)).toBe(true)
    expect(isActionCodeActive({ kind: 'return', id: '3' }, list)).toBe(false)
  })

  it('код чекаута — у активной заявки на рабочее место', () => {
    expect(isActionCodeActive({ kind: 'checkout', id: '3' }, list)).toBe(true)
    expect(isActionCodeActive({ kind: 'checkout', id: '2' }, list)).toBe(false)
  })

  it('неизвестная заявка', () => {
    expect(isActionCodeActive({ kind: 'request', id: '999' }, list)).toBe(false)
  })

  it('codeActionsFor отдаёт коды текущего этапа', () => {
    expect(codeActionsFor(active, list).map((action) => action.text)).toEqual(['FEFU-ONE:RETURN:2'])
    expect(codeActionsFor(issued, list)).toEqual([])
  })
})

describe('управление парами преподавателем', () => {
  it('поиск занятия по аудитории в расписании', () => {
    const found = findScheduledLesson('RM-0305')
    expect(found).not.toBeNull()
    expect(found.id).toBe('LC-4107')
    expect(findScheduledLesson('RM-9999')).toBeNull()
  })

  it('полный жизненный цикл пары: старт -> отметка студента -> завершение', () => {
    const lessonData = findScheduledLesson('RM-0305')
    const started = startClass(lessonData)
    expect(started.ok).toBe(true)
    expect(activeLessons['LC-4107']).toBeDefined()

    // Отметка студента преподавателем
    const mark1 = markStudentPresent('24-08192', 'LC-4107')
    expect(mark1.ok).toBe(true)
    expect(mark1.student.name).toBe('Никита Чурганов')
    expect(activeLessons['LC-4107'].attendees.length).toBe(1)

    // Повторная отметка того же студента
    const dup = markStudentPresent('24-08192', 'LC-4107')
    expect(dup.ok).toBe(false)
    expect(dup.error).toBe('already-checked')

    // Неизвестный студент
    const unknown = markStudentPresent('99-99999', 'LC-4107')
    expect(unknown.ok).toBe(false)
    expect(unknown.error).toBe('unrecognized')

    // Завершение пары
    const ended = endClass('LC-4107')
    expect(ended.ok).toBe(true)
    expect(activeLessons['LC-4107']).toBeUndefined()

    // Попытка отметки после завершения пары
    const afterEnd = markStudentPresent('24-08201', 'LC-4107')
    expect(afterEnd.ok).toBe(false)
    expect(afterEnd.error).toBe('no-active-class')
  })
})
