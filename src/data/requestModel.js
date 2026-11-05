export const requestSources = [
  { value: 'events', label: 'Мероприятия' },
  { value: 'equipment', label: 'Оборудование' },
  { value: 'tmc', label: 'ТМЦ' },
  { value: 'workplace', label: 'Места' },
]

export const requestGroups = [
  { key: 'confirmed', label: 'Активные', emptyText: 'Нет активных заявок' },
  { key: 'moderation', label: 'На модерации', emptyText: 'Нет заявок на модерации' },
  { key: 'archive', label: 'Архив', emptyText: 'В архиве пока нет заявок' },
]

export const requestStatuses = {
  confirmed: { label: 'Подтверждена', color: 'green' },
  active: { label: 'Используется сейчас', color: 'blue' },
  upcoming: { label: 'Предстоящая', color: 'green' },
  review: { label: 'На модерации', color: 'orange' },
  completed: { label: 'Завершена', color: 'default' },
  rejected: { label: 'Отклонена', color: 'red' },
  cancelled: { label: 'Отменена', color: 'default' },
  // Появляются при работе сканера: отметка на мероприятии и выдача, ожидающая фото пользователя.
  'checked-in': { label: 'Вы отметились', color: 'green' },
  issued: { label: 'Сделайте фото', color: 'gold' },
}

export const requestSortOptions = [
  { value: 'relevance', label: 'По актуальности', short: 'Актуальные', hint: 'Сначала используемые, затем ближайшие, на модерации и архив' },
  { value: 'date-asc', label: 'Дата: сначала ранние', short: 'Сначала ранние', hint: 'От самой ранней даты к самой поздней' },
  { value: 'date-desc', label: 'Дата: сначала поздние', short: 'Сначала поздние', hint: 'От самой поздней даты к самой ранней' },
]

// Группа задаётся данными, а не вычисляется из даты: прошедшие заявки
// остаются подтверждёнными до явного изменения их состояния.
// Актуальность: используется сейчас → подтверждены → на модерации → архив.
const relevanceRank = (request) => {
  if (request.status === 'active' || request.status === 'issued') return 0
  if (request.statusGroup === 'confirmed') return 1
  return request.statusGroup === 'moderation' ? 2 : 3
}
const byStart = (a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)
const comparators = {
  relevance: (a, b) => relevanceRank(a) - relevanceRank(b) || (a.statusGroup === 'archive'
    ? Date.parse(b.archivedAt) - Date.parse(a.archivedAt)
    : byStart(a, b)),
  'date-asc': byStart,
  'date-desc': (a, b) => byStart(b, a),
}

// Единая лента заявок категории с фильтром по статусу и сортировкой.
export function feedRequests(requests, source, filter = 'all', sort = 'relevance') {
  return requests
    .filter((request) => request.source === source && (filter === 'all' || request.statusGroup === filter))
    .sort(comparators[sort])
}

const TIME_ZONE = 'Asia/Vladivostok'

export const statusHints = {
  confirmed: { type: 'success', text: 'Заявка подтверждена. Приходите в указанное время.' },
  upcoming: { type: 'success', text: 'Заявка подтверждена. Приходите в указанное время и покажите код заявки сотруднику.' },
  active: { type: 'info', text: 'Предмет сейчас у вас. Верните его до конца указанного времени.' },
  review: { type: 'warning', text: 'Заявку проверяет администратор. Ответ придёт в уведомлениях.' },
  completed: { type: 'info', text: 'Заявка выполнена.' },
  rejected: { type: 'error', text: 'Заявка отклонена.' },
  cancelled: { type: 'info', text: 'Заявка отменена.' },
  'checked-in': { type: 'success', text: 'Вы отметились на мероприятии.' },
  issued: { type: 'warning', text: 'Сфотографируйте предмет или место, чтобы начать пользование.' },
}

// Отменить можно только то, что ещё не началось: заявку на модерации
// или подтверждённую, но не используемую прямо сейчас.
export function canCancel(request) {
  return request.status === 'review' || request.status === 'confirmed' || request.status === 'upcoming'
}

