<script setup>
import { computed, markRaw, onBeforeUnmount, onMounted, ref } from 'vue'
import { QrcodeOutlined, ScanOutlined } from '@ant-design/icons-vue'
import WidgetCard from './widgets/WidgetCard.vue'
import QuickActions from './widgets/QuickActions.vue'
import AttentionWidget from './widgets/AttentionWidget.vue'
import TodayWidget from './widgets/TodayWidget.vue'
import ActiveBookingsWidget from './widgets/ActiveBookingsWidget.vue'
import RequestsWidget from './widgets/RequestsWidget.vue'
import CampusWidget from './widgets/CampusWidget.vue'
import GuestWidget from './widgets/GuestWidget.vue'
import { requests } from '../data/requestStore'
import { pickHighlights } from '../data/requestModel'
import { userName } from '../data/campus'
import { attentionItems, greeting, todayCaption, upcomingFeed } from '../data/homeModel'
import calendarIcon from '../assets/figma/calendar.svg'
import rentIcon from '../assets/figma/rent.svg'
import eventsIcon from '../assets/figma/events.svg'
import educationIcon from '../assets/figma/education.svg'
import gridIcon from '../assets/figma/grid.svg'

// Главная на ПК. Сверху приветствие с погодой и шаттлом, быстрые переходы. Для авторизованного ниже идут:
// акцентный блок просрочки, «Сейчас у вас» и «Мои заявки» (те же данные, что в мобильном разделе «Заявки»),
// затем пара карточек равной высоты «Ближайшие 3 дня | Уведомления».
// Мобильная главная остаётся в App.vue.
defineProps({ authenticated: Boolean })
const emit = defineEmits(['login', 'open-request', 'open-schedule', 'open-service', 'open-scanner', 'open-student-code', 'navigate'])

// Таймеры активных заявок тикают раз в секунду, пока главная открыта.
const now = ref(Date.now())
let tick
onMounted(() => { tick = setInterval(() => { now.value = Date.now() }, 1000) })
onBeforeUnmount(() => clearInterval(tick))

const feed = computed(() => upcomingFeed(requests.value, now.value))
const attention = computed(() => attentionItems(requests.value, now.value))
const highlights = computed(() => pickHighlights(requests.value))
const caption = computed(() => todayCaption(now.value))

const quickActions = [
  { id: 'booking', label: 'Бронирование', icon: calendarIcon, requiresAuth: true, service: 'Бронирование' },
  { id: 'rent', label: 'Аренда ТМЦ', icon: rentIcon, requiresAuth: true, service: 'Аренда' },
  { id: 'events', label: 'Мероприятия', icon: eventsIcon, requiresAuth: true, service: 'Мероприятия' },
  { id: 'schedule', label: 'Расписание', icon: educationIcon, requiresAuth: true, service: 'Расписание' },
  { id: 'student-code', label: 'Код студента', component: markRaw(QrcodeOutlined) },
  // Паспорта объектов сканируют все, поэтому вход в сканер доступен и без авторизации.
  { id: 'scanner', label: 'Сканер', component: markRaw(ScanOutlined) },
  { id: 'services', label: 'Все сервисы', icon: gridIcon },
]

function onQuickAction(item) {
  if (item.id === 'scanner') emit('open-scanner')
  else if (item.id === 'student-code') emit('open-student-code')
  else if (item.id === 'services') emit('navigate', 'services')
  else emit('open-service', item.service)
}
</script>

<template>
  <div class="desktop-home">
    <header class="home-hello">
      <div class="hello-copy">
        <p class="hello-date">{{ caption }}</p>
        <h1>{{ greeting(now) }}, {{ userName }}!</h1>
      </div>
      <CampusWidget :now="now" @open-service="(service) => emit('open-service', service)" />
    </header>

    <GuestWidget v-if="!authenticated" @login="emit('login')" />

    <QuickActions :items="quickActions" :authenticated="authenticated" @select="onQuickAction" />

    <template v-if="authenticated">
      <AttentionWidget v-if="attention.length" :items="attention" @action="(item) => emit('open-request', item.action.id)" />

      <ActiveBookingsWidget
        v-if="highlights.length"
        :items="highlights"
        :now="now"
        @open-request="(id) => emit('open-request', id)"
        @open-all="emit('navigate', 'requests')"
      />

      <RequestsWidget
        :requests="requests"
        @open-request="(id) => emit('open-request', id)"
        @open-all="emit('navigate', 'requests')"
      />

      <TodayWidget
        :feed="feed"
        :now="now"
        @open-request="(id) => emit('open-request', id)"
        @open-service="(service) => emit('open-service', service)"
      />
    </template>

    <template v-else>
      <div class="pair">
        <WidgetCard
          title="Ближайшие 3 дня"
          title-id="widget-today"
          locked
          locked-text="Брони, сроки возврата и мероприятия на ближайшие дни — в одной ленте."
          @login="emit('login')"
        />
        <WidgetCard
          title="Мои заявки"
          title-id="widget-requests"
          locked
          locked-text="Статусы заявок на оборудование, ТМЦ и мероприятия — так же, как в мобильной версии."
          @login="emit('login')"
        />
      </div>
    </template>

  </div>
</template>

<style scoped>
.desktop-home { display: flex; padding-top: 24px; flex-direction: column; gap: 20px; }
.home-hello { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 8px 24px; }
.hello-date { margin: 0 0 2px; color: rgba(0, 0, 0, .55); font-size: 14px; line-height: 20px; }
.hello-date::first-letter { text-transform: uppercase; }
.home-hello h1 { margin: 0; color: #101828; font-size: 28px; font-weight: 700; line-height: 36px; }

/* Пара карточек: одинаковая высота за счёт stretch; до 1280px — одна колонка. */
.pair { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; align-items: stretch; }
@media (min-width: 1280px) {
  .pair { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pair > .wide { grid-column: 1 / -1; }
}
</style>
