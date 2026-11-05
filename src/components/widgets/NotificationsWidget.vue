<script setup>
import { computed, ref } from 'vue'
import { BellOutlined, SettingOutlined } from '@ant-design/icons-vue'
import WidgetCard from './WidgetCard.vue'
import { markAllRead, markRead, notifications, unreadCount } from '../../data/notificationStore'
import { notificationIcons, notificationTypes, stampLabel } from '../../data/notificationModel'

const props = defineProps({ limit: { type: Number, default: 5 } })
const emit = defineEmits(['open-request', 'open-schedule', 'open-all', 'open-settings'])

// Уведомления — история событий от новых к старым. Задачи, которые требуют действия,
// поднимает виджет «Требует внимания», поэтому здесь важность порядок не меняет.
const top = computed(() => [...notifications.value]
  .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  .slice(0, props.limit))

// Без разрешения браузера пуш о возврате не придёт — подсказываем включить.
const permission = ref(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)
async function enablePush() {
  permission.value = await Notification.requestPermission()
}

function open(item) {
  markRead(item.id)
  if (item.target.kind === 'request') emit('open-request', item.target.id)
  else emit('open-schedule')
}

const iconFor = (item) => notificationIcons[notificationTypes[item.type].icon]
</script>

<template>
  <WidgetCard title="Уведомления" title-id="widget-notifications" :count="unreadCount" count-label="непрочитанных">
    <template #actions>
      <a-button type="link" size="small" :disabled="!unreadCount" @click="markAllRead">Прочитать все</a-button>
      <a-tooltip title="Настройки уведомлений">
        <a-button type="text" size="small" aria-label="Настройки уведомлений" @click="emit('open-settings')">
          <template #icon><SettingOutlined /></template>
        </a-button>
      </a-tooltip>
    </template>

    <ul v-if="top.length" class="notification-rows">
      <li v-for="item in top" :key="item.id">
        <button
          type="button"
          class="notification-row"
          :class="{ unread: !item.readAt }"
          :aria-label="`${item.title}. ${item.body}. ${stampLabel(item.createdAt)}${item.readAt ? '' : '. Не прочитано'}`"
          @click="open(item)"
        >
          <span class="notification-icon" :class="item.severity" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path :d="iconFor(item)" /></svg>
          </span>
          <span class="notification-copy">
            <span class="notification-top">
              <strong>{{ item.title }}</strong>
              <i v-if="!item.readAt" class="notification-dot" aria-hidden="true"></i>
            </span>
            <span class="notification-body">{{ item.body }}</span>
            <span class="notification-time">{{ stampLabel(item.createdAt) }}</span>
          </span>
        </button>
      </li>
    </ul>
    <p v-else class="notifications-empty">Уведомлений пока нет.</p>

    <p v-if="permission === 'default' || permission === 'denied'" class="push-hint">
      <BellOutlined aria-hidden="true" />
      <span v-if="permission === 'default'" class="push-text">Браузерные уведомления выключены.</span>
      <span v-else class="push-text">Браузерные уведомления заблокированы в настройках сайта.</span>
      <a-button v-if="permission === 'default'" type="link" size="small" class="push-enable" @click="enablePush">Включить</a-button>
    </p>

    <template #footer>
      <a-button type="link" class="widget-link" @click="emit('open-all')">Все уведомления</a-button>
    </template>
  </WidgetCard>
</template>

<style scoped>
.widget-link.ant-btn { height: 24px; padding: 0; }
.push-hint { display: flex; margin: 0; align-items: center; gap: 8px; padding-top: 12px; border-top: 1px solid #f0f0f0; color: rgba(0, 0, 0, .65); font-size: 12px; line-height: 16px; }
.push-text { flex: 1; }
.push-enable.ant-btn { height: 20px; padding: 0; font-size: 12px; }
.notification-rows { display: grid; margin: 0 -8px; padding: 0; gap: 2px; list-style: none; }
.notification-row { display: flex; width: 100%; align-items: flex-start; gap: 12px; padding: 8px; border: 0; border-radius: 12px; background: transparent; color: inherit; text-align: left; cursor: pointer; transition: background-color 160ms ease; }
.notification-row:hover { background: #fafafa; }
.notification-row:focus-visible { outline: 3px solid rgba(22, 119, 255, .45); outline-offset: 2px; }
.notification-icon { display: grid; width: 34px; height: 34px; flex-shrink: 0; place-items: center; border-radius: 10px; background: #e6f4ff; color: #1677ff; }
.notification-icon.success { background: #f6ffed; color: #389e0d; }
.notification-icon.warning { background: #fff7e6; color: #d46b08; }
.notification-icon.danger { background: #fff1f0; color: #cf1322; }
.notification-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 2px; }
.notification-top { display: flex; align-items: center; gap: 8px; }
.notification-top strong { min-width: 0; flex: 1; overflow: hidden; font-size: 14px; line-height: 20px; text-overflow: ellipsis; white-space: nowrap; }
.notification-row:not(.unread) strong { font-weight: 500; }
.notification-dot { width: 8px; height: 8px; flex-shrink: 0; border-radius: 50%; background: #1677ff; }
.notification-body { display: -webkit-box; overflow: hidden; color: rgba(0, 0, 0, .65); font-size: 13px; line-height: 18px; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.notification-time { color: rgba(0, 0, 0, .55); font-size: 12px; line-height: 16px; font-variant-numeric: tabular-nums; }
.notifications-empty { margin: 0; color: rgba(0, 0, 0, .55); font-size: 14px; }
</style>
