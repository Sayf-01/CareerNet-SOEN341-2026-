import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from './client'
import { getApplicationActivity, getApplicationSummary } from './analytics'

vi.mock('./client', () => ({ apiFetch: vi.fn() }))
const mockApiFetch = vi.mocked(apiFetch)

beforeEach(() => {
  mockApiFetch.mockReset()
})

describe('analytics api', () => {
  it('loads the summary of my applications', async () => {
    mockApiFetch.mockResolvedValue({ total: 2, by_status: {} })
    await expect(getApplicationSummary()).resolves.toEqual({ total: 2, by_status: {} })
    expect(mockApiFetch).toHaveBeenCalledWith('/applications/me/summary')
  })

  it('loads 30 days of activity by default', async () => {
    mockApiFetch.mockResolvedValue({ days: 30, points: [] })
    await getApplicationActivity()
    expect(mockApiFetch).toHaveBeenCalledWith('/applications/me/activity?days=30')
  })

  it('loads the number of days asked for', async () => {
    mockApiFetch.mockResolvedValue({ days: 7, points: [] })
    await getApplicationActivity(7)
    expect(mockApiFetch).toHaveBeenCalledWith('/applications/me/activity?days=7')
  })
})
