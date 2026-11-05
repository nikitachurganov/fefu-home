<script setup>
import { computed, ref, watch } from 'vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import BottomSheet from '../BottomSheet.vue'

// Шторка ручного ввода инвентарного кода для одной позиции (макет «Выдача — Ввод кода вручную»).
// Код проверяется на лету: «Верно» разрешает «Подтвердить», неверный код подсвечивается ошибкой.
const props = defineProps({
  open: Boolean,
  // Название позиции — заголовок шторки.
  title: { type: String, default: '' },
  hint: { type: String, default: '' },
  // text → 'empty' | 'typing' | 'invalid' | 'valid' (sessionModel.previewCode)
  check: { type: Function, required: true },
  zIndex: { type: Number, default: undefined },
})
const emit = defineEmits(['close', 'submit'])

const code = ref('')
const state = computed(() => props.check(code.value))

watch(() => props.open, (open) => { if (open) code.value = '' })

function submit() {
  if (state.value === 'valid') emit('submit', code.value.trim().toUpperCase())
}
</script>

<template>
  <BottomSheet :open="open" :z-index="zIndex" :title="title" @close="emit('close')">
    <form class="code-entry" novalidate @submit.prevent="submit">
      <p class="code-hint">{{ hint }}</p>
      <div class="field">
        <a-input
          v-model:value="code"
          size="large"
          placeholder="Инвентарный код"
          autocomplete="off"
          autocapitalize="characters"
          :maxlength="12"
          :status="state === 'invalid' ? 'error' : undefined"
          aria-label="Инвентарный код"
          :aria-invalid="state === 'invalid'"
          :aria-describedby="state === 'invalid' ? 'code-entry-error' : undefined"
        >
          <template #suffix>
            <ExclamationCircleOutlined v-if="state === 'invalid'" class="code-bad" aria-hidden="true" />
            <span v-else-if="state === 'valid'" class="code-good" role="status">Верно</span>
            <span v-else></span>
          </template>
        </a-input>
        <p v-if="state === 'invalid'" id="code-entry-error" class="code-error" role="alert">Введен неверный код</p>
      </div>
      <div class="code-actions">
        <a-button type="primary" size="large" block html-type="submit" :disabled="state !== 'valid'">Подтвердить</a-button>
        <a-button type="text" size="large" block @click="emit('close')">Закрыть</a-button>
      </div>
    </form>
  </BottomSheet>
</template>

<style scoped>
.code-entry { display: grid; gap: 16px; padding-top: 4px; }
.code-hint { margin: 0; color: rgba(0, 0, 0, .65); font-size: 15px; line-height: 22px; }
.field { display: grid; gap: 4px; }
/* 16px, чтобы iOS не увеличивал страницу при фокусе на поле. */
.field :deep(input) { font-size: 16px; }
.code-good { color: #52c41a; font-size: 15px; }
.code-bad { color: #ff4d4f; }
.code-error { margin: 0; color: #ff4d4f; font-size: 13px; line-height: 18px; }
.code-actions { display: grid; gap: 4px; }
.code-actions :deep(.ant-btn) { height: 44px; border-radius: 8px; }
.code-actions :deep(.ant-btn-text) { color: rgba(0, 0, 0, .65); }
</style>
