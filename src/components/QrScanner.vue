<script setup>
import { BulbFilled, BulbOutlined, CloseOutlined, LeftOutlined, ThunderboltFilled, ThunderboltOutlined } from '@ant-design/icons-vue'
import { BrowserQRCodeReader } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { codeBox, coverMap, cropRect, toScreen } from '../composables/qrGeometry'

// Сканер QR-кода: камера на весь экран. Только читает код и отдаёт текст через detect.
// Читается только то, что внутри рамки: при нескольких кодах откроется тот, на который наведена рамка.
// Распознанный код подсвечивается зелёной рамкой по его контуру, и только потом уходит detect.
// По умолчанию отдаёт первый найденный код; в режиме continuous (сессии выдачи, приёмки и
// инвентаризации) отдаёт каждый новый код, а повтор того же кода пропускает на время REPEAT_PAUSE.
// Слот по умолчанию — нижняя панель над кнопками (список сессии).
const props = defineProps({
  title: { type: String, default: 'Отсканируйте код' },
  subtitle: { type: String, default: '' },
  // Широкая рамка под штрихкоды на наклейках и шильдиках (сессии), квадратная — под обычный QR.
  wide: Boolean,
  // Режим «под карточкой»: камера остаётся фоном, вместо шапки и рамки — кнопки назад и фонарика,
  // слот toast — подтверждение сверху, слот по умолчанию — карточка с результатом.
  cover: Boolean,
  // Карточка-оверлей поверх камеры (экраны 2, 3, 4): скрывает центральную рамку и кнопки сканера,
  // оставляя стандартную тёмную шапку и выводя карточку в нижней части.
  hasOverlay: Boolean,
  continuous: Boolean,
})
const emit = defineEmits(['close', 'detect', 'manual', 'camera-error'])

const REPEAT_PAUSE = 2000
// Как часто смотрим в кадр и сколько держим рамку на коде, прежде чем отдать результат
// (чтобы пользователь успел увидеть, какой именно код распознан).
const SCAN_INTERVAL = 80
const LOCK_DELAY = 450
// В режиме continuous рамка гаснет, если код пропал из кадра на это время.
const LOST_AFTER = 500
// Большую область кадра уменьшаем до этой стороны: на скорость распознавания это почти не влияет.
const MAX_SIDE = 720

const root = ref(null)
const video = ref(null)
const frame = ref(null)
const closeButton = ref(null)
const error = ref('')
const torchSupported = ref(false)
const torchOn = ref(false)
// Контур распознанного кода в координатах сканера: { x, y, w, h } либо null, пока кода нет.
const lock = ref(null)

// Только QR: другие форматы не нужны и замедляют распознавание.
const hints = new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]]])
const reader = new BrowserQRCodeReader(hints)
const canvas = document.createElement('canvas')
const context = canvas.getContext('2d', { willReadFrequently: true })

let stream
let track
let scanTimer
let lockTimer
let detected = false
let unmounted = false
let pendingText = ''
let lastText = ''
let lastAt = 0
let lastHitAt = 0

function onKeydown(event) {
  if (event.key === 'Escape') emit('close')
}

function fail(text) {
  error.value = text
  emit('camera-error', text)
}

// Читает область рамки (в режиме cover — весь кадр). Возвращает текст кода и его контур на экране.
function readFrame() {
  const el = video.value
  if (!el || el.readyState < 2 || !el.videoWidth) return null
  const size = { w: el.videoWidth, h: el.videoHeight }
  const view = el.getBoundingClientRect()
  const map = coverMap(size, { w: view.width, h: view.height })
  const rect = frame.value?.getBoundingClientRect()
  const area = rect
    ? { x: rect.left - view.left, y: rect.top - view.top, w: rect.width, h: rect.height }
    : { x: 0, y: 0, w: view.width, h: view.height }
  const crop = cropRect(map, area, size, rect ? 0.1 : 0)
  if (crop.w < 1 || crop.h < 1) return null

  const k = Math.min(1, MAX_SIDE / Math.max(crop.w, crop.h))
  canvas.width = Math.max(1, Math.round(crop.w * k))
  canvas.height = Math.max(1, Math.round(crop.h * k))
  context.drawImage(el, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height)

  let result
  try {
    result = reader.decodeFromCanvas(canvas)
  } catch {
    // Кода в кадре нет: для декодера это исключение, для нас — обычный случай.
    return null
  }
  const points = result.getResultPoints().map((point) =>
    toScreen(map, { x: crop.x + point.getX() / k, y: crop.y + point.getY() / k }),
  )
  const box = codeBox(points) ?? area
  const host = root.value.getBoundingClientRect()
  return {
    text: result.getText(),
    box: { x: box.x + view.left - host.left, y: box.y + view.top - host.top, w: box.w, h: box.h },
  }
}

