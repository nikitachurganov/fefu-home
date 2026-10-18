<script setup>
import { computed, nextTick, ref } from 'vue'
import { message } from 'ant-design-vue'
import BottomSheet from './BottomSheet.vue'
import chevronIcon from '../assets/requests/down.svg'
import { FEEDBACK_MAX, FEEDBACK_MIN, feedbackCategories, submitFeedback } from '../data/feedback'

defineProps({ open: Boolean })
const emit = defineEmits(['close'])

const category = ref(null)
const text = ref('')
const submitted = ref(false)
const sending = ref(false)
const categorySheetOpen = ref(false)

const categoryTrigger = ref(null)
const textarea = ref(null)

const currentCategory = computed(() => feedbackCategories.find((item) => item.value === category.value))

// Ошибки показываем только после первой попытки отправки.
const categoryError = computed(() => (submitted.value && !category.value ? 'Выберите категорию' : ''))
const textError = computed(() => {
  if (!submitted.value) return ''
  const length = text.value.trim().length
  if (!length) return 'Опишите обращение'
  return length < FEEDBACK_MIN ? `Минимум ${FEEDBACK_MIN} символов` : ''
})

function reset() {
  category.value = null
  text.value = ''
  submitted.value = false
}

function pickCategory(value) {
  category.value = value
  categorySheetOpen.value = false
}

async function submit() {
  if (sending.value) return
  submitted.value = true
  if (categoryError.value || textError.value) {
    // Фокус на первое поле с ошибкой.
    await nextTick()
    if (categoryError.value) categoryTrigger.value?.focus()
    else textarea.value?.focus()
    return
  }
  sending.value = true
  try {
    await submitFeedback({ category: category.value, text: text.value.trim() })
    message.success('Спасибо, обращение отправлено')
    reset()
    emit('close')
  } finally {
    sending.value = false
  }
}

function cancel() {
  reset()
  emit('close')
}
</script>

<template>
  <BottomSheet :open="open" title="Обратная связь" @close="emit('close')">
    <form class="feedback-form" novalidate @submit.prevent="submit">
      <div class="field">
        <button
          ref="categoryTrigger"
          type="button"
          class="sheet-trigger"
          :class="{ invalid: categoryError }"
          aria-haspopup="dialog"
          :aria-invalid="!!categoryError"
          :aria-describedby="categoryError ? 'feedback-category-error' : undefined"
          :disabled="sending"
          @click="categorySheetOpen = true"
        >
          <span class="sheet-trigger-text">
            <small>Категория</small>
            <span :class="{ placeholder: !currentCategory }">{{ currentCategory ? currentCategory.label : 'Выберите категорию' }}</span>
          </span>
          <img :src="chevronIcon" alt="" />
        </button>
        <p v-if="categoryError" id="feedback-category-error" class="field-error" role="alert">{{ categoryError }}</p>
      </div>

      <div class="field">
        <label class="field-label" for="feedback-text">Описание</label>
        <a-textarea
          id="feedback-text"
          ref="textarea"
          v-model:value="text"
          class="feedback-text"
          :auto-size="{ minRows: 4, maxRows: 6 }"
          :maxlength="FEEDBACK_MAX"
          show-count
          :status="textError ? 'error' : undefined"
          :disabled="sending"
          :aria-invalid="!!textError"
          :aria-describedby="textError ? 'feedback-text-error' : undefined"
          placeholder="Что случилось или что хотите улучшить?"
        />
        <p v-if="textError" id="feedback-text-error" class="field-error" role="alert">{{ textError }}</p>
      </div>

      <div class="feedback-actions">
        <a-button type="primary" size="large" block html-type="submit" :loading="sending">Отправить</a-button>
        <a-button size="large" block :disabled="sending" @click="cancel">Отмена</a-button>
      </div>
    </form>
  </BottomSheet>

  <BottomSheet
    :open="categorySheetOpen"
    title="Категория"
    :options="feedbackCategories"
    :value="category"
    @close="categorySheetOpen = false"
    @select="pickCategory"
  />
</template>

<style scoped>
.feedback-form { display: grid; gap: 16px; padding-top: 4px; }
.field { display: grid; gap: 4px; }
.field-label { color: rgba(0, 0, 0, .88); font-size: 14px; line-height: 20px; }
.field-error { margin: 0; color: #cf1322; font-size: 13px; line-height: 18px; }
.sheet-trigger { display: flex; width: 100%; min-width: 0; min-height: 48px; align-items: center; justify-content: space-between; gap: 8px; padding: 4px 12px; border: 1px solid #d9d9d9; border-radius: 8px; background: #fff; color: rgba(0, 0, 0, .88); font-size: 15px; line-height: 20px; text-align: left; cursor: pointer; }
.sheet-trigger.invalid { border-color: #ff4d4f; }
.sheet-trigger:disabled { background: #f5f5f5; cursor: not-allowed; }
.sheet-trigger:focus-visible { outline: 3px solid #1677ff; outline-offset: 2px; }
.sheet-trigger-text { display: flex; min-width: 0; flex-direction: column; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sheet-trigger-text small { color: rgba(0, 0, 0, .65); font-size: 12px; line-height: 16px; }
.sheet-trigger-text .placeholder { color: rgba(0, 0, 0, .45); }
.sheet-trigger img { flex-shrink: 0; transform: rotate(90deg); }
/* 16px, чтобы iOS не увеличивал страницу при фокусе на поле. */
.feedback-text { font-size: 16px; }
.feedback-actions { display: grid; gap: 8px; margin-top: 4px; }
.feedback-actions :deep(.ant-btn) { height: 44px; border-radius: 8px; }
</style>
