<script setup>
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  RISK_THRESHOLD, attendanceOptions, delayReasons, markedCount, pairStatuses,
  riskStudents, setDelayReason, setMark, teacherPairs,
} from '../data/teacherStore'

// Окна главной преподавателя: журнал пары, причина опоздания, проблема в аудитории, студенты в зоне риска.
// dialog: { type: 'journal' | 'delay' | 'problem' | 'risk', pairId? } или null.
const props = defineProps({ dialog: { type: Object, default: null } })
const emit = defineEmits(['close'])

const pair = computed(() => teacherPairs.value.find((item) => item.id === props.dialog?.pairId) ?? null)
const is = (type) => props.dialog?.type === type
const subtitle = computed(() => pair.value
  ? `${pair.value.start}–${pair.value.end} · ${pair.value.group} · ${pair.value.building}, ${pair.value.room}`
  : '')

const reason = ref(null)
const comment = ref('')
const problemText = ref('')
const submitted = ref(false)
watch(() => props.dialog, () => {
  reason.value = pair.value?.delayReason?.value ?? null
  comment.value = pair.value?.delayReason?.comment ?? ''
  problemText.value = ''
  submitted.value = false
})

const reasonError = computed(() => {
  if (!submitted.value) return ''
  if (!reason.value) return 'Выберите причину'
  return reason.value === 'other' && !comment.value.trim() ? 'Для «Другое» нужен комментарий' : ''
})
const problemError = computed(() => submitted.value && problemText.value.trim().length < 10 ? 'Опишите проблему, минимум 10 символов' : '')

function saveReason() {
  submitted.value = true
  if (reasonError.value) return
  setDelayReason(pair.value.id, { value: reason.value, comment: comment.value.trim() })
  message.success('Причина сохранена')
  emit('close')
}

function sendProblem() {
  submitted.value = true
  if (problemError.value) return
  message.success(`Обращение по аудитории ${pair.value.room} отправлено`)
  emit('close')
}

function markAllPresent() {
  for (const student of pair.value.students) if (!student.status) setMark(pair.value.id, student.id, 'done')
}
</script>

<template>
  <a-modal :open="is('journal') && Boolean(pair)" :title="pair ? `Отметки: ${pair.title}` : ''" :footer="null" width="640px" @cancel="emit('close')">
    <template v-if="pair">
      <p class="dialog-subtitle">{{ subtitle }}</p>
      <div class="journal-summary">
        <a-tag :color="pairStatuses[pair.status].color">{{ pairStatuses[pair.status].label }}</a-tag>
        <span>Отмечено {{ markedCount(pair) }} из {{ pair.students.length }}</span>
        <span v-if="pair.editableUntil">· правка до {{ pair.editableUntil }}</span>
        <a-button size="small" class="journal-all" @click="markAllPresent">Отметить остальных присутствующими</a-button>
      </div>
      <ul class="journal-list">
        <li v-for="student in pair.students" :key="student.id" class="journal-row">
          <span class="journal-name">
            <strong>{{ student.name }}</strong>
            <small>{{ student.id }}<template v-if="student.attendance <= RISK_THRESHOLD"> · <span class="risk">в зоне риска, {{ student.attendance }} %</span></template></small>
          </span>
          <a-select
            :value="student.status"
            class="journal-select"
            placeholder="Не отмечен"
            allow-clear
            :options="attendanceOptions"
            :aria-label="`Отметка: ${student.name}`"
            @change="(value) => setMark(pair.id, student.id, value ?? null)"
          />
        </li>
      </ul>
      <p class="dialog-hint">Студенты также отмечаются по своему QR — откройте сканер во время пары.</p>
    </template>
  </a-modal>

  <a-modal :open="is('delay') && Boolean(pair)" title="Причина опоздания" ok-text="Сохранить" cancel-text="Отмена" @ok="saveReason" @cancel="emit('close')">
    <template v-if="pair">
      <p class="dialog-subtitle">{{ pair.title }} · {{ subtitle }}</p>
      <a-radio-group v-model:value="reason" class="reason-list" aria-label="Причина">
        <a-radio v-for="item in delayReasons" :key="item.value" :value="item.value">{{ item.label }}</a-radio>
      </a-radio-group>
      <a-textarea v-model:value="comment" :rows="3" :maxlength="500" show-count placeholder="Комментарий" aria-label="Комментарий" />
      <p v-if="reasonError" class="dialog-error" role="alert">{{ reasonError }}</p>
    </template>
  </a-modal>

  <a-modal :open="is('problem') && Boolean(pair)" :title="pair ? `Проблема в аудитории ${pair.room}` : ''" ok-text="Отправить" cancel-text="Отмена" @ok="sendProblem" @cancel="emit('close')">
    <template v-if="pair">
      <p class="dialog-subtitle">{{ pair.title }} · {{ subtitle }}</p>
      <a-textarea v-model:value="problemText" :rows="4" :maxlength="500" show-count placeholder="Что случилось: не работает проектор, нет мела, холодно…" aria-label="Описание проблемы" />
      <p v-if="problemError" class="dialog-error" role="alert">{{ problemError }}</p>
    </template>
  </a-modal>

  <a-modal :open="is('risk')" title="Студенты в зоне риска" :footer="null" @cancel="emit('close')">
    <p class="dialog-subtitle">Посещаемость по вашим дисциплинам {{ RISK_THRESHOLD }} % и ниже</p>
    <ul class="journal-list">
      <li v-for="student in riskStudents" :key="student.id" class="journal-row">
        <span class="journal-name"><strong>{{ student.name }}</strong><small>{{ student.group }}</small></span>
        <a-progress :percent="student.attendance" size="small" status="exception" class="risk-progress" :aria-label="`Посещаемость ${student.attendance} %`" />
      </li>
    </ul>
  </a-modal>
</template>

<style scoped>
.dialog-subtitle { margin: 0 0 12px; opacity: .65; font-size: 13px; line-height: 18px; }
.dialog-hint { margin: 12px 0 0; opacity: .65; font-size: 13px; }
.dialog-error { margin: 8px 0 0; color: #cf1322; font-size: 13px; }
.journal-summary { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; margin-bottom: 8px; font-size: 13px; }
.journal-all { margin-left: auto; }
.journal-list { max-height: 420px; margin: 0; padding: 0; overflow-y: auto; list-style: none; }
.journal-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 0; }
.journal-row + .journal-row { border-top: 1px solid rgba(128, 128, 128, .2); }
.journal-name { display: grid; min-width: 0; }
.journal-name strong { font-size: 14px; font-weight: 600; }
.journal-name small { opacity: .7; font-size: 12px; }
.journal-select { width: 220px; flex: none; }
.risk { color: #cf1322; }
.risk-progress { width: 180px; flex: none; margin: 0; }
.reason-list { display: grid; gap: 8px; margin-bottom: 12px; }
</style>
