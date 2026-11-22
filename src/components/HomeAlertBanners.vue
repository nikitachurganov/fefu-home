<script setup>
defineProps({
  showRating: { type: Boolean, default: true },
  showAttendance: { type: Boolean, default: true },
  ratingLesson: {
    type: Object,
    default: () => ({
      title: 'Оцените занятие',
      subject: 'Английский язык',
      teacher: 'Иванов Иван Иваныч',
      time: '10:10 - 11:40',
    }),
  },
  attendanceLesson: {
    type: Object,
    default: () => ({
      title: 'Ваша посещаемость упала до 30%',
      subject: 'Английский язык',
      teacher: 'Иванов Иван Иваныч',
      time: '10:10 - 11:40',
      percent: 30,
    }),
  },
})

const emit = defineEmits(['open-rating', 'open-attendance', 'dismiss-rating', 'dismiss-attendance'])
</script>

<template>
  <section class="home-alert-banners" aria-label="Важные уведомления по занятиям">
    <!-- Плашка 1: Оцените занятие (Figma node 1051:1722) -->
    <div
      v-if="showRating"
      class="alert-banner rating-banner"
      role="button"
      tabindex="0"
      :aria-label="`${ratingLesson.title}. Дисциплина: ${ratingLesson.subject}. Преподаватель: ${ratingLesson.teacher}. Время: ${ratingLesson.time}`"
      @click="emit('open-rating')"
      @keydown.enter.space.prevent="emit('open-rating')"
    >
      <div class="banner-content">
        <h3 class="banner-title rating-title">{{ ratingLesson.title }}</h3>
        <div class="banner-details rating-details">
          <div class="banner-row">
            <span class="detail-label">Преподаватель:</span>
            <span class="detail-value">{{ ratingLesson.teacher }}</span>
          </div>
          <div class="banner-row-right">
            <span class="detail-label">Время:</span>
            <span class="detail-value">{{ ratingLesson.time }}</span>
          </div>
          <div class="banner-row full-width">
            <span class="detail-label">Дисциплина:</span>
            <span class="detail-value">{{ ratingLesson.subject }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Плашка 2: Посещаемость упала (Figma node 1051:1792) -->
    <div
      v-if="showAttendance"
      class="alert-banner attendance-banner"
      role="button"
      tabindex="0"
      :aria-label="`${attendanceLesson.title}. Дисциплина: ${attendanceLesson.subject}. Преподаватель: ${attendanceLesson.teacher}. Время: ${attendanceLesson.time}`"
      @click="emit('open-attendance')"
      @keydown.enter.space.prevent="emit('open-attendance')"
    >
      <div class="banner-content">
        <h3 class="banner-title attendance-title">{{ attendanceLesson.title }}</h3>
        <div class="banner-details attendance-details">
          <div class="banner-row">
            <span class="detail-label">Преподаватель:</span>
            <span class="detail-value">{{ attendanceLesson.teacher }}</span>
          </div>
          <div class="banner-row-right">
            <span class="detail-label">Время:</span>
            <span class="detail-value">{{ attendanceLesson.time }}</span>
          </div>
          <div class="banner-row full-width">
            <span class="detail-label">Дисциплина:</span>
            <span class="detail-value">{{ attendanceLesson.subject }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home-alert-banners {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 16px;
  box-sizing: border-box;
}

.alert-banner {
  width: 100%;
  min-height: 103px;
  border-radius: 8px;
  box-sizing: border-box;
  padding: 14px 16px;
  cursor: pointer;
  transition: transform 120ms ease, opacity 120ms ease, box-shadow 120ms ease;
  user-select: none;
}

.alert-banner:active {
  transform: scale(0.99);
  opacity: 0.95;
}

.alert-banner:focus-visible {
  outline: 2px solid #2867ab;
  outline-offset: 2px;
}

/* Плашка «Оцените занятие» (синяя) */
.rating-banner {
  background: #ffffff;
  border: 1px solid #2867ab;
}

.rating-banner:hover {
  box-shadow: 0 2px 8px rgba(40, 103, 171, 0.12);
}

.rating-title {
  color: #2867ab;
}

.rating-details {
  color: #2867ab;
}

/* Плашка «Ваша посещаемость упала до 30%» (красная) */
.attendance-banner {
  background: #fff1f0;
  border: 1px solid #d9363e;
}

.attendance-banner:hover {
  box-shadow: 0 2px 8px rgba(217, 54, 62, 0.12);
}

.attendance-title {
  color: #d9363e;
}

.attendance-details {
  color: #d9363e;
}

.banner-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.banner-title {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 15px;
  font-weight: 700;
  line-height: 20px;
  letter-spacing: -0.2px;
}

.banner-details {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  row-gap: 4px;
  font-size: 11px;
  line-height: 16px;
  font-weight: 400;
}

.banner-row {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1 1 55%;
  min-width: 0;
}

.banner-row-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  flex: 0 0 40%;
  white-space: nowrap;
}

.banner-row.full-width {
  flex: 1 0 100%;
}

.detail-label {
  opacity: 0.9;
}

.detail-value {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
