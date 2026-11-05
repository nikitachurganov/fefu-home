import { describe, expect, it } from 'vitest'
import { findAsset } from './assets'
import {
  acceptNote,
  applyInventoryScan,
  applyScan,
  canFinish,
  createAcceptSession,
  createInventorySession,
  createIssueSession,
  inventorySummary,
  previewCode,
  problemTypes,
  progress,
  reportProblem,
  resolvedItems,
  setCondition,
} from './sessionModel'

const request = (items) => ({ id: 'r1', items })
const unit = (unitId) => ({ kind: 'unit', unitId })
const model = (modelId) => ({ kind: 'model', modelId, unitId: null })

// Единицы из assets.js: TM-0301 утюг свободен, TM-0302 утюг занят, TM-0303 пылесос занят,
// TM-0304 пылесос на обслуживании, TM-0306/0307 пылесосы свободны, TM-0305 набор инструментов.
describe('выдача', () => {
  it('конкретная свободная единица закрепляется за позицией', () => {
    const { session, outcome } = applyScan(createIssueSession(request([unit('TM-0301')])), 'TM-0301')
    expect(outcome).toBe('matched')
    expect(progress(session)).toEqual({ done: 1, total: 1 })
    expect(canFinish(session)).toBe(true)
  })

  it('позиция-модель принимает любую свободную единицу модели', () => {
    const { session, outcome } = applyScan(createIssueSession(request([model('vacuum')])), 'TM-0306')
    expect(outcome).toBe('matched')
    expect(session.items[0].unitId).toBe('TM-0306')
  })

  it('занятая или обслуживаемая единица не принимается', () => {
    const start = createIssueSession(request([model('vacuum')]))
    for (const id of ['TM-0303', 'TM-0304']) {
      const { session, outcome } = applyScan(start, id)
      expect(outcome).toBe('unavailable')
      expect(progress(session).done).toBe(0)
    }
  })

  it('недоступную единицу заменяет аналог той же модели', () => {
    const first = applyScan(createIssueSession(request([unit('TM-0302')])), 'TM-0302')
    expect(first.outcome).toBe('unavailable')
    const second = applyScan(first.session, 'TM-0301')
    expect(second.outcome).toBe('replaced')
    expect(second.session.items[0]).toMatchObject({ unitId: 'TM-0301', replaced: true })
  })

  it('аналог подходит и без предварительного скана заказанной единицы, если та занята', () => {
    const { outcome } = applyScan(createIssueSession(request([unit('TM-0302')])), 'TM-0301')
    expect(outcome).toBe('replaced')
  })

  it('чужая модель, повтор и не оборудование', () => {
    const start = createIssueSession(request([unit('TM-0301'), model('vacuum')]))
    expect(applyScan(start, 'TM-0305').outcome).toBe('not-in-request')
    expect(applyScan(start, 'RM-0101').outcome).toBe('not-in-request')
    const once = applyScan(start, 'TM-0301').session
    expect(applyScan(once, 'TM-0301').outcome).toBe('duplicate')
  })

  it('набор заканчивается, когда закрыты все позиции; resolvedItems даёт конкретные единицы', () => {
    let session = createIssueSession(request([unit('TM-0301'), model('vacuum')]))
    session = applyScan(session, 'TM-0301').session
    expect(canFinish(session)).toBe(false)
    session = applyScan(session, 'TM-0306').session
    expect(canFinish(session)).toBe(true)
    expect(resolvedItems(session).map((item) => item.unitId)).toEqual(['TM-0301', 'TM-0306'])
  })

  it('пустая заявка не завершается', () => {
    expect(canFinish(createIssueSession(request([])))).toBe(false)
  })
})

