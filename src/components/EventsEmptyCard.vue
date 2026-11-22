<script setup>
import emptyTrayIcon from '../assets/figma/empty-tray.svg'

// Константы текстов блока (общие для всех типов событий по ТЗ)
const TITLE = 'Сегодня нет событий'
const SUBTITLE = 'Новые события появятся здесь'
const LINK_TEXT = 'Подробнее'

const emit = defineEmits(['open-info'])
</script>

<template>
  <section class="events-empty-card" role="region" aria-label="События">
    <div class="empty-card-content">
      <div class="empty-card-texts">
        <h2 class="empty-card-title">{{ TITLE }}</h2>
        <p class="empty-card-subtitle">{{ SUBTITLE }}</p>
      </div>
      <div>
        <button
          type="button"
          class="empty-card-link"
          aria-label="Подробнее о событиях"
          @click="emit('open-info')"
        >
          {{ LINK_TEXT }}
        </button>
      </div>
    </div>

    <div class="empty-card-illustration" aria-hidden="true">
      <img :src="emptyTrayIcon" alt="" />
    </div>
  </section>
</template>

<style scoped>
.events-empty-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 96px;
  margin-bottom: 12px;
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  box-sizing: border-box;
  gap: 8px;
  width: 100%;
  overflow: clip;
}

.empty-card-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  z-index: 1;
}

.empty-card-texts {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.empty-card-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  line-height: 20px;
  color: #121212;
  word-break: break-word;
}

.empty-card-subtitle {
  margin: 0;
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
  color: rgba(18, 18, 18, 0.8);
  word-break: break-word;
}

.empty-card-link {
  display: inline-flex;
  align-items: center;
  margin: 0;
  padding: 0;
  background: transparent;
  border: 0;
  color: #2867ab;
  font-size: 13px;
  font-weight: 400;
  line-height: 16px;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 120ms ease;
}

.empty-card-link:hover {
  opacity: 0.85;
}

.empty-card-link:focus-visible {
  outline: 2px solid #2867ab;
  outline-offset: 2px;
  border-radius: 2px;
}

.empty-card-illustration {
  flex-shrink: 0;
  width: 80px;
  height: 66px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  user-select: none;
}

.empty-card-illustration img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

@media (max-width: 340px) {
  .events-empty-card {
    padding: 12px;
    gap: 6px;
  }
  .empty-card-title {
    font-size: 14px;
    line-height: 18px;
  }
  .empty-card-subtitle {
    font-size: 12px;
    line-height: 15px;
  }
  .empty-card-illustration {
    width: 68px;
    height: 56px;
  }
}
</style>
