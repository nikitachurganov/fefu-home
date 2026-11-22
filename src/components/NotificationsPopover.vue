<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { BellOutlined } from '@ant-design/icons-vue'
import { markRead, notifications, unreadCount } from '../data/notificationStore'
import { notificationIcons, notificationTypes, stampLabel } from '../data/notificationModel'
import alertIcon from '../assets/figma/alert.svg'

// Уведомления на ПК: иконка-колокольчик в шапке открывает поповер с последними событиями
// и кнопкой перехода на страницу всех уведомлений.
const props = defineProps({
  active: Boolean,
  outlined: Boolean,
  limit: { type: Number, default: 6 },
})
const emit = defineEmits(['open-request', 'open-schedule', 'open-all'])

const open = ref(false)
const listRef = ref(null)
const scrollbarRef = ref(null)
const scrollMetrics = ref({ top: 0, height: 100, position: 0, scrollable: false })
function updateScrollbar() {
  const list = listRef.value
  if (!list) return
  const max = list.scrollHeight - list.clientHeight
  const height = Math.min(100, Math.max(12, list.clientHeight / list.scrollHeight * 100))
  scrollMetrics.value = { height, top: max > 0 ? (list.scrollTop / max) * (100 - height) : 0, position: max > 0 ? Math.round(list.scrollTop / max * 100) : 0, scrollable: max > 1 }
}
function scrollFromPointer(event) {
  const list = listRef.value
  const track = scrollbarRef.value
  if (!list || !track) return
  const rect = track.getBoundingClientRect()
  const thumbHeight = rect.height * scrollMetrics.value.height / 100
  const travel = rect.height - thumbHeight
  if (travel <= 0) return
  const ratio = Math.max(0, Math.min(1, (event.clientY - rect.top - thumbHeight / 2) / travel))
  list.scrollTop = ratio * (list.scrollHeight - list.clientHeight)
  updateScrollbar()
}
function startScrollbarDrag(event) {
  event.preventDefault()
  event.currentTarget.setPointerCapture(event.pointerId)
  scrollFromPointer(event)
}
watch(open, async (value) => { if (value) { await nextTick(); updateScrollbar() } })
const top = computed(() => [...notifications.value]
  .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
  .slice(0, props.limit))

const bodyHeight = computed(() => {
  if (!top.value.length) return '110px'
  const itemsHeight = top.value.length * 74
  return Math.min(440, 48 + itemsHeight) + 'px'
})

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
  <a-popover
    v-model:open="open"
    :arrow="false"
    trigger="click"
    placement="bottomRight"
    overlay-class-name="notifications-popover"
  >
    <template #content>
      <div class="popover-body" :style="{ height: bodyHeight }">
        <header class="popover-head">
          <h2>Уведомления</h2>
          <a-button type="link" size="small" class="popover-all-link" @click="openAll">Все</a-button>
        </header>

        <ul v-if="top.length" id="notifications-popover-list" ref="listRef" class="popover-list" @scroll.passive="updateScrollbar">
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
        <div v-if="scrollMetrics.scrollable && top.length" ref="scrollbarRef" class="popover-scrollbar" role="scrollbar" tabindex="0" aria-controls="notifications-popover-list" aria-label="Прокрутка уведомлений" aria-orientation="vertical" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="scrollMetrics.position" @pointerdown="startScrollbarDrag" @pointermove="event => { if (event.buttons) scrollFromPointer(event) }" @keydown.down.prevent="listRef.scrollTop += 40" @keydown.up.prevent="listRef.scrollTop -= 40">
          <span class="popover-scrollbar-thumb" :style="{ top: scrollMetrics.top + '%', height: scrollMetrics.height + '%' }"></span>
        </div>
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
        <BellOutlined v-if="outlined" aria-hidden="true" />
        <img v-else :src="alertIcon" alt="" aria-hidden="true" />
        <span v-if="unreadCount" class="header-nav-badge" aria-hidden="true"></span>
      </span>
    </a-button>
  </a-popover>
</template>

