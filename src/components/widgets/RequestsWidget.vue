<script setup>
import { computed, ref } from 'vue'
import WidgetCard from './WidgetCard.vue'
import {
  countByFilter,
  countOpenBySource,
  feedRequests,
  formatWhen,
  isMultiDay,
  requestFilters,
  requestSortOptions,
  requestSources,
  requestStatuses,
} from '../../data/requestModel'
import dateIcon from '../../assets/requests/date.svg'
import placeIcon from '../../assets/requests/place.svg'
import dateMutedIcon from '../../assets/requests/date-muted.svg'
import placeMutedIcon from '../../assets/requests/place-muted.svg'
import eventsIcon from '../../assets/figma/event-candidate-1.svg'

// «Мои заявки» на ПК повторяет раздел «Заявки» мобильной версии: те же категории со счётчиками,
// фильтр по статусу, сортировка и те же карточки. Отмена и детали — в самом разделе «Заявки».
const props = defineProps({
  requests: { type: Array, required: true },
  limit: { type: Number, default: 6 },
})
const emit = defineEmits(['open-request', 'open-all'])

const selectedSource = ref(requestSources[0].value)
const selectedFilter = ref('all')
const selectedSort = ref('relevance')

const openCounts = computed(() => countOpenBySource(props.requests))
const filterCounts = computed(() => countByFilter(props.requests, selectedSource.value))
const filterOptions = computed(() => requestFilters.map((filter) => ({ value: filter.value, label: `${filter.label} · ${filterCounts.value[filter.value] ?? 0}` })))
const sortOptions = requestSortOptions.map((option) => ({ value: option.value, label: option.label }))
const feed = computed(() => feedRequests(props.requests, selectedSource.value, selectedFilter.value, selectedSort.value))
const visible = computed(() => feed.value.slice(0, props.limit))
const hiddenCount = computed(() => feed.value.length - visible.value.length)
const totalOpen = computed(() => Object.values(openCounts.value).reduce((sum, count) => sum + count, 0))
const iconsFor = (request) => (request.statusGroup === 'archive'
  ? { date: dateMutedIcon, place: placeMutedIcon }
  : { date: dateIcon, place: placeIcon })
</script>

<template>
  <WidgetCard title="Мои заявки" title-id="widget-requests" :count="totalOpen" count-label="активных">
    <template #actions>
      <a-select v-model:value="selectedFilter" class="request-select" :options="filterOptions" aria-label="Статус заявки" />
      <a-select v-model:value="selectedSort" class="request-select" :options="sortOptions" aria-label="Сортировка" />
    </template>

    <div class="requests-bar">
      <a-tabs v-model:active-key="selectedSource" class="source-tabs" aria-label="Категории заявок">
        <a-tab-pane v-for="source in requestSources" :key="source.value">
          <template #tab>
            {{ source.label }}
            <span v-if="openCounts[source.value]" class="tab-count" :aria-label="`, активных заявок: ${openCounts[source.value]}`">{{ openCounts[source.value] }}</span>
          </template>
        </a-tab-pane>
      </a-tabs>
    </div>

    <div v-if="visible.length" class="request-list">
      <button
        v-for="request in visible"
        :key="request.id"
        type="button"
        class="request-card"
        :class="{ 'is-archive': request.statusGroup === 'archive' }"
        :aria-label="`${request.title}. ${requestStatuses[request.status].label}. ${formatWhen(request)}. ${request.place}`"
        @click="emit('open-request', request.id)"
      >
        <img v-if="request.image" class="request-photo" :src="request.image" alt="" width="88" height="88" />
        <span v-else class="request-photo request-photo-placeholder"><img :src="eventsIcon" alt="" /></span>
        <span class="request-copy">
          <strong>{{ request.title }}</strong>
          <span class="request-meta"><img :src="iconsFor(request).date" alt="" />{{ formatWhen(request, { compact: isMultiDay(request) }) }}</span>
          <span class="request-meta"><img :src="iconsFor(request).place" alt="" />{{ request.place }}</span>
          <a-tag :color="requestStatuses[request.status].color">{{ requestStatuses[request.status].label }}</a-tag>
        </span>
      </button>
    </div>
    <a-empty v-else description="В этом разделе у вас пока нет заявок" />

    <template #footer>
      <a-button type="link" class="widget-link" @click="emit('open-all')">
        Все заявки и история{{ hiddenCount ? ` · ещё ${hiddenCount}` : '' }}
      </a-button>
    </template>
  </WidgetCard>
</template>

<style scoped>
.widget-link.ant-btn { height: 24px; padding: 0; }
.request-select { width: 168px; }
.requests-bar { margin-top: -8px; border-bottom: 1px solid #f0f0f0; }
.source-tabs :deep(.ant-tabs-nav) { margin: 0; }
.source-tabs :deep(.ant-tabs-nav::before) { border-bottom: 0; }
.source-tabs :deep(.ant-tabs-tab) { padding: 10px 0; font-size: 15px; }
.source-tabs :deep(.ant-tabs-tab + .ant-tabs-tab) { margin-left: 20px; }
.source-tabs :deep(.ant-tabs-content-holder) { display: none; }
.tab-count { display: inline-grid; min-width: 18px; height: 18px; margin-left: 6px; padding: 0 5px; place-items: center; border-radius: 9px; background: rgba(0, 0, 0, .06); font-size: 12px; line-height: 18px; font-variant-numeric: tabular-nums; }
.ant-tabs-tab-active .tab-count { background: #e6f4ff; color: #1677ff; }

.request-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 12px; }
.request-card { display: flex; min-width: 0; align-items: stretch; gap: 12px; padding: 8px; border: 1px solid #f0f0f0; border-radius: 12px; background: #fff; color: inherit; text-align: left; cursor: pointer; transition: border-color 160ms ease, background-color 160ms ease; }
.request-card:hover { border-color: #d6e4ff; background: #f0f5ff; }
.request-card:focus-visible { outline: 3px solid rgba(22, 119, 255, .45); outline-offset: 2px; }
.request-card.is-archive { color: rgba(0, 0, 0, .65); }
.request-photo { width: 88px; height: 88px; flex-shrink: 0; object-fit: cover; border-radius: 8px; }
.request-photo-placeholder { display: grid; place-items: center; background: #e6f4ff; }
.request-photo-placeholder img { width: 32px; height: 32px; }
.request-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 2px; }
.request-copy strong { overflow: hidden; font-size: 15px; line-height: 20px; text-overflow: ellipsis; white-space: nowrap; }
.request-meta { display: flex; align-items: flex-start; gap: 4px; overflow: hidden; color: rgba(0, 0, 0, .65); font-size: 13px; line-height: 18px; }
.request-meta img { flex-shrink: 0; margin-top: 2px; }
.request-copy :deep(.ant-tag) { align-self: flex-start; margin: 2px 0 0; }

@media (prefers-reduced-motion: reduce) {
  .request-card { transition: none; }
}
</style>
