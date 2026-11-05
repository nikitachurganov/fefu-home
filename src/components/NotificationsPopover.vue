<script setup>
import { computed, ref } from 'vue'
import { markAllRead, markRead, notifications, unreadCount } from '../data/notificationStore'
import { notificationIcons, notificationTypes, stampLabel } from '../data/notificationModel'
import alertIcon from '../assets/figma/alert.svg'

// Уведомления на ПК: иконка-колокольчик в шапке открывает поповер с последними событиями
// и кнопкой перехода на страницу всех уведомлений.
const props = defineProps({
  active: Boolean,
  limit: { type: Number, default: 6 },
})
const emit = defineEmits(['open-request', 'open-schedule', 'open-all'])

const open = ref(false)
const top = computed(() => [...notifications.value]
  .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  .slice(0, props.limit))

function openItem(item) {
  markRead(item.id)
  open.value = false
  if (item.target.kind === 'request') emit('open-request', item.target.id)
  else emit('open-schedule')
}

function openAll() {
  open.value = false
  emit('open-all')
}

const iconFor = (item) => notificationIcons[notificationTypes[item.type].icon]
</script>

<template>
  <a-popover v-model:open="open" trigger="click" placement="bottomRight" overlay-class-name="notifications-popover">
    <template #content>
      <div class="popover-body">
        <header class="popover-head">
          <h2>Уведомления</h2>
          <a-button type="link" size="small" :disabled="!unreadCount" @click="markAllRead">Прочитать все</a-button>
        </header>

        <ul v-if="top.length" class="popover-list">
          <li v-for="item in top" :key="item.id">
            <button
              type="button"
              class="popover-row"
              :aria-label="`${item.title}. ${item.body}. ${stampLabel(item.createdAt)}${item.readAt ? '' : '. Не прочитано'}`"
              @click="openItem(item)"
            >
              <span class="popover-icon" :class="item.severity" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path :d="iconFor(item)" /></svg>
              </span>
              <span class="popover-copy">
                <span class="popover-top">
                  <strong :class="{ read: item.readAt }">{{ item.title }}</strong>
                  <i v-if="!item.readAt" class="popover-dot" aria-hidden="true"></i>
                </span>
                <span class="popover-text">{{ item.body }}</span>
                <span class="popover-time">{{ stampLabel(item.createdAt) }}</span>
              </span>
            </button>
          </li>
        </ul>
        <p v-else class="popover-empty">Уведомлений пока нет.</p>

        <a-button block class="popover-all" @click="openAll">Все уведомления</a-button>
      </div>
    </template>

    <a-button
      type="text"
      class="header-button header-nav"
      :class="{ active: active || open }"
      :aria-label="unreadCount ? `Уведомления, непрочитанных: ${unreadCount}` : 'Уведомления'"
      aria-haspopup="dialog"
      :aria-expanded="open"
    >
      <span class="header-nav-icon">
        <img :src="alertIcon" alt="" aria-hidden="true" />
        <span v-if="unreadCount" class="header-nav-badge" aria-hidden="true"></span>
      </span>
    </a-button>
  </a-popover>
</template>

<style scoped>
.popover-body { display: flex; width: 380px; max-width: calc(100vw - 32px); flex-direction: column; gap: 8px; }
.popover-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.popover-head h2 { margin: 0; font-size: 16px; font-weight: 700; line-height: 24px; }
.popover-list { display: grid; max-height: 420px; margin: 0 -8px; padding: 0; gap: 2px; overflow-y: auto; list-style: none; }
.popover-row { display: flex; width: 100%; align-items: flex-start; gap: 10px; padding: 8px; border: 0; border-radius: 10px; background: transparent; color: inherit; text-align: left; cursor: pointer; }
.popover-row:hover { background: #fafafa; }
.popover-row:focus-visible { outline: 3px solid rgba(22, 119, 255, .45); outline-offset: -3px; }
.popover-icon { display: grid; width: 32px; height: 32px; flex-shrink: 0; place-items: center; border-radius: 10px; background: #e6f4ff; color: #1677ff; }
.popover-icon.success { background: #f6ffed; color: #389e0d; }
.popover-icon.warning { background: #fff7e6; color: #d46b08; }
.popover-icon.danger { background: #fff1f0; color: #cf1322; }
.popover-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 2px; }
.popover-top { display: flex; align-items: center; gap: 8px; }
.popover-top strong { min-width: 0; flex: 1; overflow: hidden; font-size: 14px; line-height: 20px; text-overflow: ellipsis; white-space: nowrap; }
.popover-top strong.read { font-weight: 500; }
.popover-dot { width: 8px; height: 8px; flex-shrink: 0; border-radius: 50%; background: #1677ff; }
.popover-text { display: -webkit-box; overflow: hidden; color: rgba(0, 0, 0, .65); font-size: 13px; line-height: 18px; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.popover-time { color: rgba(0, 0, 0, .55); font-size: 12px; line-height: 16px; }
.popover-empty { margin: 0; padding: 12px 0; color: rgba(0, 0, 0, .55); font-size: 14px; }
.popover-all.ant-btn { margin-top: 4px; }
</style>
