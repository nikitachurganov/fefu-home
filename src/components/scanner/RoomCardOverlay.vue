<script setup>
import { computed, ref } from 'vue'
import { CheckCircleFilled, CloseOutlined, EnvironmentOutlined } from '@ant-design/icons-vue'
import roomImg from '../../assets/room-f703.png'

const props = defineProps({
  // Объект помещения из assets: { id, title, roomCode, level, capacity, roomType, hasRelay }
  room: { type: Object, required: true },
  // Если у преподавателя есть пара по расписанию в этой аудитории:
  // { id, title, group, studentCount, capacity, place, level }
  lesson: { type: Object, default: null },
  isTeacher: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'start-class', 'feedback', 'toggle-door'])

// Состояние реле двери (для помещений с реле)
const doorOpen = ref(false)

function toggleDoor() {
  doorOpen.value = !doorOpen.value
  emit('toggle-door', doorOpen.value)
}

const displayRoomCode = computed(() => {
  return props.room.roomCode || props.lesson?.place || props.room.title || 'F703'
})

const displayLevel = computed(() => {
  return props.room.level || props.lesson?.level || '7 уровень'
})

const displayCapacity = computed(() => {
  if (props.room.capacity) return props.room.capacity
  if (props.lesson?.capacity) return `до ${props.lesson.capacity} чел.`
  return 'до 20 чел.'
})

const displayRoomType = computed(() => {
  return props.room.roomType || 'Учебное помещение'
})
</script>

<template>
  <div class="room-card-wrapper" data-name="card-wrapper">
    <!-- Экран 4: Плашка «Дверь открыта» над карточкой -->
    <div v-if="doorOpen" class="door-pill-container" data-name="card-wrapper-pill">
      <div class="door-pill" data-name="Плашка">
        <CheckCircleFilled class="door-pill-icon" />
        <span class="door-pill-text">Дверь открыта</span>
      </div>
    </div>

    <!-- Карточка помещения -->
    <div class="room-card" data-name="card">
      <!-- Фотография с кнопкой закрытия в правом верхнем углу -->
      <div class="room-img-box" data-name="img">
        <img :src="roomImg" alt="Фото помещения" class="room-img" />
        <button
          type="button"
          class="room-close-btn"
          aria-label="Закрыть карточку"
          data-name="Close"
          @click="emit('close')"
        >
          <CloseOutlined />
        </button>
      </div>

      <!-- Основная информация -->
      <div class="room-main" data-name="main">
        <!-- Сценарий 2: Преподаватель с парой по расписанию -->
        <template v-if="isTeacher && lesson">
          <div class="lesson-header">
            <h4 class="lesson-title">{{ lesson.title }}</h4>
            <p class="lesson-sub">
              {{ lesson.group }}{{ lesson.studentCount ? `, ${lesson.studentCount} чел.` : '' }}
            </p>
          </div>
          <div class="placement-row">
            <span class="placement-item">
              <EnvironmentOutlined class="placement-icon" />
              <span>{{ displayRoomCode }}</span>
            </span>
            <span class="bullet" aria-hidden="true"></span>
            <span>{{ displayLevel }}</span>
            <span class="bullet" aria-hidden="true"></span>
            <span>{{ displayCapacity }}</span>
          </div>
        </template>

        <!-- Сценарий 3 & 4: Дефолтный результат или помещение с реле двери -->
        <template v-else>
          <div class="placement-row">
            <span class="room-code-heading">{{ displayRoomCode }}</span>
            <span class="bullet" aria-hidden="true"></span>
            <span>{{ displayLevel }}</span>
            <span class="bullet" aria-hidden="true"></span>
            <span>{{ displayCapacity }}</span>
          </div>
          <p class="room-type-text">{{ displayRoomType }}</p>
        </template>
      </div>

      <!-- Кнопки действий -->
      <div class="room-actions">
        <!-- Сценарий 2: Начать занятие -->
        <a-button
          v-if="isTeacher && lesson"
          type="primary"
          class="btn-action btn-primary-blue"
          block
          @click="emit('start-class')"
        >
          Начать занятие
        </a-button>

        <!-- Сценарий 4: Открыть / Закрыть дверь (реле) -->
        <a-button
          v-else-if="room?.hasRelay"
          type="primary"
          :class="['btn-action', doorOpen ? 'btn-danger-red' : 'btn-primary-blue']"
          block
          @click="toggleDoor"
        >
          {{ doorOpen ? 'Закрыть дверь' : 'Открыть дверь' }}
        </a-button>

        <!-- Кнопка «Обратная связь» во всех сценариях -->
        <a-button class="btn-action btn-default-white" block @click="emit('feedback')">
          Обратная связь
        </a-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.room-card-wrapper {
  position: relative;
  width: 100%;
  max-width: 393px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  box-sizing: border-box;
}

