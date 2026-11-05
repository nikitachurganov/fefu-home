<script setup>
import { computed, ref } from 'vue'
import {
  CheckOutlined,
  CloseOutlined,
  ExpandOutlined,
  ScanOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import QrCode from '../widgets/QrCode.vue'
import { buildCode } from '../../data/scanCodes'
import { studentDemoCodes } from '../../data/demoCodes'
import { parts, MONTHS } from '../../data/requestModel'

// Экран активной пары у преподавателя.
// Показывает: QR занятия (студенты сканируют), список отметившихся, кнопки «Сканировать студента» и «Завершить».
const props = defineProps({
  // { id, title, place, floor, teacher, group, capacity }
  lesson: { type: Object, required: true },
  // { startedAt, attendees[] }
  session: { type: Object, required: true },
  // Есть ли у устройства камера (режим сканирования студентов доступен только с камерой).
  canUseCamera: Boolean,
  // Последний результат скана студента { type: 'success'|'error', text }.
  feedback: { type: Object, default: null },
})

const emit = defineEmits(['scan-student', 'show-qr', 'end-class', 'demo-mark'])

const showDemo = import.meta.env.DEV

const classCode = computed(() => buildCode('class', props.lesson.id))

function stamp(iso) {
  const { time } = parts(iso)
  return time
}

const attendeeCount = computed(() => props.session.attendees.length)
const capacity = computed(() => props.lesson.capacity ?? '—')
</script>

<template>
  <div class="class-session">
    <!-- Заголовок занятия -->
    <div class="cs-header">
      <div class="cs-meta">
        <p class="cs-label">Пара идёт</p>
        <h3 class="cs-title">{{ lesson.title }}</h3>
        <p class="cs-sub">{{ lesson.place }}{{ lesson.floor ? ` · ${lesson.floor}` : '' }}</p>
        <p class="cs-sub">Группа: {{ lesson.group }} · Начало: {{ stamp(session.startedAt) }}</p>
      </div>
    </div>

    <!-- QR занятия для студентов -->
    <section class="cs-qr-block" aria-label="QR-код занятия для студентов">
      <p class="cs-section-label">Студенты сканируют этот код</p>
      <div class="cs-qr-wrap">
        <QrCode :text="classCode" :size="200" label="QR-код пары" />
        <button type="button" class="cs-expand-btn" aria-label="На весь экран" @click="emit('show-qr')">
          <ExpandOutlined />
        </button>
      </div>
      <p class="cs-qr-hint">Или нажмите <strong>«На весь экран»</strong>, чтобы вывести на проектор</p>
    </section>

    <!-- Счётчик + список -->
    <section class="cs-attendees" aria-label="Ведомость присутствия">
      <div class="cs-counter-row">
        <TeamOutlined aria-hidden="true" />
        <span>Отметились: <strong>{{ attendeeCount }}</strong> из {{ capacity }}</span>
      </div>

      <!-- Последний отклик сканера -->
      <div v-if="feedback" class="cs-feedback" :class="`cs-feedback--${feedback.type}`" role="status" aria-live="polite">
        {{ feedback.text }}
      </div>

      <ul v-if="session.attendees.length" class="cs-list" aria-label="Список присутствующих">
        <li v-for="(a, i) in session.attendees" :key="i" class="cs-item">
          <span class="cs-item-icon"><UserOutlined /></span>
          <span class="cs-item-name">{{ a.name }}</span>
          <span class="cs-item-time">{{ stamp(a.checkedAt) }}</span>
          <CheckOutlined class="cs-item-check" aria-hidden="true" />
        </li>
      </ul>
      <p v-else class="cs-empty">Пока никто не отметился</p>
    </section>

    <!-- Действия -->
    <div class="cs-actions">
      <a-button v-if="canUseCamera" size="large" block @click="emit('scan-student')">
        <ScanOutlined /> Сканировать студента
      </a-button>
      <a-button danger size="large" block @click="emit('end-class')">
        <CloseOutlined /> Завершить пару
      </a-button>
    </div>

    <!-- Демо-блок для быстрой проверки отметки студентов на ПК -->
    <div v-if="showDemo" class="cs-demo-section">
      <p class="cs-demo-label">Симуляция скана студента (только dev):</p>
      <div class="cs-demo-buttons">
        <button
          v-for="s in studentDemoCodes"
          :key="s.text"
          type="button"
          class="cs-demo-btn"
          @click="emit('demo-mark', s.text)"
        >
          + {{ s.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.class-session { display: grid; gap: 20px; }

.cs-demo-section { display: grid; gap: 6px; padding-top: 12px; border-top: 1px dashed #d9d9d9; }
.cs-demo-label { margin: 0; color: rgba(0,0,0,.45); font-size: 12px; font-weight: 600; text-transform: uppercase; }
.cs-demo-buttons { display: flex; flex-wrap: wrap; gap: 6px; }
.cs-demo-btn { padding: 6px 10px; border: 1px solid #d9d9d9; border-radius: 6px; background: #fff; color: #101828; font-size: 13px; cursor: pointer; }
.cs-demo-btn:hover { border-color: #4a7fd1; color: #4a7fd1; }
.cs-demo-btn:active { background: #f0f7ff; }

/* Заголовок */
.cs-header { padding: 16px; border-radius: 16px; background: #4a7fd1; color: #fff; }
.cs-label { margin: 0 0 4px; font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; opacity: .85; }
.cs-title { margin: 0 0 4px; font-size: 20px; font-weight: 700; line-height: 28px; }
.cs-sub { margin: 0; font-size: 14px; opacity: .85; }

/* QR */
.cs-section-label { margin: 0 0 12px; color: rgba(0,0,0,.45); font-size: 13px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
.cs-qr-block { display: grid; gap: 8px; }
.cs-qr-wrap { position: relative; display: flex; justify-content: center; }
.cs-expand-btn { position: absolute; right: 0; top: 0; display: grid; width: 40px; height: 40px; place-items: center; border: 1px solid #d9d9d9; border-radius: 8px; background: #fff; color: rgba(0,0,0,.65); font-size: 18px; cursor: pointer; }
.cs-expand-btn:hover { color: #4a7fd1; border-color: #4a7fd1; }
.cs-expand-btn:focus-visible { outline: 3px solid rgba(74,127,209,.5); outline-offset: 2px; }
.cs-qr-hint { margin: 0; color: rgba(0,0,0,.45); font-size: 13px; text-align: center; }

/* Ведомость */
.cs-attendees { display: grid; gap: 10px; }
.cs-counter-row { display: flex; align-items: center; gap: 8px; color: rgba(0,0,0,.65); font-size: 15px; }
.cs-counter-row :deep(.anticon) { font-size: 18px; color: #4a7fd1; }
.cs-counter-row strong { color: #101828; }

.cs-feedback { padding: 10px 14px; border-radius: 10px; font-size: 14px; }
.cs-feedback--success { background: #f6ffed; color: #389e0d; }
.cs-feedback--error { background: #fff1f0; color: #cf1322; }
.cs-feedback--info { background: #e6f4ff; color: #0958d9; }

.cs-list { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
.cs-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; background: #f9fafb; }
.cs-item-icon { color: rgba(0,0,0,.35); font-size: 15px; }
.cs-item-name { flex: 1; color: #101828; font-size: 15px; }
.cs-item-time { color: rgba(0,0,0,.45); font-size: 13px; font-variant-numeric: tabular-nums; }
.cs-item-check { color: #52c41a; font-size: 15px; }
.cs-empty { margin: 0; padding: 16px; border-radius: 10px; background: #f9fafb; color: rgba(0,0,0,.35); font-size: 14px; text-align: center; }

/* Действия */
.cs-actions { display: grid; gap: 8px; }
.cs-actions :deep(.ant-btn) { height: 48px; border-radius: 10px; }
</style>
