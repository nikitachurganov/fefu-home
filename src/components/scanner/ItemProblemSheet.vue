<script setup>
import { computed, ref, watch } from 'vue'
import { DeleteOutlined, PaperClipOutlined } from '@ant-design/icons-vue'
import BottomSheet from '../BottomSheet.vue'
import { problemTypes } from '../../data/sessionModel'

// Форма «Проблема с ТМЦ» при приёмке: позиция, тип проблемы, описание и фото — всё обязательно.
const MAX = 500

const props = defineProps({
  open: Boolean,
  // [{ value, label }] — позиции заявки
  items: { type: Array, default: () => [] },
  zIndex: { type: Number, default: undefined },
})
const emit = defineEmits(['close', 'submit'])

const key = ref(undefined)
const type = ref(undefined)
const text = ref('')
const photos = ref([])
const submitted = ref(false)
const input = ref(null)

const typeOptions = problemTypes.map((value) => ({ value, label: value }))

function reset() {
  key.value = props.items.length === 1 ? props.items[0].value : undefined
  type.value = undefined
  text.value = ''
  photos.value = []
  submitted.value = false
}

watch(() => props.open, (open) => { if (open) reset() })

const errors = computed(() => (submitted.value
  ? {
      key: key.value ? '' : 'Выберите ТМЦ',
      type: type.value ? '' : 'Выберите тип проблемы',
      text: text.value.trim() ? '' : 'Опишите проблему',
      photos: photos.value.length ? '' : 'Добавьте фото',
    }
  : { key: '', type: '', text: '', photos: '' }))

// Фото остаются в памяти как data-URL: бэкенда для загрузки пока нет.
function onPick(event) {
  const files = [...(event.target.files ?? [])]
  event.target.value = ''
  for (const file of files) {
    const reader = new FileReader()
    reader.onload = () => { photos.value = [...photos.value, { name: file.name, url: String(reader.result) }] }
    reader.readAsDataURL(file)
  }
}

const removePhoto = (index) => { photos.value = photos.value.filter((_, i) => i !== index) }
const popupParent = (trigger) => trigger.parentNode

function submit() {
  submitted.value = true
  if (Object.values(errors.value).some(Boolean)) return
  emit('submit', { key: key.value, type: type.value, text: text.value.trim(), photos: photos.value })
}
</script>

<template>
  <BottomSheet :open="open" :z-index="zIndex" title="Проблема с ТМЦ" @close="emit('close')">
    <form class="problem-form" novalidate @submit.prevent="submit">
      <div class="field">
        <label class="field-label required" for="item-problem-key">ТМЦ</label>
        <a-select
          id="item-problem-key"
          v-model:value="key"
          size="large"
          placeholder="Выберите ТМЦ"
          :options="items"
          :status="errors.key ? 'error' : undefined"
          :get-popup-container="popupParent"
        />
        <p v-if="errors.key" class="field-error" role="alert">{{ errors.key }}</p>
      </div>

      <div class="field">
        <label class="field-label required" for="item-problem-type">Проблема</label>
        <a-select
          id="item-problem-type"
          v-model:value="type"
          size="large"
          placeholder="Выберите тип проблемы"
          :options="typeOptions"
          :status="errors.type ? 'error' : undefined"
          :get-popup-container="popupParent"
        />
        <p v-if="errors.type" class="field-error" role="alert">{{ errors.type }}</p>
      </div>

      <div class="field">
        <label class="field-label required" for="item-problem-text">Описание</label>
        <a-textarea
          id="item-problem-text"
          v-model:value="text"
          class="problem-text"
          :auto-size="{ minRows: 3, maxRows: 5 }"
          :maxlength="MAX"
          placeholder="Что случилось с предметом"
          :status="errors.text ? 'error' : undefined"
        />
        <p v-if="errors.text" class="field-error" role="alert">{{ errors.text }}</p>
      </div>

      <div class="field">
        <span class="field-label required">Фото</span>
        <input ref="input" class="photo-input" type="file" accept="image/*" multiple aria-label="Выбрать фото" @change="onPick" />
        <a-button class="upload" @click="input.click()">Загрузить</a-button>
        <ul v-if="photos.length" class="photos">
          <li v-for="(photo, index) in photos" :key="photo.url">
            <PaperClipOutlined aria-hidden="true" />
            <span class="photo-name">{{ photo.name }}</span>
            <button type="button" class="photo-remove" :aria-label="`Удалить ${photo.name}`" @click="removePhoto(index)"><DeleteOutlined aria-hidden="true" /></button>
          </li>
        </ul>
        <p v-if="errors.photos" class="field-error" role="alert">{{ errors.photos }}</p>
      </div>

      <div class="problem-actions">
        <a-button type="primary" size="large" block html-type="submit">Подтвердить</a-button>
        <a-button size="large" block @click="emit('close')">Закрыть</a-button>
      </div>
    </form>
  </BottomSheet>
</template>

<style scoped>
.problem-form { display: grid; gap: 16px; padding-top: 4px; }
.field { display: grid; gap: 4px; }
.field-label { color: rgba(0, 0, 0, .88); font-size: 15px; line-height: 22px; }
.field-label.required::before { margin-right: 4px; color: #ff4d4f; content: '*'; }
.field-error { margin: 0; color: #ff4d4f; font-size: 13px; line-height: 18px; }
/* 16px, чтобы iOS не увеличивал страницу при фокусе на поле. */
.problem-text, .field :deep(.ant-select-selection-item), .field :deep(.ant-select-selection-placeholder) { font-size: 16px; }
.photo-input { display: none; }
.upload { justify-self: start; }
.photos { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
.photos li { display: flex; align-items: center; gap: 8px; color: rgba(0, 0, 0, .65); font-size: 14px; }
.photo-name { min-width: 0; flex: 1; overflow: hidden; color: #2d82cf; text-overflow: ellipsis; white-space: nowrap; }
.photo-remove { display: grid; width: 32px; height: 32px; place-items: center; border: 0; background: none; color: rgba(0, 0, 0, .45); cursor: pointer; }
.photo-remove:focus-visible { outline: 3px solid rgba(22, 119, 255, .45); outline-offset: 2px; }
.problem-actions { display: grid; gap: 8px; margin-top: 4px; }
.problem-actions :deep(.ant-btn) { height: 44px; border-radius: 8px; }
</style>
