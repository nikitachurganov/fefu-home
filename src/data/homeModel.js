import { MONTHS, parts, timerLabel } from './requestModel'

const DAY_MS = 86400000
const TIME_ZONE = 'Asia/Vladivostok'

// С этого часа (по времени кампуса) приветствие переключается на «Добрый вечер».
export const EVENING_HOUR = 18

// На сколько суток вперёд виджет «Ближайшие 3 дня» показывает события.
export const FEED_DAYS = 3
const DAY_LABELS = ['Сегодня', 'Завтра', 'Послезавтра']

const hourOf = (ms) => Number(parts(ms).time.slice(0, 2))

// Источник заявки → сервис, в котором подают новую (для «Подать заново»).
export const sourceServices = { events: 'Мероприятия', equipment: 'Бронирование', tmc: 'Аренда', workplace: 'Бронирование' }

export function greeting(nowMs = Date.now()) {
  const hour = hourOf(nowMs)
  if (hour < 5) return 'Доброй ночи'
  if (hour < 12) return 'Доброе утро'
  return hour < EVENING_HOUR ? 'Добрый день' : 'Добрый вечер'
}

// «суббота, 24 октября» — подпись под приветствием.
export const todayCaption = (nowMs = Date.now()) =>
  new Date(nowMs).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TIME_ZONE })

// Левая колонка строки ленты: время начала (или «Идёт», если началось раньше этого дня) и до какого срок.
export function slotOf(request, dayKey) {
  const start = parts(request.startsAt)
  const end = parts(request.endsAt)
  return {
    time: start.key >= dayKey ? start.time : 'Идёт',
    caption: start.key === end.key ? `до ${end.time}` : `до ${end.day} ${MONTHS[end.month - 1]}`,
  }
}

// Лента «Ближайшие 3 дня»: подтверждённые мероприятия и брони на сегодня и два следующих дня по времени кампуса.
// Активные брони (оборудование на руках) здесь не повторяются — они в «Сейчас у вас».
// Многодневное событие стоит один раз — в первом дне окна, в который оно попадает.
export function upcomingFeed(requests, nowMs = Date.now(), days = FEED_DAYS) {
  const planned = requests
    .filter((request) => request.statusGroup === 'confirmed' && request.status !== 'active' && Date.parse(request.endsAt) > nowMs)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))

  const groups = []
  const taken = new Set()
  for (let offset = 0; offset < days; offset += 1) {
    const day = parts(nowMs + offset * DAY_MS)
    const items = planned
      .filter((request) => !taken.has(request.id)
        && parts(request.startsAt).key <= day.key && parts(request.endsAt).key >= day.key)
      .map((request) => {
        taken.add(request.id)
        return { request, slot: slotOf(request, day.key) }
      })
    groups.push({ key: day.key, label: DAY_LABELS[offset] ?? `${day.day} ${MONTHS[day.month - 1]}`, caption: `${day.day} ${MONTHS[day.month - 1]}`, items })
  }
  return { groups, total: taken.size }
}

// Обратный отсчёт до начала: только в пределах суток, дальше хватает даты.
export function startsIn(request, nowMs = Date.now()) {
  const minutes = Math.round((Date.parse(request.startsAt) - nowMs) / 60000)
  if (minutes <= 0 || minutes >= 24 * 60) return ''
  if (minutes < 60) return `Через ${minutes} мин`
  const hours = Math.floor(minutes / 60)
  return minutes % 60 ? `Через ${hours} ч ${minutes % 60} мин` : `Через ${hours} ч`
}

// Длительность для текста: «6 д 4 ч», «2 ч 10 мин», «18 мин».
export function durationLabel(ms) {
  const minutes = Math.max(0, Math.floor(Math.abs(ms) / 60000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  if (days) return hours ? `${days} д ${hours} ч` : `${days} д`
  if (hours) return minutes % 60 ? `${hours} ч ${minutes % 60} мин` : `${hours} ч`
  return `${minutes} мин`
}

// Акцентный блок над «Сейчас у вас»: только просроченные возвраты, самые давние сверху.
// Пропадает из списка, когда предмет вернули.
export function attentionItems(requests, nowMs = Date.now()) {
  return requests
    .filter((request) => request.status === 'active' && timerLabel(request, nowMs).state === 'overdue')
    .sort((a, b) => Date.parse(a.endsAt) - Date.parse(b.endsAt))
    .map((request) => ({
      key: `overdue-${request.id}`,
      title: `Верните: ${request.title}`,
      body: `Срок возврата истёк ${durationLabel(nowMs - Date.parse(request.endsAt))} назад. ${request.place}`,
      action: { kind: 'request', id: request.id, label: 'Открыть заявку' },
    }))
}

// Идёт ли событие прямо сейчас — для статуса в ленте.
export const isOngoing = (request, nowMs = Date.now()) =>
  Date.parse(request.startsAt) <= nowMs && nowMs < Date.parse(request.endsAt)
