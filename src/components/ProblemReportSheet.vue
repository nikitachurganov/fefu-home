<script setup>
import { computed, ref } from 'vue'
import BottomSheet from './BottomSheet.vue'

// Форма «Сообщить о проблеме» для активной заявки. Если проблема возникла по вине пользователя,
// вопрос решается в частном порядке офлайн — здесь только фиксируем сообщение.
const MIN = 10
const MAX = 500

defineProps({ open: Boolean, zIndex: { type: Number, default: undefined } })
const emit = defineEmits(['close', 'submit'])

const text = ref('')
const submitted = ref(false)

const error = computed(() => {
  if (!submitted.value) return ''
  const length = text.value.trim().length
  if (!length) return 'Опишите проблему'
  return length < MIN ? `Минимум ${MIN} символов` : ''
})

function reset() {
  text.value = ''
  submitted.value = false
}

function submit() {
  submitted.value = true
  if (error.value) return
  emit('submit', text.value.trim())
  reset()
}

function cancel() {
  reset()
  emit('close')
}
</script>

<template>
  <BottomSheet :open="open" :z-index="zIndex" title="Сообщить о проблеме" @close="cancel">
    <form class="problem-form" novalidate @submit.prevent="submit">
      <div class="field">
        <label class="field-label" for="problem-text">Что случилось</label>
        <a-textarea
          id="problem-text"
          v-model:value="text"
          class="problem-text"
          :auto-size="{ minRows: 4, maxRows: 6 }"
          :maxlength="MAX"
          show-count
          :status="error ? 'error' : undefined"
          :aria-invalid="!!error"
          :aria-describedby="error ? 'problem-error' : undefined"
          placeholder="Например, не включается или есть повреждение"
        />
        <p v-if="error" id="problem-error" class="field-error" role="alert">{{ error }}</p>
      </div>
      <div class="problem-actions">
        <a-button type="primary" size="large" block html-type="submit">Отправить</a-button>
        <a-button size="large" block @click="cancel">Отмена</a-button>
      </div>
    </form>
  </BottomSheet>
</template>

<style scoped>
.problem-form { display: grid; gap: 16px; padding-top: 4px; }
.field { display: grid; gap: 4px; }
.field-label { color: rgba(0, 0, 0, .88); font-size: 14px; line-height: 20px; }
.field-error { margin: 0; color: #cf1322; font-size: 13px; line-height: 18px; }
/* 16px, чтобы iOS не увеличивал страницу при фокусе на поле. */
.problem-text { font-size: 16px; }
.problem-actions { display: grid; gap: 8px; margin-top: 4px; }
.problem-actions :deep(.ant-btn) { height: 44px; border-radius: 8px; }
</style>
