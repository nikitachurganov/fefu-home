<script setup>
import { computed, ref } from 'vue'
import { markAllRead, markRead, notifications, unreadCount } from '../data/notificationStore'
import {
  filterByCategory,
  formatTime,
  groupByDay,
  notificationCategories,
  notificationIcons,
  notificationTypes,
  unreadByCategory,
} from '../data/notificationModel'

defineProps({ authenticated: Boolean })
const emit = defineEmits(['login', 'open-request', 'open-schedule'])

const selectedCategory = ref('all')

const filtered = computed(() => filterByCategory(notifications.value, selectedCategory.value))
const groups = computed(() => groupByDay(filtered.value))
const unreadBy = computed(() => unreadByCategory(notifications.value))
function openNotification(item) {
  markRead(item.id)
  if (item.target.kind === 'request') emit('open-request', item.target.id)
  else emit('open-schedule')
}

const iconFor = (item) => notificationIcons[notificationTypes[item.type].icon]
</script>

<template>
  <section class="notifications-page" aria-labelledby="notifications-title">
    <div class="notifications-title">
      <a-typography-title id="notifications-title" :level="3">Уведомления</a-typography-title>
      <a-button v-if="authenticated" type="link" class="read-all" :disabled="!unreadCount" @click="markAllRead">Прочитать все</a-button>
    </div>

    <div v-if="!authenticated" class="notifications-login">
      <a-empty description="Войдите, чтобы видеть уведомления" />
      <a-button type="primary" size="large" @click="emit('login')">Войти в аккаунт</a-button>
    </div>

    <template v-else>
      <div class="notifications-bar">
        <a-tabs v-model:active-key="selectedCategory" class="notification-tabs" aria-label="Тип уведомлений">
          <a-tab-pane v-for="category in notificationCategories" :key="category.value">
            <template #tab>
              {{ category.label }}
              <span
                v-if="category.value !== 'all' && unreadBy[category.value]"
                class="tab-count"
                :aria-label="`, непрочитанных: ${unreadBy[category.value]}`"
              >{{ unreadBy[category.value] }}</span>
            </template>
          </a-tab-pane>
        </a-tabs>
      </div>

      <div v-if="groups.length" class="notification-groups">
        <section v-for="group in groups" :key="group.key" class="notification-group" :aria-labelledby="`notification-group-${group.key}`">
          <h3 :id="`notification-group-${group.key}`" class="day-divider">{{ group.label }}</h3>
          <div class="notification-list">
            <button
              v-for="item in group.items"
              :key="item.id"
              type="button"
              class="notification-card"
              :class="{ unread: !item.readAt }"
              :aria-label="`${item.title}. ${item.body}. ${formatTime(item.createdAt)}${item.readAt ? '' : '. Не прочитано'}`"
              @click="openNotification(item)"
            >
              <span class="notification-icon" :class="item.severity" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path :d="iconFor(item)" /></svg>
              </span>
              <span class="notification-copy">
                <span class="notification-top">
                  <strong>{{ item.title }}</strong>
                  <i v-if="!item.readAt" class="notification-dot" aria-hidden="true"></i>
                </span>
                <span class="notification-row">
                  <span class="notification-body">{{ item.body }}</span>
                  <span class="notification-time">{{ formatTime(item.createdAt) }}</span>
                </span>
              </span>
            </button>
          </div>
        </section>
      </div>

      <a-empty
        v-else
        class="notifications-empty"
        :description="notifications.length ? 'Нет уведомлений этого типа' : 'Уведомлений пока нет'"
      >
        <a-button v-if="notifications.length" @click="selectedCategory = 'all'">Показать все</a-button>
      </a-empty>
    </template>


  </section>
</template>

