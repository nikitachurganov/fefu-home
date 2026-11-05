// Формат кодов сканера: «FEFU-ONE:<ВИД>:<ID>». Префикс совпадает с личным QR, который был раньше.
// Паспортные коды постоянные, их id — короткий код с наклейки («EQ-0142»); он же вводится вручную.
// Коды действий (чекин, пара, заявка, возврат, чекаут) показываются в интерфейсе и вручную не вводятся.
export const CODE_PREFIX = 'FEFU-ONE'

export const codeKinds = {
  passport: 'P',
  checkin: 'CHECKIN',
  class: 'CLASS',
  // Код студента — персональный QR из шторки студенческого билета; сканирует преподаватель.
  student: 'STUDENT',
  request: 'REQUEST',
  return: 'RETURN',
  checkout: 'CHECKOUT',
}

const kindByToken = Object.fromEntries(Object.entries(codeKinds).map(([kind, token]) => [token, kind]))

// Паспортные коды — единственные, которые можно ввести руками.
export const isActionKind = (kind) => kind !== 'passport'

// Коды сотрудника: их показывает пользователь, а сканирует только сотрудник (заявка, возврат, чекаут).
// Остальные коды (паспорта, чекин, пара) — пользовательские: их сканирует любой.
// Коды студента — студент показывает преподавателю, преподаватель сканирует.
export const staffKinds = ['request', 'return', 'checkout']
export const teacherOnlyKinds = ['student']

export const isStaffKind = (kind) => staffKinds.includes(kind)
export const isTeacherKind = (kind) => teacherOnlyKinds.includes(kind)

export function buildCode(kind, id) {
  return `${CODE_PREFIX}:${codeKinds[kind]}:${id}`
}

// Разбор текста из QR: { kind, id } или null, если это не код FEFU One.
export function parseCode(text) {
  const [prefix, token, ...rest] = String(text ?? '').trim().split(':')
  const id = rest.join(':').trim()
  if (prefix !== CODE_PREFIX || !(token in kindByToken) || !id) return null
  return { kind: kindByToken[token], id }
}

// Короткий код с наклейки: 2–4 буквы, дефис, 3–5 цифр.
const SHORT_CODE = /^[A-Z]{2,4}-\d{3,5}$/

export const isShortCode = (input) => SHORT_CODE.test(String(input ?? '').trim().toUpperCase())

// Ручной ввод: короткий код превращается в паспортный код, всё остальное возвращается как есть,
// чтобы конвейер проверок сам объяснил, почему такой ввод не подходит.
export function normalizeManual(input) {
  const text = String(input ?? '').trim()
  return isShortCode(text) ? buildCode('passport', text.toUpperCase()) : text
}
