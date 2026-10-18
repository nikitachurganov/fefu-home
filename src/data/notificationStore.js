import { computed, ref } from 'vue'
import { mockNotifications } from './notifications'
import { countUnread } from './notificationModel'

// Общее состояние для раздела «Уведомления» и бейджа в нижней навигации.
export const notifications = ref(mockNotifications.map((item) => ({ ...item })))
export const unreadCount = computed(() => countUnread(notifications.value))

export function markRead(id) {
  const item = notifications.value.find((entry) => entry.id === id)
  if (item && !item.readAt) item.readAt = new Date().toISOString()
}

export function markAllRead() {
  const now = new Date().toISOString()
  for (const item of notifications.value) if (!item.readAt) item.readAt = now
}
