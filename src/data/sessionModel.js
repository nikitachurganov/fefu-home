import { assets, descendantsOf, findAsset, tmcModels } from './assets'

// Сессия — режим сканера для сотрудника: список позиций заявки и серия сканов паспортов единиц
// (docs/scanner.md, §5.3). Модель чистая: каждая операция возвращает новую сессию.
// Позиция заявки: { key, kind: 'unit' | 'model', modelId, expectedUnitId, unitId, condition, note, replaced }
//   unit  — подходит только expectedUnitId (всё оборудование и часть ТМЦ);
//   model — подходит любая свободная единица модели, отсканированная закрепляется (unitId).

export const sessionKinds = {
  issue: { title: 'Выдача', verb: 'выдать' },
  accept: { title: 'Приёмка', verb: 'принять' },
  inventory: { title: 'Инвентаризация', verb: 'проверить' },
}

function itemsFrom(request, prefilled) {
  return (request.items ?? []).map((item, index) => {
    const asset = item.unitId ? findAsset(item.unitId) : null
    return {
      key: `${request.id}-${index}`,
      kind: item.kind,
      modelId: item.modelId ?? asset?.modelId ?? null,
      expectedUnitId: item.kind === 'unit' ? item.unitId : null,
      // При приёмке единица уже известна из выдачи; при выдаче появится после скана.
      unitId: null,
      expectedForAccept: prefilled ? item.unitId : null,
      condition: 'ok',
      note: '',
      replaced: false,
      blocked: false,
    }
  })
}

export const createIssueSession = (request) => ({ kind: 'issue', requestId: request.id, items: itemsFrom(request, false) })
export const createAcceptSession = (request) => ({ kind: 'accept', requestId: request.id, items: itemsFrom(request, true) })

export const isDone = (item) => item.unitId !== null
export const progress = (session) => ({ done: session.items.filter(isDone).length, total: session.items.length })
export const canFinish = (session) => session.items.length > 0 && session.items.every(isDone)

// Подпись позиции: у модели — название модели, у конкретной единицы — её название из паспорта.
export function itemLabel(item) {
  const asset = findAsset(item.expectedUnitId ?? item.expectedForAccept)
  if (item.kind === 'model') return `${tmcModels[item.modelId] ?? 'Позиция'} (любая свободная)`
  return asset?.title ?? 'Позиция'
}

const withItem = (session, index, patch) => ({
  ...session,
  items: session.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
})

const isFree = (asset) => asset.status === 'available'

// Применяет скан паспорта к сессии. outcome:
//   matched        — единица подошла и закреплена за позицией;
//   replaced       — выдан аналог вместо недоступной единицы;
//   unavailable    — единица из заявки занята или на обслуживании, нужен аналог;
//   duplicate      — эту единицу уже отсканировали;
//   not-in-request — единицы нет в заявке (или это не оборудование).
export function applyScan(session, assetId) {
  const asset = findAsset(assetId)
  if (!asset || asset.type !== 'equipment') return { session, outcome: 'not-in-request', asset }

  if (session.items.some((item) => item.unitId === asset.id)) return { session, outcome: 'duplicate', asset }

  return session.kind === 'accept' ? applyAccept(session, asset) : applyIssue(session, asset)
}

function applyIssue(session, asset) {
  const pending = (predicate) => session.items.findIndex((item) => !isDone(item) && predicate(item))

  // 1. Конкретная единица из заявки.
  const exact = pending((item) => item.kind === 'unit' && item.expectedUnitId === asset.id)
  if (exact !== -1) {
    if (!isFree(asset)) return { session: withItem(session, exact, { blocked: true }), outcome: 'unavailable', asset }
    return { session: withItem(session, exact, { unitId: asset.id }), outcome: 'matched', asset }
  }

  // 2. Позиция-модель: подходит любая свободная единица этой модели.
  const model = pending((item) => item.kind === 'model' && item.modelId === asset.modelId)
  if (model !== -1) {
    if (!isFree(asset)) return { session, outcome: 'unavailable', asset }
    return { session: withItem(session, model, { unitId: asset.id }), outcome: 'matched', asset }
  }

  // 3. Аналог: единица той же модели вместо заказанной, которая оказалась недоступна.
  const analog = pending((item) => {
    if (item.kind !== 'unit' || item.modelId !== asset.modelId) return false
    return item.blocked || !isFree(findAsset(item.expectedUnitId))
  })
  if (analog !== -1) {
    if (!isFree(asset)) return { session, outcome: 'unavailable', asset }
    return { session: withItem(session, analog, { unitId: asset.id, replaced: true }), outcome: 'replaced', asset }
  }

  return { session, outcome: 'not-in-request', asset }
}

function applyAccept(session, asset) {
  const index = session.items.findIndex((item) => !isDone(item) && item.expectedForAccept === asset.id)
  if (index === -1) return { session, outcome: 'not-in-request', asset }
  return { session: withItem(session, index, { unitId: asset.id }), outcome: 'matched', asset }
}