<style scoped>
:global(.notifications-popover .ant-popover-inner) {
  padding: 16px 0 10px 0 !important;
  border-radius: 16px !important;
  box-shadow: 0 12px 36px rgba(18, 38, 63, 0.14), 0 2px 8px rgba(18, 38, 63, 0.06) !important;
  overflow: hidden;
}
:global(.notifications-popover .ant-popover-arrow) {
  display: none !important;
}
.popover-body {
  position: relative;
  width: 380px;
  max-width: calc(100vw - 40px);
  display: flex;
  flex-direction: column;
}
.popover-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 20px 8px 20px;
}
.popover-head h2 { margin: 0; font-size: 17px; font-weight: 700; line-height: 24px; color: #121212; }
.popover-all-link { height: auto; padding: 0; color: #2867ab; font-size: 14px; font-weight: 600; }
.popover-all-link:hover { color: #175bc7; text-decoration: underline; }

/* Абсолютное позиционирование скролла списка внутри поповера */
.popover-list {
  position: absolute;
  top: 40px;
  left: 0;
  right: 4px;
  bottom: 0;
  overflow-y: auto;
  overflow-x: hidden;
  margin: 0;
  padding: 2px 14px 4px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  list-style: none;
  scrollbar-width: none;
}
.popover-list::-webkit-scrollbar { display: none; }
.popover-scrollbar { position: absolute; top: 40px; right: 3px; bottom: 4px; z-index: 1; width: 10px; cursor: pointer; touch-action: none; }
.popover-scrollbar-thumb { position: absolute; left: 3px; width: 4px; min-height: 20px; border-radius: 999px; background: #aab4c2; }
:global(html.dark) .popover-scrollbar-thumb { background: #737d8a; }

.popover-row {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}
.popover-row:hover { background: #f5f7fa; }
.popover-row:focus-visible { outline: 3px solid rgba(22, 119, 255, .45); outline-offset: -3px; }
.popover-icon { display: grid; width: 32px; height: 32px; flex-shrink: 0; place-items: center; border-radius: 10px; background: #e6f4ff; color: #1677ff; }
.popover-icon.success { background: #f6ffed; color: #389e0d; }
.popover-icon.warning { background: #fff7e6; color: #d46b08; }
.popover-icon.danger { background: #fff1f0; color: #cf1322; }
.popover-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 2px; }
.popover-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.popover-top strong { min-width: 0; flex: 1; overflow: hidden; font-size: 14px; line-height: 20px; text-overflow: ellipsis; white-space: nowrap; }
.popover-top strong.read { font-weight: 500; }
.popover-dot { width: 8px; height: 8px; flex-shrink: 0; border-radius: 50%; background: #1677ff; }
.popover-text { display: -webkit-box; overflow: hidden; color: rgba(0, 0, 0, .65); font-size: 13px; line-height: 18px; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.popover-time { color: rgba(0, 0, 0, .55); font-size: 12px; line-height: 16px; }
.popover-empty { margin: 0; padding: 24px 20px; color: rgba(0, 0, 0, .55); font-size: 14px; text-align: center; }

:global(html.dark) .popover-head h2 { color: #f0f0f0; }
:global(html.dark) .popover-all-link { color: #91caff; }
:global(html.dark) .popover-all-link:hover { color: #b4d8ff; }
:global(html.dark) .popover-row { color: #ededed; }
:global(html.dark) .popover-row:hover { background: #30343a; }
:global(html.dark) .popover-text { color: #c0c5cc; }
:global(html.dark) .popover-time, :global(html.dark) .popover-empty { color: #a2a9b2; }
:global(html.dark) .popover-list { scrollbar-color: #616975 transparent; }
:global(html.dark) .popover-list::-webkit-scrollbar-thumb { background: #616975; }
:global(html.dark) .popover-icon { background: #1c3650; color: #8bbcff; }
:global(html.dark) .popover-icon.success { background: #243b24; color: #95d979; }
:global(html.dark) .popover-icon.warning { background: #49351f; color: #ffc06b; }
:global(html.dark) .popover-icon.danger { background: #4a2929; color: #ff9292; }
</style>
