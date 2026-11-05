<script setup>
import { computed } from 'vue'
import { LockOutlined, RightOutlined } from '@ant-design/icons-vue'
import { assetStatuses, assetTypes, childrenOf, parentOf } from '../../data/assets'

// Паспорт сущности: общая часть и связи «Входит в / Содержит». Содержимое по типам
// (описание, фото, документы, расписание) ещё не определено — см. docs/scanner.md, §11.
const props = defineProps({
  asset: { type: Object, required: true },
  staff: Boolean,
})
const emit = defineEmits(['open'])

const type = computed(() => assetTypes[props.asset.type])
const status = computed(() => assetStatuses[props.asset.status])
const parent = computed(() => parentOf(props.asset))
const children = computed(() => childrenOf(props.asset))
// Закрытые для пользователя сущности видны в списке, но открываются как «Нет доступа».
const isLocked = (asset) => asset.restricted && !props.staff
</script>

<template>
  <article class="passport" aria-label="Паспорт">
    <header class="passport-head">
      <span class="passport-type">{{ type.label }}</span>
      <h3>{{ asset.title }}</h3>
      <p class="passport-meta">
        <code>{{ asset.id }}</code>
        <a-tag :color="status.color">{{ status.label }}</a-tag>
      </p>
    </header>

    <a-alert type="info" show-icon message="Подробности паспорта пока не заполнены" />

    <section v-if="parent" class="passport-links" aria-labelledby="passport-parent">
      <h4 id="passport-parent">Входит в</h4>
      <button type="button" class="passport-link" @click="emit('open', parent.id)">
        <span class="link-copy"><strong>{{ parent.title }}</strong><small>{{ assetTypes[parent.type].label }} · {{ parent.id }}</small></span>
        <RightOutlined aria-hidden="true" />
      </button>
    </section>

    <section v-if="children.length" class="passport-links" aria-labelledby="passport-children">
      <h4 id="passport-children">Содержит <span class="count">{{ children.length }}</span></h4>
      <button v-for="child in children" :key="child.id" type="button" class="passport-link" @click="emit('open', child.id)">
        <span class="link-copy"><strong>{{ child.title }}</strong><small>{{ assetTypes[child.type].label }} · {{ child.id }}</small></span>
        <LockOutlined v-if="isLocked(child)" aria-label="Нет доступа" />
        <RightOutlined v-else aria-hidden="true" />
      </button>
    </section>
  </article>
</template>

<style scoped>
.passport { display: grid; gap: 16px; }
.passport-head { display: grid; gap: 4px; padding: 16px; border-radius: 12px; background: #fff; }
.passport-type { color: rgba(0, 0, 0, .45); font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
.passport-head h3 { margin: 0; color: #101828; font-size: 20px; font-weight: 700; line-height: 28px; }
.passport-meta { display: flex; margin: 4px 0 0; align-items: center; gap: 8px; color: rgba(0, 0, 0, .65); font-size: 14px; }
.passport-meta code { padding: 2px 6px; border-radius: 4px; background: #f5f5f5; font-size: 13px; }
.passport-meta :deep(.ant-tag) { margin: 0; }
.passport-links { display: grid; gap: 4px; }
.passport-links h4 { margin: 0 0 4px; color: rgba(0, 0, 0, .65); font-size: 13px; font-weight: 600; }
.count { margin-left: 4px; color: rgba(0, 0, 0, .45); font-weight: 400; font-variant-numeric: tabular-nums; }
.passport-link { display: flex; min-height: 56px; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 16px; border: 0; border-radius: 12px; background: #fff; color: rgba(0, 0, 0, .45); text-align: left; cursor: pointer; }
.passport-link:active { opacity: .72; }
.passport-link:focus-visible { outline: 3px solid rgba(22, 119, 255, .45); outline-offset: 2px; }
.link-copy { display: grid; min-width: 0; gap: 2px; }
.link-copy strong { color: rgba(0, 0, 0, .88); font-size: 15px; font-weight: 600; line-height: 20px; }
.link-copy small { color: rgba(0, 0, 0, .65); font-size: 12px; line-height: 16px; }
</style>
