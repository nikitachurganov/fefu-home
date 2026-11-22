<script setup>
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { userEmail, userFullName } from '../data/campus'

const emit = defineEmits(['profile', 'feedback', 'logout'])
const open = ref(false)
function act(action) {
  open.value = false
  if (action === 'instructions') message.info('Инструкции пока недоступны')
  else emit(action)
}
</script>

<template>
  <a-popover v-model:open="open" trigger="click" placement="bottomRight" :arrow="false" overlay-class-name="profile-menu-overlay">
    <template #content>
      <div class="profile-menu" aria-label="Меню профиля">
        <div class="profile-menu-group">
          <button type="button" class="profile-menu-action" @click="act('instructions')">Инструкции</button>
          <button type="button" class="profile-menu-action" @click="act('feedback')">Поддержка</button>
        </div>
        <button type="button" class="profile-menu-action profile-menu-logout" @click="act('logout')">Выйти из аккаунта</button>
      </div>
    </template>
    <button class="profile-trigger" type="button" :aria-expanded="open" aria-label="Открыть меню профиля">
      <span class="profile-menu-avatar">{{ userFullName[0] }}</span>
      <span class="profile-menu-identity"><span>{{ userFullName }}</span><small>{{ userEmail }}</small></span>
    </button>
  </a-popover>
</template>

<style>
.profile-menu-overlay .ant-popover-inner { padding: 8px; border-radius: 12px; }
.profile-menu { width: 260px; color: #262626; }
.profile-trigger, .profile-menu-account { display: flex; align-items: center; gap: 10px; padding: 0; border: 0; background: transparent; color: #262626; text-align: left; cursor: pointer; }
.profile-trigger { padding: 4px 8px; margin: -4px -8px; border-radius: 12px; transition: background-color 160ms ease; }
.profile-trigger:hover, .profile-trigger[aria-expanded="true"] { background: #f5f5f5; }
.profile-menu-avatar { display: grid; width: 44px; height: 44px; flex: none; place-items: center; border-radius: 8px; background: #c4c4c4; color: #fff; font-size: 20px; }
.profile-menu-identity { display: grid; gap: 2px; font-size: 14px; line-height: 1.25; white-space: nowrap; }
.profile-menu-identity small { color: #909090; font-size: 12px; }
.profile-menu-account { width: 100%; padding: 8px; border-radius: 6px; }
.profile-menu-account:hover, .profile-menu-action:hover { background: #f5f5f5; }
.profile-menu-group { padding: 5px 0; border-bottom: 1px solid #f0f0f0; }
.profile-menu-action { display: block; width: 100%; padding: 10px 8px; border: 0; border-radius: 6px; background: transparent; color: #262626; text-align: left; cursor: pointer; }
.profile-menu-logout { padding: 14px 8px; color: #ff4d4f; border-radius: 0; }
.profile-trigger:focus-visible, .profile-menu button:focus-visible { outline: 2px solid #1677ff; outline-offset: 2px; }
</style>