/* Плашка над карточкой при открытой двери (Figma 983:7516) */
.door-pill-container {
  margin-bottom: -20px;
  padding: 0 8px;
  z-index: 0;
  width: 100%;
  box-sizing: border-box;
}

.door-pill {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 8px 12px 28px;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  width: 100%;
  box-sizing: border-box;
}

.door-pill-icon {
  color: #52c41a;
  font-size: 20px;
}

.door-pill-text {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
  color: #fff;
}

/* Белая карточка помещения */
.room-card {
  position: relative;
  z-index: 1;
  background: #ffffff;
  border-radius: 12px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
  box-sizing: border-box;
  width: 100%;
}

/* Блок фото с кнопкой крестика */
.room-img-box {
  position: relative;
  height: 197px;
  border-radius: 8px;
  overflow: hidden;
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.room-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}

.room-close-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 28px;
  height: 28px;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.36);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  transition: background 0.15s ease;
  z-index: 2;
}

.room-close-btn:hover {
  background: rgba(0, 0, 0, 0.55);
}

.room-close-btn:active {
  background: rgba(0, 0, 0, 0.7);
}

/* Информация в карточке */
.room-main {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.lesson-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lesson-title {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: rgba(0, 0, 0, 0.88);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lesson-sub {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  color: rgba(0, 0, 0, 0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.room-code-heading {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: rgba(0, 0, 0, 0.88);
}

.placement-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Inter', sans-serif;
  font-size: 14px;
  line-height: 22px;
  color: rgba(0, 0, 0, 0.88);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.placement-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.placement-icon {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
}

.bullet {
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(18, 18, 18, 0.12);
  flex-shrink: 0;
}

.room-type-text {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Inter', sans-serif;
  font-size: 14px;
  line-height: 22px;
  color: rgba(0, 0, 0, 0.65);
}

/* Кнопки */
.room-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.btn-action {
  height: 40px !important;
  border-radius: 8px !important;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Inter', sans-serif !important;
  font-size: 16px !important;
  font-weight: 400 !important;
  line-height: 24px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-sizing: border-box !important;
}

.btn-primary-blue {
  background: #2d82cf !important;
  border-color: #2d82cf !important;
  color: #ffffff !important;
  box-shadow: 0 2px 0 0 rgba(5, 145, 255, 0.1) !important;
}

.btn-primary-blue:hover {
  background: #3b91df !important;
  border-color: #3b91df !important;
}

.btn-danger-red {
  background: #ff4d4f !important;
  border-color: #ff4d4f !important;
  color: #ffffff !important;
  box-shadow: 0 2px 0 0 rgba(255, 38, 5, 0.06) !important;
}

.btn-danger-red:hover {
  background: #ff7875 !important;
  border-color: #ff7875 !important;
}

.btn-default-white {
  background: #ffffff !important;
  border: 1px solid #d9d9d9 !important;
  color: rgba(0, 0, 0, 0.88) !important;
  box-shadow: 0 2px 0 0 rgba(0, 0, 0, 0.02) !important;
}

.btn-default-white:hover {
  border-color: #4096ff !important;
  color: #4096ff !important;
}
</style>
