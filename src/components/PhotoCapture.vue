<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { CameraOutlined } from '@ant-design/icons-vue'

// Фото предмета или рабочего места перед началом пользования. На телефоне input открывает камеру,
// на ПК — выбор файла. Снимок остаётся в памяти как data-URL: бэкенда для загрузки пока нет.
defineProps({ label: { type: String, default: 'Сфотографируйте предмет' } })
const emit = defineEmits(['confirm'])

const input = ref(null)
const photo = ref('')
let reader

function onPick(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  reader = new FileReader()
  reader.onload = () => { photo.value = String(reader.result) }
  reader.readAsDataURL(file)
}

onBeforeUnmount(() => reader?.abort())
</script>

<template>
  <section class="photo-capture" aria-label="Фото перед началом">
    <input ref="input" class="photo-input" type="file" accept="image/*" capture="environment" aria-label="Выбрать фото" @change="onPick" />

    <template v-if="!photo">
      <a-button size="large" block @click="input.click()">
        <CameraOutlined /> {{ label }}
      </a-button>
    </template>
    <template v-else>
      <img class="photo-preview" :src="photo" alt="Снимок перед началом пользования" />
      <div class="photo-actions">
        <a-button size="large" @click="input.click()">Переснять</a-button>
        <a-button type="primary" size="large" @click="emit('confirm', photo)">Начать пользование</a-button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.photo-capture { display: grid; gap: 8px; }
.photo-input { display: none; }
.photo-preview { width: 100%; max-height: 220px; border-radius: 12px; object-fit: cover; }
.photo-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.photo-capture :deep(.ant-btn) { height: 44px; border-radius: 8px; }
</style>