describe('инвентаризация', () => {
  // Корпус А: проектор EQ-0142 и рабочие места WP-0101, WP-0102; списанный EQ-0999 не ожидается.
  const start = () => createInventorySession(findAsset('AS-0001'))

  it('ожидает оборудование и рабочие места внутри области, без списанных и без помещений', () => {
    expect(start().expected.map((entry) => entry.id).sort()).toEqual(['EQ-0142', 'WP-0101', 'WP-0102'])
  })

  it('находит ожидаемые единицы, повтор — дубликат', () => {
    const first = applyInventoryScan(start(), 'eq-0142')
    expect(first.outcome).toBe('found')
    expect(applyInventoryScan(first.session, 'EQ-0142').outcome).toBe('duplicate')
  })

  it('единица из другой области — «числится в другом месте», неизвестный код — «unknown»', () => {
    const elsewhere = applyInventoryScan(start(), 'EQ-0201')
    expect(elsewhere.outcome).toBe('elsewhere')
    const unknown = applyInventoryScan(elsewhere.session, 'EQ-7777')
    expect(unknown.outcome).toBe('unknown')
    expect(applyInventoryScan(unknown.session, 'EQ-7777').outcome).toBe('duplicate')
  })

  it('сводка: найдено, не найдено, расхождения', () => {
    let session = start()
    session = applyInventoryScan(session, 'EQ-0142').session
    session = applyInventoryScan(session, 'WP-0101').session
    session = applyInventoryScan(session, 'EQ-0201').session
    session = applyInventoryScan(session, 'EQ-7777').session
    expect(inventorySummary(session)).toEqual({
      total: 3,
      found: ['EQ-0142', 'WP-0101'],
      missing: ['WP-0102'],
      elsewhere: ['EQ-0201'],
      unknown: ['EQ-7777'],
    })
  })
})

describe('приёмка', () => {
  const start = () => createAcceptSession(request([unit('TM-0303'), unit('TM-0302')]))

  it('принимает только выданные единицы', () => {
    expect(applyScan(start(), 'TM-0303').outcome).toBe('matched')
    expect(applyScan(start(), 'TM-0301').outcome).toBe('not-in-request')
  })

  it('не требует свободной единицы: возвращаются занятые', () => {
    expect(applyScan(start(), 'TM-0302').outcome).toBe('matched')
  })

  it('замечания сотрудника попадают в сводку', () => {
    let session = applyScan(start(), 'TM-0303').session
    session = applyScan(session, 'TM-0302').session
    expect(canFinish(session)).toBe(true)
    expect(acceptNote(session)).toBe('')
    session = setCondition(session, session.items[0].key, 'problem', 'нет насадки')
    expect(acceptNote(session)).toBe('Пылесос Samsung: нет насадки')
    session = setCondition(session, session.items[0].key, 'ok')
    expect(acceptNote(session)).toBe('')
  })
})

describe('ручной ввод кода для позиции', () => {
  const issue = createIssueSession(request([unit('TM-0301'), model('vacuum')]))
  const [iron, vacuum] = issue.items.map((item) => item.key)

  it('пустое поле и неполный код — ещё не ошибка', () => {
    expect(previewCode(issue, iron, '')).toBe('empty')
    expect(previewCode(issue, iron, 'tm-03')).toBe('typing')
  })

  it('верный код своей позиции, регистр не важен', () => {
    expect(previewCode(issue, iron, ' tm-0301 ')).toBe('valid')
    expect(previewCode(issue, vacuum, 'TM-0306')).toBe('valid')
  })

  it('код чужой позиции, занятой единицы и неизвестный — неверные', () => {
    expect(previewCode(issue, iron, 'TM-0306')).toBe('invalid')
    expect(previewCode(issue, vacuum, 'TM-0303')).toBe('invalid')
    expect(previewCode(issue, iron, '12345678909876543')).toBe('invalid')
  })

  it('проверка ничего не меняет в сессии', () => {
    previewCode(issue, iron, 'TM-0301')
    expect(progress(issue)).toEqual({ done: 0, total: 2 })
  })

  it('при приёмке подходит только единица этой позиции', () => {
    const accept = createAcceptSession(request([unit('TM-0302')]))
    expect(previewCode(accept, accept.items[0].key, 'TM-0302')).toBe('valid')
    expect(previewCode(accept, accept.items[0].key, 'TM-0301')).toBe('invalid')
  })
})

describe('проблема по позиции при приёмке', () => {
  const accept = createAcceptSession(request([unit('TM-0302')]))
  const key = accept.items[0].key

  it('помечает позицию и собирает замечание из типа и описания', () => {
    const { session } = applyScan(accept, 'TM-0302')
    const next = reportProblem(session, key, { type: problemTypes[0], text: 'Треснул корпус', photos: [{ name: 'a.png', url: 'data:' }] })
    expect(next.items[0]).toMatchObject({ condition: 'problem', note: 'Повреждение: Треснул корпус' })
    expect(next.items[0].problem.photos).toHaveLength(1)
    expect(acceptNote(next)).toContain('Утюг Philips: Повреждение: Треснул корпус')
  })

  it('не меняет исходную сессию', () => {
    reportProblem(accept, key, { type: 'Другое', text: 'x' })
    expect(accept.items[0].condition).toBe('ok')
  })
})
