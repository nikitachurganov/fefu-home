<script setup>
import { computed } from 'vue'
import { ArrowRightOutlined, EnvironmentOutlined } from '@ant-design/icons-vue'
import { nextDepartures, shuttle } from '../data/campus'
import { requests } from '../data/requestStore'
import { parts, requestStatuses } from '../data/requestModel'

const props = defineProps({ service: Object, now: Number, authenticated: Boolean })
const emit = defineEmits(['close', 'open-request', 'login'])
const label = computed(() => props.service?.label)
const nextBus = computed(() => nextDepartures(shuttle.departures, props.now, 1)[0])
const entries = computed(() => {
  const match = {
    Расписание: (r) => r.instructor,
    Мероприятия: (r) => r.source === 'events' && !r.instructor,
    Бронирование: (r) => ['workplace', 'equipment'].includes(r.source),
    Аренда: (r) => r.source === 'tmc',
  }[label.value]
  return match ? requests.value.filter((r) => match(r) && r.statusGroup === 'confirmed')
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)) : []
})
const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', timeZone: 'Asia/Vladivostok' })
const locations = ['Кампус ДВФУ', 'Корпус А ДВФУ', 'Студенческий центр ДВФУ']
</script>

<template>
  <a-modal :open="Boolean(service)" :title="label" :footer="null" @cancel="emit('close')">
    <template v-if="service && !authenticated && label === 'Расписание'">
      <p>Расписание занятий, аудитории и преподаватели доступны после входа в аккаунт.</p>
      <a-button type="primary" @click="emit('login')">Войти</a-button>
    </template>
    <template v-else-if="service && !authenticated && ['Мероприятия', 'Бронирование', 'Аренда'].includes(label)">
      <p>{{ service.description }}</p>
    </template>
    <template v-else-if="label === 'Шаттлы'">
      <h3>{{ shuttle.route }}</h3>
      <p>{{ shuttle.stop }} · Владивосток</p>
      <p>{{ nextBus ? 'Ближайший рейс в ' + nextBus.time : 'Следующий рейс завтра в ' + shuttle.departures[0] }}</p>
      <div class="departures">
        <span v-for="time in shuttle.departures" :key="time" :class="{ next: time === nextBus?.time }">{{ time }}</span>
      </div>
    </template>
    <template v-else-if="label === 'Карта'">
      <p>Выберите место, чтобы открыть его в Яндекс Картах.</p>
      <a v-for="place in locations" :key="place" class="detail-row"
        :href="'https://yandex.ru/maps/?text=' + encodeURIComponent(place + ', остров Русский, Владивосток')" target="_blank" rel="noopener">
        <EnvironmentOutlined /> {{ place }} <ArrowRightOutlined />
      </a>
    </template>
    <template v-else-if="service">
      <p>{{ { Расписание: 'Ваши занятия', Мероприятия: 'Ваши записи на мероприятия', Бронирование: 'Ваши брони оборудования и рабочих мест', Аренда: 'Ваши заявки на инвентарь' }[label] }}</p>
      <button v-for="item in entries" :key="item.id" class="detail-row" @click="emit('open-request', item.id)">
        <span><small>{{ dateFormat.format(new Date(item.startsAt)) }} · {{ parts(item.startsAt).time }}–{{ parts(item.endsAt).time }}</small>
          <strong>{{ item.title }}</strong><small>{{ item.place }} · {{ requestStatuses[item.status]?.label }}</small></span>
        <ArrowRightOutlined />
      </button>
      <a-empty v-if="!entries.length" description="Здесь пока нет записей" />
    </template>
  </a-modal>
</template>

<style scoped>
.departures { display: flex; flex-wrap: wrap; gap: 8px; }
.departures span { padding: 6px 12px; border-radius: 8px; background: #f1f4fa; }
.departures .next { background: #2459c8; color: white; }
.detail-row { display: flex; align-items: center; gap: 12px; width: 100%; padding: 14px 4px; color: #1f3859; text-align: left; background: white; border: 0; border-top: 1px solid #e6ebf2; cursor: pointer; }
.detail-row:hover { color: #175bc7; }
.detail-row > .anticon:last-child { margin-left: auto; }
.detail-row strong, .detail-row small { display: block; }
.detail-row small { color: #59677b; }
</style>
