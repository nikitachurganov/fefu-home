<script setup>
import { computed } from 'vue'
import { BrowserQRCodeSvgWriter } from '@zxing/browser'
import { EncodeHintType } from '@zxing/library'

// QR-код из строки. Пока код не передан, ничего не рисуем.
const props = defineProps({
  text: { type: String, default: '' },
  size: { type: Number, default: 220 },
  label: { type: String, default: 'QR-код' },
  bordered: { type: Boolean, default: true },
  color: { type: String, default: '' },
  margin: { type: Number, default: undefined },
})

// SVG собирает библиотека из нашей же строки, поэтому вставка через v-html безопасна.
const svg = computed(() => {
  if (!props.text) return ''
  let hints
  if (props.margin !== undefined) {
    hints = new Map()
    hints.set(EncodeHintType.MARGIN, props.margin)
  }
  let html = new BrowserQRCodeSvgWriter().write(props.text, props.size, props.size, hints).outerHTML
  if (props.color) {
    html = html.replaceAll('fill="#000000"', `fill="${props.color}"`)
  }
  return html
})
</script>

<template>
  <div class="qr-code" :class="{ 'qr-code-plain': !bordered }" role="img" :aria-label="label" v-html="svg"></div>
</template>

<style scoped>
.qr-code { display: inline-block; padding: 8px; border-radius: 12px; background: #fff; line-height: 0; box-shadow: 0 0 0 1px #f0f0f0; }
.qr-code.qr-code-plain { padding: 0; background: transparent; border-radius: 0; box-shadow: none; }
.qr-code :deep(svg) { display: block; }
</style>
