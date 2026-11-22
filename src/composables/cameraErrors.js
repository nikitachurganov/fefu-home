export function cameraErrorMessage(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
    return 'Доступ к камере не получен. Разрешите доступ в настройках браузера и попробуйте снова.'
  }
  if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError' || error?.name === 'DevicesNotFoundError') {
    return 'Камера не найдена. Подключите камеру или введите код вручную.'
  }
  if (error?.name === 'NotReadableError' || error?.name === 'TrackStartError') {
    return 'Не удалось запустить камеру. Проверьте, что она не используется другим приложением.'
  }
  return 'Не удалось получить доступ к камере. Проверьте настройки браузера или введите код вручную.'
}
