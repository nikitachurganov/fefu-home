export const requestSources = [
  { value: 'events', label: 'Мероприятия' },
  { value: 'equipment', label: 'Оборудование' },
  { value: 'tmc', label: 'ТМЦ' },
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
  if (request.status === 'active') return 0
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
  upcoming: { type: 'success', text: 'Заявка подтверждена. Заберите предмет в указанное время.' },
  active: { type: 'info', text: 'Предмет сейчас у вас. Верните его до конца указанного времени.' },
  review: { type: 'warning', text: 'Заявку проверяет администратор. Ответ придёт в уведомлениях.' },
  completed: { type: 'info', text: 'Заявка выполнена.' },
  rejected: { type: 'error', text: 'Заявка отклонена.' },
  cancelled: { type: 'info', text: 'Заявка отменена.' },
}

// Отменить можно только то, что ещё не началось: заявку на модерации
// или подтверждённую, но не используемую прямо сейчас.
export function canCancel(request) {
  return request.status === 'review' || request.status === 'confirmed' || request.status === 'upcoming'
}

export function cancelRequest(request, now = new Date()) {
  return { ...request, statusGroup: 'archive', status: 'cancelled', archivedAt: now.toISOString() }
}

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
  const done = request.source === 'events' ? 'Мероприятие проведено' : 'Предмет возвращён'
  const inUse = request.source === 'events' ? null : 'Предмет у вас'
  const full = ['Заявка подана', 'Модерация', 'Подтверждена', ...(inUse ? [inUse] : []), done]
  switch (request.status) {
    case 'review': return { titles: full.slice(0, 2), current: 1, status: 'process' }
    case 'confirmed':
    case 'upcoming': return { titles: full, current: 2, status: 'finish' }
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

// «Сегодня, до 14:00» для используемой заявки, «Сегодня, 12:00 — 14:00» для остальных.
export function whenLabel(request, now = new Date()) {
  const [datePart, timePart = ''] = request.date.split(/,\s(.+)/)
  const day = relativeDay(request, now) || datePart.replace(/\s\d{4}$/, '')
  const end = timePart.split('— ')[1]
  return request.status === 'active' && end ? `${day}, до ${end}` : `${day}, ${timePart}`
}