function onHit({ text, box }) {
  lock.value = box
  lastHitAt = Date.now()
  if (props.continuous) {
    if (text === lastText && lastHitAt - lastAt < REPEAT_PAUSE) {
      lastAt = lastHitAt
      return
    }
    lastText = text
    lastAt = lastHitAt
    emit('detect', text)
    return
  }
  // Камера читает код непрерывно: ждём, пока рамка постоит на коде, и отдаём только один результат.
  // Если за это время навели на другой код, отсчёт начинается заново для него.
  if (text === pendingText) return
  pendingText = text
  clearTimeout(lockTimer)
  lockTimer = setTimeout(() => {
    detected = true
    emit('detect', text)
  }, LOCK_DELAY)
}

function tick() {
  if (unmounted || detected || props.hasOverlay) return
  const hit = readFrame()
  if (hit) onHit(hit)
  else if (lock.value && !pendingText && Date.now() - lastHitAt > LOST_AFTER) lock.value = null
  scanTimer = setTimeout(tick, SCAN_INTERVAL)
}

watch(
  () => props.hasOverlay,
  (overlay) => {
    if (!overlay && !detected && !unmounted) {
      lock.value = null
      pendingText = ''
      clearTimeout(scanTimer)
      scanTimer = setTimeout(tick, SCAN_INTERVAL)
    }
  },
)

async function toggleTorch() {
  if (!track) return
  try {
    await track.applyConstraints({ advanced: [{ torch: !torchOn.value }] })
    torchOn.value = !torchOn.value
  } catch {
    torchSupported.value = false
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  closeButton.value?.focus()

  if (!navigator.mediaDevices?.getUserMedia) {
    fail('Камера недоступна в этом браузере или на небезопасном соединении (нужен HTTPS).')
    return
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
    })
    // Закрыли сканер, пока камера запускалась: сразу освобождаем её.
    if (unmounted) {
      stream.getTracks().forEach((item) => item.stop())
      return
    }
    track = stream.getVideoTracks()[0]
    // torch есть в возможностях трека только тогда, когда камера умеет включать фонарик.
    torchSupported.value = Boolean(track?.getCapabilities?.().torch)
    video.value.srcObject = stream
    await video.value.play()
    tick()
  } catch {
    fail('Не удалось получить доступ к камере. Разрешите доступ в настройках браузера.')
  }
})

onBeforeUnmount(() => {
  unmounted = true
  window.removeEventListener('keydown', onKeydown)
  clearTimeout(scanTimer)
  clearTimeout(lockTimer)
  stream?.getTracks().forEach((item) => item.stop())
})
</script>