export function cancelRequest(request, now = new Date()) {
  return { ...request, statusGroup: 'archive', status: 'cancelled', archivedAt: now.toISOString() }
}

// Переходы заявки по итогам сканирования и действий пользователя: чистые функции, как cancelRequest.
export const checkIn = (request, now = new Date()) => ({ ...request, status: 'checked-in', checkedInAt: now.toISOString() })
export const startAfterPhoto = (request, photo, now = new Date()) => ({ ...request, status: 'active', photo, startedAt: now.toISOString() })
// Сотрудник подтвердил выдачу: items уже содержат конкретные единицы, остаётся фото пользователя.
export const confirmIssue = (request, items = request.items) => ({ ...request, status: 'issued', items })
// Приёмка или чекаут завершены: заявка уходит в архив, замечание сотрудника сохраняется.
export const completeRequest = (request, note = '', now = new Date()) => ({
  ...request,
  statusGroup: 'archive',
  status: 'completed',
  archivedAt: now.toISOString(),
  ...(note ? { returnNote: note } : {}),
})
export const addProblem =(request, text, now = new Date()) => ({ ...request, problems: [...(request.problems ?? []), { text, createdAt: now.toISOString() }] })

const dayKey = (date) => new Date(date).toLocaleDateString('en-CA', { timeZone: TIME_ZONE })

// «Сегодня» / «Завтра» только для актуальных заявок; для архива подпись не нужна.
export function relativeDay(request, now = new Date()) {
  if (request.statusGroup === 'archive') return ''
  const day = dayKey(request.startsAt)
  if (day === dayKey(now)) return 'Сегодня'
  if (day === dayKey(now.getTime() + 86400000)) return 'Завтра'
  return ''
}

// Количество заявок, требующих внимания (не архив) по каждому источнику.
export function countOpenBySource(requests) {
  return requests.reduce((acc, request) => {
    if (request.statusGroup !== 'archive') acc[request.source] = (acc[request.source] ?? 0) + 1
    return acc
  }, {})
}

// Шаги жизненного цикла заявки для вертикального таймлайна.
export function requestSteps(request) {
  const isEvent = request.source === 'events'
  const isPlace = request.source === 'workplace'
  const done = isEvent ? 'Мероприятие проведено' : isPlace ? 'Место сдано' : 'Предмет возвращён'
  const middle = isEvent ? 'Вы отметились' : isPlace ? 'Место за вами' : 'Предмет у вас'
  const full = ['Заявка подана', 'Модерация', 'Подтверждена', middle, done]
  switch (request.status) {
    case 'review': return { titles: full.slice(0, 2), current: 1, status: 'process' }
    case 'confirmed':
    case 'upcoming': return { titles: full, current: 2, status: 'finish' }
    // Выдача подтверждена, но пользователь ещё не сфотографировал предмет.
    case 'issued': return { titles: full, current: 2, status: 'process' }
    case 'checked-in': return { titles: full, current: 3, status: 'finish' }
    case 'active': return { titles: full, current: 3, status: 'process' }
    case 'completed': return { titles: full, current: full.length - 1, status: 'finish' }
    case 'rejected': return { titles: ['Заявка подана', 'Модерация', 'Отклонена'], current: 2, status: 'error' }
    default: return { titles: ['Заявка подана', 'Отменена'], current: 1, status: 'finish' }
  }
}

// Чипы статусов над списком: «Все» показывает секции, остальные — плоский список одной группы.
export const requestFilters = [
  { value: 'all', label: 'Все статусы' },
  ...requestGroups.map((group) => ({ value: group.key, label: group.label })),
]

export function countByFilter(requests, source) {
  const sourceRequests = requests.filter((request) => request.source === source)
  return Object.fromEntries(requestFilters.map((filter) => [
    filter.value,
    filter.value === 'all' ? sourceRequests.length : sourceRequests.filter((request) => request.statusGroup === filter.value).length,
  ]))
}

