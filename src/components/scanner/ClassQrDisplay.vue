<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import QrCode from '../widgets/QrCode.vue'
import { buildCode } from '../../data/scanCodes'

// Режим вывода QR занятия на весь экран (проектор / мультимедиа).
// Показывает крупный QR, название пары, счётчик отметившихся и таймер до конца пары.
const props = defineProps({
  lesson: { type: Object, required: true },
  session: { type: Object, required: true },
})
const emit = defineEmits(['back'])

const classCode = computed(() => buildCode('class', props.lesson.id))
const attendeeCount = computed(() => props.session.attendees.length)

// Таймер: сколько минут до конца окна чекина.
const remaining = ref(0)
let timerId = null

function updateRemaining() {
  const now = Date.now()
  const diff = props.session.closesAt - now
  remaining.value = Math.max(0, Math.ceil(diff / 60000))
}

onMounted(() => {
  updateRemaining()
  timerId = setInterval(updateRemaining, 10000)
})
onUnmounted(() => clearInterval(timerId))
</script>

<template>
  <Teleport to="body">
    <div class="qr-display" role="dialog" aria-modal="true" aria-label="QR занятия для студентов">
      <button type="button" class="qr-display-back" aria-label="Выйти из полноэкранного режима" @click="emit('back')">
        <ArrowLeftOutlined /> Назад
      </button>

      <div class="qr-display-body">
        <p class="qr-display-suptitle">Отметьтесь на паре</p>
        <h2 class="qr-display-title">{{ lesson.title }}</h2>
        <p class="qr-display-sub">{{ lesson.place }}{{ lesson.floor ? ` · ${lesson.floor}` : '' }}</p>

        <div class="qr-display-code">
          <QrCode :text="classCode" :size="260" :margin="2" label="QR-код пары" :bordered="false" />
        </div>

        <p class="qr-display-hint">Откройте камеру FEFUone и наведите на код</p>

        <div class="qr-display-stats">
          <span class="qr-stat"><strong>{{ attendeeCount }}</strong> отметились</span>
          <span class="qr-stat-sep" aria-hidden="true">·</span>
          <span class="qr-stat">осталось <strong>{{ remaining }}</strong> мин</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.qr-display {
  position: fixed;
  z-index: 1200;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #1a3a6b;
  color: #fff;
}

.qr-display-back {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid rgba(255,255,255,.35);
  border-radius: 8px;
  background: none;
  color: rgba(255,255,255,.85);
  font-size: 15px;
  cursor: pointer;
}
.qr-display-back:hover { background: rgba(255,255,255,.1); }
.qr-display-back:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

.qr-display-body { display: grid; gap: 12px; text-align: center; padding: 24px; }

.qr-display-suptitle { margin: 0; font-size: 14px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; opacity: .7; }
.qr-display-title { margin: 0; font-size: clamp(22px, 4vw, 36px); font-weight: 800; line-height: 1.2; }
.qr-display-sub { margin: 0; font-size: 16px; opacity: .75; }

.qr-display-code { display: flex; justify-content: center; padding: 20px; border-radius: 20px; background: #fff; }

.qr-display-hint { margin: 0; font-size: 15px; opacity: .7; }

.qr-display-stats { display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 18px; }
.qr-stat strong { font-variant-numeric: tabular-nums; }
.qr-stat-sep { opacity: .5; }
</style>
