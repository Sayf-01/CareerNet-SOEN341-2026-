import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch } from './client'
import { getProfile, saveProfile } from './profile'

vi.mock('./client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./client')>()),
  apiFetch: vi.fn(),
}))
const mockApiFetch = vi.mocked(apiFetch)

beforeEach(() => {
  mockApiFetch.mockReset()
})

describe('profile api', () => {
  it('returns the profile', async () => {
    mockApiFetch.mockResolvedValue({ full_name: 'Ada' })
    await expect(getProfile()).resolves.toEqual({ full_name: 'Ada' })
  })

  it('returns null when no profile exists yet', async () => {
    mockApiFetch.mockRejectedValue(new ApiError('none', 404))
    await expect(getProfile()).resolves.toBeNull()
  })

  it('rethrows other errors', async () => {
    const failure = new ApiError('boom', 500)
    mockApiFetch.mockRejectedValue(failure)
    await expect(getProfile()).rejects.toBe(failure)
  })

  it('saves the profile with PUT', async () => {
    const data = { full_name: 'Ada', headline: '', location: '', phone: '', summary: '', skills: [] }
    mockApiFetch.mockResolvedValue(data)
    await saveProfile(data)
    expect(mockApiFetch).toHaveBeenCalledWith('/profile/me', { method: 'PUT', body: JSON.stringify(data) })
  })
})
