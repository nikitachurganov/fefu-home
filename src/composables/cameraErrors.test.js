import { describe, expect, it } from 'vitest'
import { cameraErrorMessage } from './cameraErrors'

describe('cameraErrorMessage', () => {
  it('explains when camera permission was denied', () => {
    expect(cameraErrorMessage({ name: 'NotAllowedError' })).toContain('Доступ к камере не получен')
  })
  it('distinguishes a missing camera from a device in use', () => {
    expect(cameraErrorMessage({ name: 'NotFoundError' })).toContain('Камера не найдена')
    expect(cameraErrorMessage({ name: 'NotReadableError' })).toContain('используется другим приложением')
  })
  it('provides a manual fallback for other camera errors', () => {
    expect(cameraErrorMessage({ name: 'AbortError' })).toContain('введите код вручную')
  })
})