<template>
  <Teleport to="body">
    <div ref="root" class="qr-scanner" role="dialog" aria-modal="true" aria-labelledby="qr-scanner-title">
      <video ref="video" class="qr-video" muted playsinline />

      <div v-if="cover" class="qr-cover-top">
        <button ref="closeButton" type="button" class="qr-round" aria-label="Назад" @click="emit('close')"><LeftOutlined /></button>
        <slot name="toast" />
        <button v-if="torchSupported" type="button" class="qr-round" :aria-pressed="torchOn" aria-label="Фонарик" @click="toggleTorch">
          <component :is="torchOn ? BulbFilled : BulbOutlined" />
        </button>
        <span v-else class="qr-round-spacer"></span>
      </div>

      <header v-else class="qr-top">
        <div class="qr-heading">
          <h2 id="qr-scanner-title" class="qr-title">{{ title }}</h2>
          <p v-if="subtitle" class="qr-subtitle" aria-live="polite">{{ subtitle }}</p>
        </div>
        <button ref="closeButton" type="button" class="qr-close" aria-label="Закрыть сканер" @click="emit('close')">
          <CloseOutlined />
        </button>
      </header>

      <div v-if="!cover && !hasOverlay" ref="frame" class="qr-frame" :class="{ wide, locked: lock }" aria-hidden="true"><i></i><i></i><i></i><i></i></div>

      <!-- Контур распознанного кода: рамка «наезжает» на код, и видно, какой именно будет открыт. -->
      <div
        v-if="lock"
        class="qr-lock"
        aria-hidden="true"
        :style="{ left: `${lock.x}px`, top: `${lock.y}px`, width: `${lock.w}px`, height: `${lock.h}px` }"
      ></div>

      <div class="qr-bottom">
        <p v-if="error" class="qr-message" role="alert">{{ error }}</p>
        <slot />
        <div v-if="!cover && !hasOverlay" class="qr-actions">
          <button
            v-if="torchSupported"
            type="button"
            class="qr-action"
            :aria-pressed="torchOn"
            @click="toggleTorch"
          >
            <component :is="torchOn ? ThunderboltFilled : ThunderboltOutlined" />
            {{ torchOn ? 'Выключить фонарик' : 'Фонарик' }}
          </button>
          <button type="button" class="qr-action" @click="emit('manual')">Ввести код</button>
        </div>
      </div>
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
.qr-cover-top { position: absolute; top: 0; right: 0; left: 0; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 16px; }
.qr-round, .qr-round-spacer { display: grid; width: 56px; height: 56px; flex-shrink: 0; place-items: center; border: 0; border-radius: 16px; background: rgba(0, 0, 0, .45); color: #fff; font-size: 22px; backdrop-filter: blur(8px); }
.qr-round { cursor: pointer; }
.qr-round-spacer { visibility: hidden; }
.qr-round:active { background: rgba(0, 0, 0, .6); }
.qr-round:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
.qr-round[aria-pressed='true'] { background: #fff; color: #000; }
.qr-heading { min-width: 0; }
.qr-title { margin: 0; color: #fff; font-size: 20px; font-weight: 700; line-height: 28px; }
.qr-subtitle { margin: 2px 0 0; color: rgba(255, 255, 255, .72); font-size: 14px; line-height: 20px; }
.qr-close { display: grid; width: 44px; height: 44px; flex-shrink: 0; place-items: center; border: 0; border-radius: 50%; background: rgba(255, 255, 255, .2); color: #fff; font-size: 16px; cursor: pointer; }
.qr-close:active { background: rgba(255, 255, 255, .3); }
.qr-close:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
.qr-frame {
  position: relative;
  width: 240px;
  height: 240px;
  border-radius: 16px;
  box-shadow: 0 0 0 100vmax rgba(0, 0, 0, .45);
}
.qr-frame.wide { width: min(86%, 340px); height: 150px; }
.qr-frame i { transition: border-color .15s; }
.qr-frame.locked i { border-color: #52c41a; }
.qr-lock {
  position: absolute;
  border: 3px solid #52c41a;
  border-radius: 12px;
  background: rgba(82, 196, 26, .16);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, .35), 0 0 16px rgba(82, 196, 26, .6);
  pointer-events: none;
  transition: left .12s ease-out, top .12s ease-out, width .12s ease-out, height .12s ease-out;
}
@media (prefers-reduced-motion: reduce) {
  .qr-frame i, .qr-lock { transition: none; }
}
/* Рамка нарисована четырьмя уголками. */
.qr-frame i { position: absolute; width: 32px; height: 32px; border: 0 solid #fff; }
.qr-frame i:nth-child(1) { top: 0; left: 0; border-width: 4px 0 0 4px; border-top-left-radius: 16px; }
.qr-frame i:nth-child(2) { top: 0; right: 0; border-width: 4px 4px 0 0; border-top-right-radius: 16px; }
.qr-frame i:nth-child(3) { bottom: 0; left: 0; border-width: 0 0 4px 4px; border-bottom-left-radius: 16px; }
.qr-frame i:nth-child(4) { right: 0; bottom: 0; border-width: 0 4px 4px 0; border-bottom-right-radius: 16px; }
.qr-bottom {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  gap: 12px;
  padding: 16px 16px calc(24px + env(safe-area-inset-bottom));
}
.qr-message {
  margin: 0;
  padding: 10px 16px;
  border-radius: 8px;
  background: rgba(0, 0, 0, .75);
  color: #fff;
  font-size: 14px;
  line-height: 20px;
  text-align: center;
}
.qr-actions { display: flex; justify-content: center; gap: 12px; }
.qr-action {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 20px;
  border: 0;
  border-radius: 22px;
  background: rgba(0, 0, 0, .65);
  color: #fff;
  font-size: 15px;
  cursor: pointer;
  backdrop-filter: blur(8px);
}
.qr-action:active { background: rgba(0, 0, 0, .8); }
.qr-action:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
.qr-action[aria-pressed='true'] { background: #fff; color: #000; }
</style>