<style scoped>
.notifications-page {
  --n-primary: #1677ff;
  --n-secondary: rgba(0, 0, 0, .65);
  --n-surface: #fff;
  --n-radius: 12px;
  color: rgba(0, 0, 0, .88);
}
.notifications-title { display: flex; margin: 0 -12px; padding: 16px 12px 12px; align-items: center; justify-content: space-between; gap: 8px; background: var(--n-surface); }
.notifications-title :deep(.ant-typography) { margin: 0; }
.read-all.ant-btn { height: 44px; padding: 0 4px; }
.notifications-login { display: grid; margin: 0 -12px; padding: 24px 12px; justify-items: center; gap: 12px; background: var(--n-surface); }
.notifications-bar { position: sticky; z-index: 1; top: 56px; margin: 0 -12px; padding: 0 12px; border-bottom: 1px solid rgba(0, 0, 0, .1); background: var(--n-surface); }
.notification-tabs :deep(.ant-tabs-nav) { margin: 0; }
.notification-tabs :deep(.ant-tabs-nav::before) { border-bottom: 0; }
.notification-tabs :deep(.ant-tabs-tab) { min-height: 44px; padding: 10px 0; font-size: 14px; }
.notification-tabs :deep(.ant-tabs-tab + .ant-tabs-tab) { margin-left: 12px; }
.notification-tabs :deep(.ant-tabs-content-holder) { display: none; }
.tab-count { display: inline-grid; min-width: 18px; height: 18px; margin-left: 4px; padding: 0 4px; place-items: center; border-radius: 9px; background: rgba(0, 0, 0, .06); font-size: 12px; line-height: 18px; font-variant-numeric: tabular-nums; }
.ant-tabs-tab-active .tab-count { background: #e6f4ff; color: var(--n-primary); }
.notification-groups { display: grid; gap: 16px; margin-top: 16px; }
.day-divider { display: flex; width: 100%; margin: 0 0 12px; align-items: center; gap: 16px; color: rgba(0, 0, 0, .45); font-size: 12px; font-weight: 400; line-height: 16px; white-space: nowrap; }
.day-divider::before, .day-divider::after { flex: 1; border-top: 1px dashed #d9d9d9; content: ''; }
.notification-list { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
.notification-card { display: flex; width: 100%; align-items: flex-start; gap: 12px; padding: 12px; border: 0; border-radius: var(--n-radius); background: var(--n-surface); color: inherit; text-align: left; cursor: pointer; transition: opacity 150ms ease; }
.notification-card:active { opacity: .8; }
.notification-card:focus-visible { outline: 3px solid var(--n-primary); outline-offset: 2px; }
.notification-icon { display: grid; flex: 0 0 40px; width: 40px; height: 40px; place-items: center; border-radius: 10px; background: #e6f4ff; color: var(--n-primary); }
.notification-icon.success { background: #f6ffed; color: #389e0d; }
.notification-icon.warning { background: #fff7e6; color: #d46b08; }
.notification-icon.danger { background: #fff1f0; color: #cf1322; }
.notification-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; align-items: flex-start; gap: 4px; }
.notification-top { display: flex; width: 100%; align-items: center; gap: 8px; }
.notification-top strong { min-width: 0; flex: 1; overflow: hidden; font-size: 15px; line-height: 20px; text-overflow: ellipsis; white-space: nowrap; }
.notification-time { flex-shrink: 0; color: var(--n-secondary); font-size: 12px; font-variant-numeric: tabular-nums; line-height: 18px; }
.notification-dot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; background: var(--n-primary); }
.notification-row { display: flex; width: 100%; align-items: flex-end; gap: 12px; }
.notification-body { min-width: 0; flex: 1; display: -webkit-box; overflow: hidden; color: var(--n-secondary); font-size: 13px; line-height: 18px; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.notifications-empty { padding: 48px 0; }
/* ПК: мобильные белые полосы на отрицательных отступах становятся карточками на сером фоне;
   заголовок и «Прочитать все» — над ними, вкладки — в закруглённой плашке, карточки крупнее. */
@media (min-width: 1024px) {
  .notifications-title { margin: 0; padding: 24px 0 16px; background: transparent; }
  .read-all.ant-btn { height: 32px; padding: 0 12px; border-radius: 8px; background: #fff; }
  .read-all.ant-btn:disabled { background: #fff; }
  .notifications-login { margin: 0; padding: 32px; border-radius: 16px; }
  .notifications-bar { top: 64px; margin: 0; padding: 4px 20px; border-bottom: 0; border-radius: 16px; }
  .notification-tabs :deep(.ant-tabs-tab) { font-size: 15px; }
  .notification-tabs :deep(.ant-tabs-tab + .ant-tabs-tab) { margin-left: 24px; }
  .notification-groups { gap: 24px; margin-top: 20px; }
  .notification-card { align-items: center; gap: 16px; padding: 14px 16px; transition: box-shadow 160ms ease, background-color 160ms ease; }
  .notification-card:hover { box-shadow: 0 2px 12px rgba(0, 0, 0, .06); }
  .notification-card:not(.unread) { background: rgba(255, 255, 255, .6); }
  .notification-card:not(.unread) strong { font-weight: 500; }
  .notification-body { font-size: 14px; line-height: 20px; }
  .notification-time { font-size: 13px; }
}
@media (max-width: 355px) {
  .notification-tabs :deep(.ant-tabs-tab) { font-size: 13px; }
  .notification-tabs :deep(.ant-tabs-tab + .ant-tabs-tab) { margin-left: 8px; }
}
@media (prefers-reduced-motion: reduce) {
  .notification-card { transition: none; }
}
</style>
