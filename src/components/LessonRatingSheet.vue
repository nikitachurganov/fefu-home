<script setup>
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { StarFilled, CheckCircleFilled } from '@ant-design/icons-vue'
import BottomSheet from './BottomSheet.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  zIndex: { type: Number, default: undefined },
  lesson: {
    type: Object,
    default: () => ({
      subject: 'Английский язык',
      teacher: 'Иванов Иван Иваныч',
      room: 'А914',
      time: '10:10 - 11:40',
    }),
  },
})

const emit = defineEmits(['close', 'submit'])

const rating = ref(0)
const hoveredRating = ref(0)
const selectedTags = ref([])
const comment = ref('')
const isSubmitted = ref(false)

const ratingDescriptions = {
  1: 'Плохо, материал не понятен',
  2: 'Слабо, было скучно',
  3: 'Нормально, есть вопросы',
  4: 'Хорошо, было полезно',
  5: 'Отлично! Всё понравилось',
}

const positiveTags = [
  'Понятная подача',
  'Интересный материал',
  'Вовлечённость группы',
  'Отличный темп',
  'Полезная практика',
]

const criticalTags = [
  'Слишком быстрый темп',
  'Сложно понять тему',
  'Было шумно в аудитории',
  'Проблемы с оборудованием',
  'Мало практики',
]

const currentTags = computed(() => {
  const current = hoveredRating.value || rating.value
  if (current >= 4) return positiveTags
  if (current > 0) return criticalTags
  return positiveTags
})

const activeRatingText = computed(() => {
  const current = hoveredRating.value || rating.value
  return ratingDescriptions[current] || 'Нажмите на звезду для оценки'
})

function toggleTag(tag) {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

function setRating(val) {
  rating.value = val
}

function onSubmit() {
  if (rating.value === 0) {
    message.warning('Пожалуйста, выберите оценку занятия от 1 до 5 звёзд')
    return
  }
  isSubmitted.value = true
  emit('submit', {
    rating: rating.value,
    tags: [...selectedTags.value],
    comment: comment.value.trim(),
    lesson: props.lesson,
  })
}

function onClose() {
  emit('close')
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    isSubmitted.value = false
    rating.value = 0
    hoveredRating.value = 0
    selectedTags.value = []
    comment.value = ''
  }
})
</script>

<template>
  <BottomSheet :open="open" :z-index="zIndex" @close="onClose">
    <div class="rating-sheet" role="dialog" aria-labelledby="rating-sheet-title">
      <!-- Успешное состояние после отправки -->
      <div v-if="isSubmitted" class="sheet-success-state">
        <CheckCircleFilled class="success-icon" aria-hidden="true" />
        <h2 class="sheet-title">Спасибо за обратную связь!</h2>
        <p class="sheet-desc">
          Ваш отзыв анонимен. Он поможет улучшить преподавание дисциплины «{{ lesson.subject }}» в ДВФУ.
        </p>
        <button type="button" class="btn-primary" @click="onClose">
          Готово
        </button>
      </div>

      <!-- Форма оценки -->
      <template v-else>
        <h2 id="rating-sheet-title" class="sheet-title">Оцените занятие</h2>
        <p class="sheet-desc">
          Поделитесь впечатлениями о прошедшей паре. Ваш отзыв анонимен и поможет преподавателю скорректировать подачу материала.
        </p>

        <!-- Карточка занятия -->
        <div class="lesson-summary-card">
          <div class="summary-header">
            <span class="summary-subject">{{ lesson.subject }}</span>
            <span class="summary-teacher">{{ lesson.teacher }}</span>
          </div>
          <div class="summary-divider" role="separator"></div>
          <div class="summary-meta">
            <span class="summary-room">{{ lesson.room || 'А914' }}</span>
            <span class="summary-time">{{ lesson.time || '10:10 - 11:40' }}</span>
          </div>
        </div>

        <!-- Звёздный рейтинг -->
        <div class="rating-stars-section">
          <div class="stars-row" role="radiogroup" aria-label="Оценка занятия от 1 до 5 звезд">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              class="star-btn"
              :class="{ 'is-active': (hoveredRating || rating) >= star }"
              :aria-label="`${star} звезд из 5`"
              @click="setRating(star)"
              @mouseenter="hoveredRating = star"
              @mouseleave="hoveredRating = 0"
            >
              <StarFilled aria-hidden="true" />
            </button>
          </div>
          <span class="rating-hint" :class="{ 'has-rating': (hoveredRating || rating) > 0 }">
            {{ activeRatingText }}
          </span>
        </div>

        <!-- Быстрые критерии (теги) -->
        <div v-if="rating > 0" class="rating-tags-section">
          <span class="section-label">Что повлияло на оценку?</span>
          <div class="tags-cloud">
            <button
              v-for="tag in currentTags"
              :key="tag"
              type="button"
              class="tag-pill"
              :class="{ 'is-selected': selectedTags.includes(tag) }"
              @click="toggleTag(tag)"
            >
              {{ tag }}
            </button>
          </div>
        </div>

        <!-- Поле для свободного комментария -->
        <div class="rating-comment-section">
          <label for="rating-comment" class="section-label">Комментарий (необязательно)</label>
          <a-textarea
            id="rating-comment"
            v-model:value="comment"
            placeholder="Что особенно запомнилось или что можно сделать лучше?"
            :rows="3"
            :maxlength="300"
            show-count
            class="comment-textarea"
          />
        </div>

        <!-- Кнопки действий -->
        <div class="sheet-actions">
          <button
            type="button"
            class="btn-primary"
            :disabled="rating === 0"
            @click="onSubmit"
          >
            Отправить отзыв
          </button>
          <button type="button" class="btn-cancel" @click="onClose">
            Оценить позже
          </button>
        </div>
      </template>
    </div>
  </BottomSheet>
