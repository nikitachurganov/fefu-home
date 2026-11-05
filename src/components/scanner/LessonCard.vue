<script setup>
import { ref } from 'vue'
import { EnvironmentOutlined, LeftOutlined, MessageOutlined, RightOutlined } from '@ant-design/icons-vue'

// Карточка занятия после отметки на паре: фото аудитории, название, место, преподаватель, вместимость.
// Показывается поверх камеры (ScannerFlow) и на странице результата (ScanResult).
defineProps({
  // { title, place, floor, teacher, capacity, photos }
  lesson: { type: Object, required: true },
})
const emit = defineEmits(['feedback'])

const track = ref(null)

// Карусель — горизонтальная прокрутка с привязкой; стрелки листают на ширину кадра.
function slide(direction) {
  const element = track.value
  // Плавность задаёт CSS (scroll-behavior): вместе с привязкой кадров она работает стабильнее, чем smooth в scrollBy.
  if (element) element.scrollBy({ left: direction * (element.clientWidth + 8) })
}
</script>

<template>
  <article class="lesson-card" aria-label="Занятие">
    <div v-if="lesson.photos.length" class="carousel">
      <div ref="track" class="carousel-track" tabindex="0" aria-label="Фотографии аудитории">
        <img v-for="(photo, index) in lesson.photos" :key="index" :src="photo" :alt="`Аудитория, фото ${index + 1}`" />
      </div>
      <template v-if="lesson.photos.length > 1">
        <button type="button" class="carousel-arrow prev" aria-label="Предыдущее фото" @click="slide(-1)"><LeftOutlined /></button>
        <button type="button" class="carousel-arrow next" aria-label="Следующее фото" @click="slide(1)"><RightOutlined /></button>
      </template>
    </div>

    <h3>{{ lesson.title }}</h3>
    <p class="place"><EnvironmentOutlined aria-hidden="true" />{{ lesson.place }}<span v-if="lesson.floor" class="dot" aria-hidden="true"></span>{{ lesson.floor }}</p>
    <p class="meta">Преподаватель: {{ lesson.teacher }}</p>
    <p class="meta">Вместимость: {{ lesson.capacity }} человек</p>

    <a-button class="feedback" size="large" block @click="emit('feedback')"><MessageOutlined /> Обратная связь</a-button>
  </article>
</template>

<style scoped>
.lesson-card { display: grid; gap: 8px; padding: 16px; border-radius: 16px; background: #fff; }
.carousel { position: relative; }
.carousel-track { display: flex; gap: 8px; overflow-x: auto; border-radius: 12px; scroll-behavior: smooth; scroll-snap-type: x mandatory; scrollbar-width: none; }
@media (prefers-reduced-motion: reduce) { .carousel-track { scroll-behavior: auto; } }
.carousel-track::-webkit-scrollbar { display: none; }
.carousel-track img { flex: 0 0 100%; width: 100%; height: 168px; border-radius: 12px; object-fit: cover; scroll-snap-align: center; }
.carousel-arrow { position: absolute; top: 50%; display: grid; width: 40px; height: 40px; place-items: center; border: 0; border-radius: 50%; background: rgba(0, 0, 0, .35); color: #fff; transform: translateY(-50%); cursor: pointer; }
.carousel-arrow.prev { left: 8px; }
.carousel-arrow.next { right: 8px; }
.carousel-arrow:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
.lesson-card h3 { margin: 4px 0 0; color: #101828; font-size: 20px; font-weight: 700; line-height: 28px; }
.place { display: flex; align-items: center; gap: 8px; margin: 0; color: rgba(0, 0, 0, .65); font-size: 16px; line-height: 24px; }
.dot { width: 4px; height: 4px; border-radius: 50%; background: rgba(0, 0, 0, .25); }
.meta { margin: 0; color: rgba(0, 0, 0, .65); font-size: 16px; line-height: 24px; }
.feedback { height: 48px; margin-top: 4px; border-color: #4a7fd1; border-radius: 8px; color: #4a7fd1; }
</style>
