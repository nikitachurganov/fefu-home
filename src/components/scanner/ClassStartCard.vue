<script setup>
import { CalendarOutlined, EnvironmentOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons-vue'
import { parts, MONTHS } from '../../data/requestModel'

// Карточка занятия по расписанию: преподаватель видит её после скана паспорта аудитории.
// Показывает данные пары и кнопку «Начать пару».
const props = defineProps({
  // Данные занятия из schedule: { id, title, place, floor, teacher, group, capacity, scheduledStart, scheduledEnd }
  lesson: { type: Object, required: true },
  // Уже стартована ли эта пара (тогда кнопка «Начать» заменяется на «Открыть сессию»).
  isActive: { type: Boolean, default: false },
})
const emit = defineEmits(['start', 'open-session'])

function formatTime(ms) {
  const { time } = parts(new Date(ms).toISOString())
  return time
}
</script>

<template>
  <div class="csc-wrap">
    <div class="csc-badge">
      <CalendarOutlined aria-hidden="true" />
      {{ isActive ? 'Пара идёт' : 'Занятие по расписанию' }}
    </div>

    <h3 class="csc-title">{{ lesson.title }}</h3>

    <div class="csc-info">
      <p class="csc-row">
        <EnvironmentOutlined aria-hidden="true" />
        {{ lesson.place }}{{ lesson.floor ? ` · ${lesson.floor}` : '' }}
      </p>
      <p class="csc-row">
        <UserOutlined aria-hidden="true" />
        {{ lesson.teacher }}
      </p>
      <p class="csc-row">
        <TeamOutlined aria-hidden="true" />
        Группа: {{ lesson.group }} · {{ lesson.capacity }} мест
      </p>
      <p class="csc-time">
        {{ formatTime(lesson.scheduledStart) }} – {{ formatTime(lesson.scheduledEnd) }}
      </p>
    </div>

    <a-button v-if="isActive" type="primary" size="large" block @click="emit('open-session')">
      Открыть ведомость пары
    </a-button>
    <a-button v-else type="primary" size="large" block @click="emit('start')">
      Начать пару
    </a-button>
  </div>
</template>

<style scoped>
.csc-wrap { display: grid; gap: 16px; padding: 20px; border-radius: 16px; background: #fff; }

.csc-badge { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #4a7fd1; }
.csc-badge :deep(.anticon) { font-size: 16px; }

.csc-title { margin: 0; font-size: 20px; font-weight: 700; line-height: 28px; color: #101828; }

.csc-info { display: grid; gap: 6px; }
.csc-row { display: flex; align-items: center; gap: 8px; margin: 0; color: rgba(0,0,0,.65); font-size: 15px; }
.csc-row :deep(.anticon) { color: rgba(0,0,0,.35); font-size: 15px; }
.csc-time { margin: 4px 0 0; font-size: 20px; font-weight: 700; color: #101828; font-variant-numeric: tabular-nums; }

:deep(.ant-btn) { height: 48px; border-radius: 10px; }
</style>
