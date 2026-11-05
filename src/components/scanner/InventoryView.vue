<script setup>
import { computed } from 'vue'
import { findAsset, parentOf } from '../../data/assets'
import { inventorySummary } from '../../data/sessionModel'

// Инвентаризация: список ожидаемых единиц области, отметка найденных и расхождения.
// Как и SessionView, в компактном виде лежит поверх камеры; в обычном — с полем ручного ввода из слота.
const props = defineProps({
  session: { type: Object, required: true },
  // { type: 'success' | 'warning' | 'error' | 'info', text }
  feedback: { type: Object, default: null },
  compact: Boolean,
})
const emit = defineEmits(['finish', 'cancel'])

const root = computed(() => findAsset(props.session.rootId))
const summary = computed(() => inventorySummary(props.session))
const title = (id) => findAsset(id)?.title ?? 'Неизвестный код'
const elsewherePlace = (id) => parentOf(findAsset(id))?.title ?? '—'
const extras = computed(() => props.session.extras)
</script>

<template>
  <section class="inventory" :class="{ compact }" aria-label="Инвентаризация">
    <header class="inv-head">
      <div class="inv-title">
        <strong>Инвентаризация · {{ root.title }}</strong>
        <span class="inv-counter" aria-live="polite">{{ summary.found.length }} из {{ summary.total }}</span>
      </div>
      <a-progress :percent="summary.total ? Math.round((summary.found.length / summary.total) * 100) : 0" :show-info="false" size="small" />
    </header>

    <a-alert v-if="feedback" show-icon :type="feedback.type" :message="feedback.text" role="status" />

    <section class="inv-group" aria-labelledby="inv-missing">
      <h4 id="inv-missing">Не найдено <span class="count">{{ summary.missing.length }}</span></h4>
      <ul v-if="summary.missing.length">
        <li v-for="id in summary.missing" :key="id"><strong>{{ title(id) }}</strong><small>{{ id }}</small></li>
      </ul>
      <p v-else class="inv-empty">Всё найдено</p>
    </section>

    <section v-if="summary.found.length" class="inv-group" aria-labelledby="inv-found">
      <h4 id="inv-found">Найдено <span class="count">{{ summary.found.length }}</span></h4>
      <ul>
        <li v-for="id in summary.found" :key="id" class="found"><strong>{{ title(id) }}</strong><small>{{ id }}</small></li>
      </ul>
    </section>

    <section v-if="extras.length" class="inv-group" aria-labelledby="inv-extras">
      <h4 id="inv-extras">Расхождения <span class="count">{{ extras.length }}</span></h4>
      <ul>
        <li v-for="extra in extras" :key="extra.id" class="extra">
          <strong>{{ extra.reason === 'unknown' ? 'Неизвестный код' : title(extra.id) }}</strong>
          <small>{{ extra.id }} · {{ extra.reason === 'unknown' ? 'нет в системе' : `числится в другом месте: ${elsewherePlace(extra.id)}` }}</small>
        </li>
      </ul>
    </section>

    <slot />

    <div class="inv-actions">
      <a-button type="primary" size="large" block @click="emit('finish')">Завершить инвентаризацию</a-button>
      <a-button size="large" block @click="emit('cancel')">Отменить</a-button>
    </div>
  </section>
</template>

<style scoped>
.inventory { display: grid; gap: 12px; padding: 12px; border-radius: 16px; background: #fff; }
/* Поверх камеры список ограничен по высоте и прокручивается. */
.inventory.compact { max-height: 52dvh; overflow-y: auto; }
.inv-head { display: grid; gap: 4px; }
.inv-title { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.inv-title strong { color: #101828; font-size: 15px; line-height: 20px; }
.inv-counter { color: rgba(0, 0, 0, .65); font-size: 14px; font-variant-numeric: tabular-nums; }
.inv-head :deep(.ant-progress) { margin: 0; line-height: 1; }
.inv-group { display: grid; gap: 4px; }
.inv-group h4 { margin: 0; color: rgba(0, 0, 0, .65); font-size: 13px; font-weight: 600; }
.count { margin-left: 4px; color: rgba(0, 0, 0, .45); font-weight: 400; font-variant-numeric: tabular-nums; }
.inv-group ul { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
.inv-group li { display: grid; gap: 2px; padding: 8px 12px; border-radius: 12px; background: #fafafa; }
.inv-group li.found { background: #f6ffed; }
.inv-group li.extra { background: #fff7e6; }
.inv-group li strong { color: rgba(0, 0, 0, .88); font-size: 14px; line-height: 20px; }
.inv-group li small { color: rgba(0, 0, 0, .65); font-size: 12px; line-height: 16px; }
.inv-empty { margin: 0; color: rgba(0, 0, 0, .45); font-size: 13px; }
.inv-actions { display: grid; gap: 8px; }
.inv-actions :deep(.ant-btn) { height: 44px; border-radius: 8px; }
</style>
