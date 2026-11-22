<script setup>
import { onMounted, ref, watch } from 'vue'
import { isShortCode } from '../../data/scanCodes'

// Ручной ввод короткого кода с наклейки. Нужен там, где нет камеры (ПК) или она не работает.
defineProps({
  // Почему камера недоступна: показываем над полем, чтобы было понятно, зачем ввод вручную.
  cameraError: { type: String, default: '' },
  canUseCamera: Boolean,
  // Режим «Инвентаризация»: ждём код здания или помещения.
  inventory: Boolean,
})
const emit = defineEmits(['submit', 'camera'])

const value = ref('')
const submitted = ref(false)
const inputRef = ref(null)

onMounted(() => {
  inputRef.value?.focus()
})

watch(value, () => {
  if (submitted.value) submitted.value = false
})

function formatCode(input) {
  const raw = String(input ?? '').trim().toUpperCase()
  // Если ввели без дефиса или с пробелом, например «EQ0142» или «EQ 0142» -> «EQ-0142»
  return raw.replace(/^([A-Z]{2,4})\s*(\d{3,5})$/, '$1-$2')
}

function isValidInput(code) {
  return isShortCode(code) || code.startsWith('FEFU-ONE:')
}

function submit() {
  submitted.value = true
  const code = formatCode(value.value)
  if (!code || !isValidInput(code)) return
  emit('submit', code)
}

const error = () => {
  if (!submitted.value) return ''
  const code = formatCode(value.value)
  if (!code) return 'Введите код'
  return isValidInput(code) ? '' : 'Код выглядит иначе: 2–4 буквы, дефис и цифры, например EQ-0142'
}
</script>

<template>
  <form class="manual-entry" novalidate @submit.prevent="submit">
    <a-alert v-if="cameraError" type="warning" show-icon :message="cameraError" />

    <div class="field">
      <label class="field-label" for="manual-code">{{ inventory ? 'Код здания или помещения' : 'Код с наклейки' }}</label>
      <a-input
        id="manual-code"
        ref="inputRef"
        v-model:value="value"
        class="manual-input"
        size="large"
        allow-clear
        :placeholder="inventory ? 'Например, RM-0210' : 'Например, EQ-0142'"
        autocomplete="off"
        autocapitalize="characters"
        :maxlength="32"
        :status="error() ? 'error' : undefined"
        :aria-invalid="!!error()"
        :aria-describedby="error() ? 'manual-code-error' : undefined"
      />
      <p v-if="error()" id="manual-code-error" class="field-error" role="alert">{{ error() }}</p>
    </div>

    <div class="manual-actions">
      <a-button type="primary" size="large" block html-type="submit">Найти</a-button>
      <a-button v-if="canUseCamera || cameraError" size="large" block @click="emit('camera')">{{ cameraError ? 'Попробовать снова' : 'Сканировать камерой' }}</a-button>
    </div>
  </form>
</template>

<style scoped>
.manual-entry { display: grid; gap: 16px; }
.field { display: grid; gap: 4px; }
.field-label { color: var(--ant-color-text, rgba(0, 0, 0, .88)); font-size: 14px; line-height: 20px; }
.field-error { margin: 0; color: #cf1322; font-size: 13px; line-height: 18px; }
/* 16px, чтобы iOS не увеличивал страницу при фокусе на поле. */
.manual-input { font-size: 16px; }
/* Заглавными показываем только введённое, а не подсказку. */
.manual-input :deep(input:not(:placeholder-shown)) { text-transform: uppercase; }
.manual-actions { display: grid; gap: 8px; }
.manual-actions :deep(.ant-btn) { height: 44px; border-radius: 8px; }
</style>