// Проверка кода, введённого вручную для одной позиции: ничего не меняет, только отвечает, подошёл бы он.
// empty — поле пустое; typing — код ещё вводят; invalid — не подходит этой позиции; valid — подходит.
// Код вводят целиком (например, TM-0301), поэтому до 7 символов ошибку не показываем.
const FULL_CODE_LENGTH = 7

export function previewCode(session, key, text) {
  const id = String(text ?? '').trim().toUpperCase()
  if (!id) return 'empty'
  const { session: next } = applyScan(session, id)
  if (next.items.find((item) => item.key === key)?.unitId === id) return 'valid'
  return id.length < FULL_CODE_LENGTH ? 'typing' : 'invalid'
}

// Типы проблем для формы «Проблема с ТМЦ» при приёмке.
export const problemTypes = ['Повреждение', 'Не работает', 'Неполная комплектация', 'Загрязнение', 'Другое']

// Проблема по позиции при приёмке: единица уйдёт на обслуживание, а замечание попадёт в заявку.
// photos — [{ name, url }], фото обязательно подтверждает проблему.
export const reportProblem = (session, key, { type, text, photos = [] }) => ({
  ...session,
  items: session.items.map((item) => (item.key === key
    ? { ...item, condition: 'problem', note: [type, text].filter(Boolean).join(': '), problem: { type, text, photos } }
    : item)),
})

// Состояние принятой единицы: 'ok' или 'problem' с комментарием сотрудника.
export const setCondition = (session, key, condition, note = '') => ({
  ...session,
  items: session.items.map((item) => (item.key === key ? { ...item, condition, note: condition === 'ok' ? '' : note } : item)),
})

// Единицы, выданные заявкой: после выдачи в заявке хранятся конкретные unitId.
export const resolvedItems = (session) => session.items.map((item) => ({ kind: 'unit', modelId: item.modelId, unitId: item.unitId }))

export const problemItems = (session) => session.items.filter((item) => item.condition === 'problem')

// Сводка замечаний сотрудника для записи в заявку.
export function acceptNote(session) {
  return problemItems(session)
    .map((item) => `${findAsset(item.unitId)?.title ?? item.unitId}${item.note ? `: ${item.note}` : ''}`)
    .join('; ')
}

// Инвентаризация (docs/scanner.md, §6.7): область задаёт паспорт актива или помещения. Ожидаемые единицы —
// всё оборудование и рабочие места внутри него, кроме списанных. Скан может найти ожидаемую единицу,
// единицу из другого места («числится в другом месте») или неизвестный код. Результат не сохраняется.
const INVENTORY_TYPES = ['equipment', 'workplace']
// Область инвентаризации — контейнер: актив (здание) или помещение; отдельную единицу не проверяют.
const INVENTORY_ROOT_TYPES = ['asset', 'room']
export const canInventory = (asset) => INVENTORY_ROOT_TYPES.includes(asset?.type)

export function createInventorySession(root) {
  const expected = descendantsOf(root)
    .filter((asset) => INVENTORY_TYPES.includes(asset.type) && asset.status !== 'written-off')
    .map((asset) => ({ id: asset.id, found: false }))
  return { kind: 'inventory', rootId: root.id, expected, extras: [] }
}

// outcome: found · duplicate · elsewhere (единица есть в системе, но не в этой области) · unknown (кода нет в системе).
export function applyInventoryScan(session, assetId) {
  const id = String(assetId).trim().toUpperCase()
  const asset = findAsset(id)
  const index = session.expected.findIndex((entry) => entry.id === id)

  if ((index !== -1 && session.expected[index].found) || session.extras.some((extra) => extra.id === id)) {
    return { session, outcome: 'duplicate', asset }
  }
  if (index !== -1) {
    const expected = session.expected.map((entry, i) => (i === index ? { ...entry, found: true } : entry))
    return { session: { ...session, expected }, outcome: 'found', asset }
  }
  const reason = asset ? 'elsewhere' : 'unknown'
  return { session: { ...session, extras: [...session.extras, { id, reason }] }, outcome: reason, asset }
}

export function inventorySummary(session) {
  return {
    total: session.expected.length,
    found: session.expected.filter((entry) => entry.found).map((entry) => entry.id),
    missing: session.expected.filter((entry) => !entry.found).map((entry) => entry.id),
    elsewhere: session.extras.filter((extra) => extra.reason === 'elsewhere').map((extra) => extra.id),
    unknown: session.extras.filter((extra) => extra.reason === 'unknown').map((extra) => extra.id),
  }
}

// Демо-коды единиц для проверки без камеры: свободные и недоступные, чтобы были видны все исходы.
export const demoUnits = () => assets.filter((asset) => asset.type === 'equipment' && asset.status !== 'written-off')
