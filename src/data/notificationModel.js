import { MONTHS, parts } from './requestModel'

// Категории для фильтра в шторке.
export const notificationCategories = [
  { value: 'all', label: 'Все' },
  { value: 'requests', label: 'Заявки' },
  { value: 'booking', label: 'Бронь и возврат' },
  { value: 'classes', label: 'Пары' },
]

// Тип уведомления → категория и иконка. Иконки рисуются в компоненте по ключу.
// Правила срабатывания (на стороне сервера, здесь только для справки):
//  booking_reminder — за 60 мин до начала брони;
//  class_soon — за 15 мин до пары, затем заменяется на class_started;
//  return_soon — за 30 мин до конца брони, затем заменяется на return_overdue;
//  return_overdue — через 15 мин после конца без возврата, повтор раз в час;
//  booking_missed — бронь не использована за 15 мин после начала;
//  class_missed — пара без отметки.
export const notificationTypes = {
  request_status: { category: 'requests', icon: 'doc' },
  booking_reminder: { category: 'booking', icon: 'calendar' },
  class_soon: { category: 'classes', icon: 'cap' },
  class_started: { category: 'classes', icon: 'cap' },
  return_soon: { category: 'booking', icon: 'box' },
  return_overdue: { category: 'booking', icon: 'alert' },
  booking_missed: { category: 'booking', icon: 'alert' },
  class_missed: { category: 'classes', icon: 'alert' },
}

// Контуры иконок (24×24, stroke), цвет задаёт важность уведомления.
export const notificationIcons = {
  doc: 'M7 3h7l5 5v13H7z M14 3v5h5 M10 13h6 M10 17h6',
  calendar: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  cap: 'M2 9l10-5 10 5-10 5z M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5',
  box: 'M4 8l8-4 8 4v9l-8 4-8-4z M4 8l8 4 8-4 M12 12v9',
  alert: 'M12 3l10 18H2z M12 10v5 M12 18h.01',
}

export const isUrgent = (notification) => notification.severity === 'danger'

export function filterByCategory(notifications, category = 'all') {
  return category === 'all'
    ? notifications
    : notifications.filter((item) => notificationTypes[item.type].category === category)
}

export const countUnread = (notifications, category = 'all') =>
  filterByCategory(notifications, category).filter((item) => !item.readAt).length

export function unreadByCategory(notifications) {
  return Object.fromEntries(notificationCategories.map((category) => [category.value, countUnread(notifications, category.value)]))
}

const dayKey = (iso) => parts(iso).key

// Заголовок группы: «Сегодня», «Вчера» или «12 октября».
function dayLabel(iso, now) {
  const key = dayKey(iso)
  if (key === dayKey(now)) return 'Сегодня'
  if (key === dayKey(new Date(now).getTime() - 86400000)) return 'Вчера'
  const p = parts(iso)
  return `${p.day} ${MONTHS[p.month - 1]}`
}

// Лента по дням: новые сверху, внутри дня тоже от новых к старым.
export function groupByDay(notifications, now = new Date()) {
  const groups = []
  const sorted = [...notifications].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  for (const item of sorted) {
    const key = dayKey(item.createdAt)
    let group = groups.find((entry) => entry.key === key)
    if (!group) {
      group = { key, label: dayLabel(item.createdAt, now), items: [] }
      groups.push(group)
    }
    group.items.push(item)
  }
  return groups
}

export const formatTime = (iso) => parts(iso).time

// Подпись времени в компактном списке: «Сегодня, 15:20», «Вчера, 10:00», «16 октября, 12:05».
export const stampLabel = (iso, now = new Date()) => `${dayLabel(iso, now)}, ${formatTime(iso)}`