// Заявки для карусели «Ближайшие»: сначала используемые прямо сейчас, затем по времени начала.
export function pickHighlights(requests, limit = 5) {
  return requests
    .filter((request) => request.statusGroup === 'confirmed')
    .sort((a, b) => (b.status === 'active') - (a.status === 'active') || Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .slice(0, limit)
}

export const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

// Дата и время в часовом поясе кампуса: sv-SE даёт стабильный формат «ГГГГ-ММ-ДД ЧЧ:ММ:СС».
export function parts(iso) {
  const [key, time] = new Date(iso).toLocaleString('sv-SE', { timeZone: TIME_ZONE }).split(' ')
  const [year, month, day] = key.split('-').map(Number)
  return { key, year, month, day, time: time.slice(0, 5) }
}

// «24.09.2026, 18:00» — точная дата и время для сводок вроде «Сессия завершена».
export function dateTimeLabel(iso) {
  const { day, month, year, time } = parts(iso)
  return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}.${year}, ${time}`
}

export const isMultiDay = (request) => parts(request.startsAt).key !== parts(request.endsAt).key

// Полный формат — для деталей заявки; compact (без года, короткие месяцы) — для карточек,
// где многодневное «25 октября 2026, 10:00 — 26 октября 2026, 18:00» не помещается в строку.
export function formatWhen(request, { compact = false } = {}) {
  const start = parts(request.startsAt)
  const end = parts(request.endsAt)
  const day = (p) => (compact ? `${p.day} ${MONTHS_SHORT[p.month - 1]}` : `${p.day} ${MONTHS[p.month - 1]} ${p.year}`)
  // Неразрывные пробелы внутри даты: строка переносится только у тире, а не посреди «26 октября 2026, 18:00».
  const keep = (text) => text.replaceAll(' ', ' ')
  const from = keep(`${day(start)}, ${start.time}`)
  const to = start.key === end.key ? end.time : keep(`${day(end)}, ${end.time}`)
  return `${from} — ${to}`
}

// Подпись для карусели: «Сегодня, до 14:00» у используемой заявки, иначе «Сегодня, 12:00 — 14:00».
export function whenLabel(request, now = new Date()) {
  const start = parts(request.startsAt)
  const end = parts(request.endsAt)
  const day = relativeDay(request, now) || `${start.day} ${MONTHS[start.month - 1]}`
  const endText = isMultiDay(request) ? `${end.day} ${MONTHS_SHORT[end.month - 1]}, ${end.time}` : end.time
  return request.status === 'active' ? `${day}, до ${endText}` : `${day}, ${start.time} — ${endText}`
}

// Таймер активной заявки: сколько осталось до конца или сколько прошло после него.
// text — «ЧЧ:ММ:СС» (с днями, если больше суток), spoken — для скринридера без секунд,
// percent — заполненность прогресс-бара.
// За сколько до конца аренды заявка считается «подходящей к концу» (жёлтая плитка).
export const NEAR_END_MS = 30 * 60 * 1000

export function timerLabel(request, nowMs = Date.now()) {
  const diff = Date.parse(request.endsAt) - nowMs
  const total = Math.floor(Math.abs(diff) / 1000)
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const pad = (value) => String(value).padStart(2, '0')
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(total % 60)}`
  const length = Date.parse(request.endsAt) - Date.parse(request.startsAt)
  return {
    overdue: diff < 0,
    // normal — идёт как обычно, soon — подходит к концу, overdue — просрочена.
    state: diff < 0 ? 'overdue' : diff <= NEAR_END_MS ? 'soon' : 'normal',
    // Доля прошедшего времени аренды от 0 до 100; после срока — полная шкала.
    percent: length > 0 ? Math.min(100, Math.max(0, Math.round(((nowMs - Date.parse(request.startsAt)) / length) * 100))) : 100,
    text: days ? `${days} д ${clock}` : clock,
    spoken: `${days * 24 + hours} ч ${minutes} мин`,
  }
}