</template>

<style scoped>
.rating-sheet {
  display: flex;
  flex-direction: column;
  padding: 4px 8px 12px;
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
  line-height: 18px;
  color: rgba(18, 18, 18, 0.65);
}

/* Карточка занятия */
.lesson-summary-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px 12px;
  background: #f5f6f8;
  border-radius: 12px;
  margin-bottom: 20px;
}

.summary-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-subject {
  font-size: 16px;
  font-weight: 700;
  line-height: 20px;
  color: rgba(0, 0, 0, 0.88);
}

.summary-teacher {
  font-size: 13px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.65);
}

.summary-divider {
  width: 100%;
  height: 1px;
  background: rgba(0, 0, 0, 0.08);
  margin: 2px 0;
}

.summary-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  line-height: 18px;
}

.summary-room {
  color: #2867ab;
  font-weight: 600;
}

.summary-time {
  color: rgba(0, 0, 0, 0.55);
}

/* Звёзды */
.rating-stars-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.stars-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.star-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  font-size: 34px;
  color: #e2e4e8;
  transition: transform 120ms ease, color 150ms ease;
  line-height: 1;
}

.star-btn:hover {
  transform: scale(1.15);
}

.star-btn.is-active {
  color: #faad14;
}

.star-btn:focus-visible {
  outline: 2px solid #2867ab;
  border-radius: 4px;
}

.rating-hint {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.45);
  min-height: 18px;
  transition: color 150ms ease;
}

.rating-hint.has-rating {
  color: #faad14;
  font-weight: 600;
}

/* Теги */
.rating-tags-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.75);
}

.tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-pill {
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #ffffff;
  color: rgba(0, 0, 0, 0.75);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  line-height: 16px;
  cursor: pointer;
  transition: all 120ms ease;
}

.tag-pill:hover {
  border-color: #2867ab;
  color: #2867ab;
}

.tag-pill.is-selected {
  background: #e9f2fa;
  border-color: #2867ab;
  color: #2867ab;
  font-weight: 600;
}

/* Комментарий */
.rating-comment-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
}

.comment-textarea {
  border-radius: 8px;
}

/* Кнопки */
.sheet-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.btn-primary {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  background: #2867ab;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 150ms ease, opacity 150ms ease;
}

.btn-primary:hover:not(:disabled) {
  background: #1f538d;
}

.btn-primary:active:not(:disabled) {
  background: #174272;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  width: 100%;
  height: 44px;
  border-radius: 12px;
  background: transparent;
  color: rgba(0, 0, 0, 0.65);
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}

.btn-cancel:hover {
  background: rgba(0, 0, 0, 0.04);
}

/* Экран успеха */
.sheet-success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 8px 12px;
  gap: 12px;
}

.success-icon {
  font-size: 48px;
  color: #52c41a;
  margin-bottom: 4px;
}
</style>
