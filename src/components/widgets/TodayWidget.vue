<script setup>
import WidgetCard from './WidgetCard.vue'
import { requestSources, requestStatuses } from '../../data/requestModel'
import { isOngoing, startsIn } from '../../data/homeModel'
import rightMutedIcon from '../../assets/requests/right-muted.svg'

// «Ближайшие 3 дня»: подтверждённые мероприятия и брони по дням — сегодня, завтра, послезавтра.
// Активные брони показывает отдельный виджет «Сейчас у вас».
const props = defineProps({
  feed: { type: Object, required: true },
  now: { type: Number, required: true },
})
const emit = defineEmits(['open-request', 'open-service'])

const sourceLabel = (source) => requestSources.find((item) => item.value === source)?.label
const statusOf = (request) => (isOngoing(request, props.now)
  ? { label: 'Идёт сейчас', color: 'blue' }
  : requestStatuses[request.status])
</script>

<template>
  <WidgetCard title="Ближайшие 3 дня" title-id="widget-today" subtitle="Мероприятия и брони">
    <div v-if="!feed.total" class="today-empty">
      <p>На ближайшие три дня событий нет. Брони и записи на мероприятия появятся здесь.</p>
      <a-button type="link" class="widget-link" @click="emit('open-service', 'Расписание')">Открыть расписание</a-button>
    </div>

    <template v-else>
      <section v-for="group in feed.groups" :key="group.key" class="day" :aria-labelledby="`day-${group.key}`">
        <h3 :id="`day-${group.key}`" class="feed-label">{{ group.label }}<span v-if="group.label !== group.caption"> · {{ group.caption }}</span></h3>
        <p v-if="!group.items.length" class="day-empty">Событий нет</p>
        <ol v-else class="day-list">
          <li v-for="{ request, slot } in group.items" :key="request.id">
            <button
              type="button"
              class="event-row"
              :aria-label="`${request.title}, ${slot.time}, ${slot.caption}. ${statusOf(request).label}. ${sourceLabel(request.source)}. ${request.place}`"
              @click="emit('open-request', request.id)"
            >
              <span class="slot">
                <b>{{ slot.time }}</b>
                <small>{{ slot.caption }}</small>
              </span>
              <span class="event-copy">
                <strong>{{ request.title }}</strong>
                <span>{{ sourceLabel(request.source) }} · {{ request.place }}</span>
                <span class="event-tags">
                  <a-tag :color="statusOf(request).color">{{ statusOf(request).label }}</a-tag>
                  <span v-if="startsIn(request, now)" class="countdown">{{ startsIn(request, now) }}</span>
                </span>
              </span>
              <img :src="rightMutedIcon" alt="" class="row-chevron" />
            </button>
          </li>
        </ol>
      </section>
    </template>
  </WidgetCard>
</template>

<style scoped>
.feed-label { margin: 0 0 8px; color: rgba(0, 0, 0, .55); font-size: 12px; font-weight: 600; letter-spacing: .02em; line-height: 16px; text-transform: uppercase; }
.day + .day { margin-top: 12px; }
.today-empty { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; }
.today-empty p, .day-empty { margin: 0; color: rgba(0, 0, 0, .65); font-size: 14px; line-height: 20px; }
.day-empty { color: rgba(0, 0, 0, .45); }
.widget-link.ant-btn { height: 24px; padding: 0; }

.day-list { display: grid; margin: 0; padding: 0; gap: 8px; list-style: none; }
.event-row { display: flex; width: 100%; align-items: center; gap: 16px; padding: 12px 16px; border: 1px solid #f0f0f0; border-radius: 12px; background: #fafafa; color: inherit; text-align: left; cursor: pointer; transition: border-color 160ms ease, background-color 160ms ease; }
.event-row:hover { border-color: #d6e4ff; background: #f0f5ff; }
.event-row:focus-visible { outline: 3px solid rgba(22, 119, 255, .45); outline-offset: 2px; }
.slot { display: flex; width: 88px; flex-shrink: 0; flex-direction: column; padding-right: 14px; border-right: 2px solid #1677ff; }
.slot b { font-size: 20px; font-variant-numeric: tabular-nums; line-height: 26px; }
.slot small { color: rgba(0, 0, 0, .55); font-size: 12px; line-height: 16px; }
.event-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 2px; }
.event-copy strong { overflow: hidden; font-size: 16px; line-height: 22px; text-overflow: ellipsis; white-space: nowrap; }
.event-copy > span:not(.event-tags) { overflow: hidden; color: rgba(0, 0, 0, .65); font-size: 13px; line-height: 18px; text-overflow: ellipsis; white-space: nowrap; }
.event-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 4px; }
.event-tags :deep(.ant-tag) { margin: 0; }
.countdown { color: #0958d9; font-size: 13px; font-weight: 600; line-height: 20px; }
.row-chevron { flex-shrink: 0; }

@media (prefers-reduced-motion: reduce) {
  .event-row { transition: none; }
}
</style>
