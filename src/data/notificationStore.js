import { computed, ref } from 'vue'
import { mockNotifications } from './notifications'
import { countUnread } from './notificationModel'

// Общее состояние для раздела «Уведомления» и бейджа в нижней навигации.
export const notifications = ref(mockNotifications.map((item) => ({ ...item })))
export const unreadCount = computed(() => countUnread(notifications.value))

// Новое уведомление для событий сканера (отметка, выдача, возврат). На сервере его создаст бэкенд.
let sequence = 100
export function pushNotification({ type = 'request_status', severity = 'info', title, body, target = null }) {
  notifications.value.unshift({ id: `n${++sequence}`, type, severity, createdAt: new Date().toISOString(), readAt: null, title, body, target })
}

export function markRead(id) {
  const item = notifications.value.find((entry) => entry.id === id)
  if (item && !item.readAt) item.readAt = new Date().toISOString()
}

export function markAllRead() {
  const now = new Date().toISOString()
  for (const item of notifications.value) if (!item.readAt) item.readAt = now
}
