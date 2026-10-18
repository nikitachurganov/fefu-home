<script setup>
import { CloseOutlined } from '@ant-design/icons-vue'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { onBeforeUnmount, onMounted, ref } from 'vue'

// Сканер QR-кода: камера на весь экран. Устроен как сканер в проекте «TMC scan»,
// но без списка ТМЦ — он только читает код и отдаёт текст через detect.
const emit = defineEmits(['close', 'detect'])

const video = ref(null)
const closeButton = ref(null)
const error = ref('')

let controls
let detected = false
let unmounted = false

function onKeydown(event) {
  if (event.key === 'Escape') emit('close')
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  closeButton.value?.focus()

  if (!navigator.mediaDevices?.getUserMedia) {
    error.value = 'Камера недоступна в этом браузере или на небезопасном соединении (нужен HTTPS).'
    return
  }
  try {
    // Только QR: другие форматы не нужны и замедляют распознавание.
    const hints = new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]]])
    const reader = new BrowserMultiFormatReader(hints)
    const started = await reader.decodeFromConstraints(
      { video: { facingMode: { ideal: 'environment' } } },
      video.value,
      (result) => {
        // Камера читает код непрерывно: отдаём только первый результат.
        if (!result || detected) return
        detected = true
        emit('detect', result.getText())
      },
    )
    // Закрыли сканер, пока камера запускалась: сразу освобождаем её.
    if (unmounted) started.stop()
    else controls = started
  } catch {
    error.value = 'Не удалось получить доступ к камере. Разрешите доступ в настройках браузера.'
  }
})

onBeforeUnmount(() => {
  unmounted = true
  window.removeEventListener('keydown', onKeydown)
  controls?.stop()
})
</script>

<template>
  <Teleport to="body">
    <div class="qr-scanner" role="dialog" aria-modal="true" aria-labelledby="qr-scanner-title">
      <video ref="video" class="qr-video" muted playsinline />

      <header class="qr-top">
        <h2 id="qr-scanner-title" class="qr-title">Отсканируйте код</h2>
        <button ref="closeButton" type="button" class="qr-close" aria-label="Закрыть сканер" @click="emit('close')">
          <CloseOutlined />
        </button>
      </header>

      <div class="qr-frame" aria-hidden="true"></div>

      <p v-if="error" class="qr-message" role="alert">{{ error }}</p>
    </div>
  </Teleport>
</template>

<style scoped>
.qr-scanner {
  position: fixed;
  z-index: 1100;
  top: 0;
  bottom: 0;
  left: 50%;
  display: flex;
  width: min(100%, 402px);
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #000;
  transform: translateX(-50%);
}
.qr-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.qr-top {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  display: flex;
  min-height: 72px;
  padding: 16px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #fff;
  background: rgba(0, 0, 0, .72);
  backdrop-filter: blur(8px);
}
.qr-title { margin: 0; color: #fff; font-size: 20px; font-weight: 700; line-height: 28px; }
.qr-close { display: grid; width: 44px; height: 44px; flex-shrink: 0; place-items: center; border: 0; border-radius: 50%; background: rgba(255, 255, 255, .2); color: #fff; font-size: 16px; cursor: pointer; }
.qr-close:active { background: rgba(255, 255, 255, .3); }
.qr-close:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
.qr-frame {
  position: relative;
  width: 240px;
  height: 240px;
  border: 3px solid #fff;
  border-radius: 16px;
  box-shadow: 0 0 0 100vmax rgba(0, 0, 0, .45);
}
.qr-message {
  position: absolute;
  right: 16px;
  bottom: 24px;
  left: 16px;
  margin: 0;
  padding: 10px 16px;
  border-radius: 8px;
  background: rgba(0, 0, 0, .75);
  color: #fff;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
}
</style>
