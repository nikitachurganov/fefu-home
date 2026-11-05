<script setup>
import { reactive } from 'vue'
import { message } from 'ant-design-vue'
import { departments, emptyVisibility, userCategories, userRoles, users } from '../../data/visibility'

defineProps({
  // Пока false, все поля только для чтения; режимом управляет футер карточки.
  editing: { type: Boolean, default: false },
})
const emit = defineEmits(['saved'])

const form = reactive(emptyVisibility())
const snapshot = () => JSON.parse(JSON.stringify(form))
// Последнее сохранённое состояние: «Отменить» возвращает форму к нему.
let saved = snapshot()

const userOptions = users.map((user) => ({ value: user.id, label: user.name }))

// Плоский список подразделений превращаем в дерево для a-tree-select.
const departmentTree = (() => {
  const nodes = new Map(departments.map((d) => [d.id, { value: d.id, title: d.title, children: [] }]))
  const roots = []
  for (const d of departments) {
    const node = nodes.get(d.id)
    if (d.parentId) nodes.get(d.parentId).children.push(node)
    else roots.push(node)
  }
  return roots
})()

const filterOption = (input, option) => option.label.toLowerCase().includes(input.toLowerCase())
const filterTreeNode = (input, node) => node.title.toLowerCase().includes(input.toLowerCase())

function save() {
  saved = snapshot()
  message.success('Настройки видимости сохранены')
  emit('saved', snapshot())
}

function cancel() {
  Object.assign(form, JSON.parse(JSON.stringify(saved)))
}

defineExpose({ save, cancel })
</script>

<template>
  <div class="visibility">
    <section class="visibility__section">
      <h3 class="visibility__title">Кому показывать объект</h3>
      <div class="visibility__grid">
        <div class="field">
          <label class="field__label" for="visibility-categories">Категории пользователей</label>
          <a-select
            id="visibility-categories"
            v-model:value="form.categoryIds"
            mode="multiple"
            allow-clear
            :options="userCategories"
            :disabled="!editing"
            max-tag-count="responsive"
            placeholder="Все категории"
            :filter-option="filterOption"
          />
        </div>

        <div class="field">
          <label class="field__label" for="visibility-roles">Роли пользователей</label>
          <a-select
            id="visibility-roles"
            v-model:value="form.roleIds"
            mode="multiple"
            allow-clear
            :options="userRoles"
            :disabled="!editing"
            max-tag-count="responsive"
            placeholder="Все роли"
            :filter-option="filterOption"
          />
        </div>

        <div class="field">
          <label class="field__label" for="visibility-users">Пользователи</label>
          <a-select
            id="visibility-users"
            v-model:value="form.userIds"
            mode="multiple"
            allow-clear
            show-search
            :options="userOptions"
            :disabled="!editing"
            max-tag-count="responsive"
            placeholder="Найти пользователя"
            :filter-option="filterOption"
          />
        </div>
      </div>
    </section>

    <a-divider class="visibility__divider" />

    <section class="visibility__section">
      <h3 class="visibility__title">Ограничение по подразделениям</h3>
      <div class="visibility__grid">
        <div class="field">
          <label class="field__label" for="visibility-departments">Подразделения</label>
          <a-tree-select
            id="visibility-departments"
            v-model:value="form.departmentIds"
            multiple
            allow-clear
            tree-default-expand-all
            :tree-data="departmentTree"
            :disabled="!editing"
            max-tag-count="responsive"
            placeholder="Все подразделения"
            :filter-tree-node="filterTreeNode"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.visibility {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
}

.visibility__section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.visibility__title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 590;
  line-height: 24px;
  color: rgba(0, 0, 0, 0.88);
}

.visibility__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.field__label {
  font-size: 12px;
  line-height: normal;
  color: #595959;
}

.visibility__divider {
  margin: 8px 0;
}

@media (max-width: 1100px) {
  .visibility__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
