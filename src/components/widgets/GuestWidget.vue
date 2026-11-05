<script setup>
const emit = defineEmits(['login'])
</script>

<template>
  <section class="guest" aria-labelledby="guest-title">
    <div class="guest-copy">
      <h2 id="guest-title">После входа доступно больше сервисов</h2>
      <p>В личном кабинете доступны заявки, бронирования, расписание, мероприятия и шаттлы.</p>
    </div>
    <div class="guest-actions">
      <a-button type="primary" size="large" class="login" @click="emit('login')">Войти в аккаунт</a-button>
      <a-button size="large" @click="emit('login')">Зарегистрироваться</a-button>
    </div>
  </section>
</template>

<style scoped>
.guest { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px 24px; padding: 20px 24px; border-radius: 16px; background: #262626; color: #fff; }
.guest-copy { min-width: 0; flex: 1 1 320px; }
.guest h2 { margin: 0 0 4px; color: #fff; font-size: 18px; font-weight: 700; line-height: 24px; }
.guest p { margin: 0; color: rgba(255, 255, 255, .65); font-size: 14px; line-height: 20px; }
.guest-actions { display: flex; flex-shrink: 0; gap: 8px; }
.guest-actions .ant-btn { border-radius: 8px; }
.guest-actions .login.ant-btn { background: #3288d4; border-color: #3288d4; }
</style>
