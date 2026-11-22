<script setup>
import BottomSheet from './BottomSheet.vue'
import educationIcon from '../assets/figma/education.svg'
import eventsIcon from '../assets/figma/events.svg'
import rentIcon from '../assets/figma/rent.svg'
import calendarIcon from '../assets/figma/calendar.svg'

defineProps({
  open: { type: Boolean, default: false },
  zIndex: { type: Number, default: undefined },
})

const emit = defineEmits(['close'])

// Список категорий событий, отображаемых в блоке (по ТЗ раздел 3)
const EVENT_CATEGORIES = [
  {
    id: 'lessons',
    title: 'Занятия',
    description: 'Пары по вашему расписанию',
    icon: educationIcon,
  },
  {
    id: 'events',
    title: 'Мероприятия',
    description: 'События, на которые вы записаны',
    icon: eventsIcon,
  },
  {
    id: 'rent',
    title: 'Аренда ТМЦ (инвентаря)',
    description: 'Выдача и возврат инвентаря',
    icon: rentIcon,
  },
  {
    id: 'booking',
    title: 'Бронирование оборудования и пространств',
    description: 'Аудитории, коворкинги и техника',
    icon: calendarIcon,
  },
]

function onClose() {
  emit('close')
}
</script>

<template>
  <BottomSheet
    :open="open"
    :z-index="zIndex"
    @close="onClose"
  >
    <div class="events-info-sheet" role="dialog" aria-labelledby="events-info-title">
      <h2 id="events-info-title" class="sheet-title">Какие события здесь появятся</h2>

      <p class="sheet-desc">
        В этом блоке мы показываем ближайшие и текущие события из ваших сервисов
      </p>

      <div class="categories-list" role="list">
        <div
          v-for="cat in EVENT_CATEGORIES"
          :key="cat.id"
          class="category-card"
          role="listitem"
        >
          <div class="category-icon" aria-hidden="true">
            <img :src="cat.icon" alt="" />
          </div>
          <div class="category-info">
            <p class="category-title">{{ cat.title }}</p>
            <p class="category-desc">{{ cat.description }}</p>
          </div>
        </div>
      </div>

      <div class="sheet-actions">
        <button type="button" class="btn-cancel" @click="onClose">
          Закрыть
        </button>
      </div>
    </div>
  </BottomSheet>
</template>

<style scoped>
.events-info-sheet {
  display: flex;
  flex-direction: column;
  padding: 4px 8px 8px;
  box-sizing: border-box;
}

.sheet-title {
  margin: 0 0 8px;
  font-size: 19px;
  font-weight: 700;
  line-height: 24px;
  color: rgba(0, 0, 0, 0.88);
  letter-spacing: -0.2px;
}

.sheet-desc {
  margin: 0 0 16px;
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
  color: rgba(18, 18, 18, 0.65);
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.category-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f3f3f3;
  border-radius: 12px;
  box-sizing: border-box;
  cursor: default;
  user-select: none;
}

.category-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.category-icon img {
  width: 32px;
  height: 32px;
  display: block;
}

.category-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.category-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.88);
  word-break: break-word;
}

.category-desc {
  margin: 0;
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
  color: rgba(18, 18, 18, 0.65);
  word-break: break-word;
}

.sheet-actions {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.btn-cancel {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40px;
  background: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  color: rgba(0, 0, 0, 0.88);
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  cursor: pointer;
  box-shadow: 0px 2px 0px 0px rgba(0, 0, 0, 0.02);
  transition: background-color 150ms ease, transform 120ms ease;
}

.btn-cancel:hover {
  background: #f5f5f5;
  border-color: #d0d0d0;
}

.btn-cancel:active {
  background: #e9e9e9;
  transform: scale(0.99);
}

.btn-cancel:focus-visible {
  outline: 2px solid #2867ab;
  outline-offset: 2px;
}
</style>
