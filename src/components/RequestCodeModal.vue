<script setup>
import QrCode from './widgets/QrCode.vue'

// Динамический код заявки (заявка, возврат, чекаут): пользователь показывает его сотруднику.
defineProps({
  open: Boolean,
  // { title, hint, text } из codeActionsFor
  code: { type: Object, default: null },
})
const emit = defineEmits(['close'])
</script>

<template>
  <a-modal :open="open" :title="code?.title" :footer="null" :width="340" centered @cancel="emit('close')">
    <div v-if="code" class="request-code">
      <QrCode :text="code.text" :label="code.title" />
      <p>{{ code.hint }}</p>
    </div>
  </a-modal>
</template>

<style scoped>
.request-code { display: grid; justify-items: center; gap: 12px; text-align: center; }
.request-code p { margin: 0; color: rgba(0, 0, 0, .65); font-size: 14px; line-height: 20px; }
</style>
