import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch } from './client'
import { getJob, JOBS_PER_PAGE, searchJobs } from './jobs'

vi.mock('./client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./client')>()),
  apiFetch: vi.fn(),
}))
const mockApiFetch = vi.mocked(apiFetch)

beforeEach(() => {
  mockApiFetch.mockReset()
})

describe('searchJobs', () => {
  it('asks for page 1 with no filters by default', async () => {
    mockApiFetch.mockResolvedValue({ items: [], total: 0 })
    await searchJobs()
    expect(mockApiFetch).toHaveBeenCalledWith('/jobs?page=1')
  })

  it('sends trimmed keyword, location and category filters', async () => {
    mockApiFetch.mockResolvedValue({ items: [], total: 0 })
    await searchJobs({ keyword: ' python ', location: ' Montreal ', category: ' Data ', page: 3 })
    const url = String(mockApiFetch.mock.calls[0]?.[0])
    const query = new URLSearchParams(url.split('?')[1])
    expect(query.get('page')).toBe('3')
    expect(query.get('keyword')).toBe('python')
    expect(query.get('location')).toBe('Montreal')
    expect(query.get('category')).toBe('Data')
  })

  it('leaves out blank filters', async () => {
    mockApiFetch.mockResolvedValue({ items: [], total: 0 })
    await searchJobs({ keyword: '   ', location: '', category: '  ' })
    expect(mockApiFetch).toHaveBeenCalledWith('/jobs?page=1')
  })

  it.each([0, -3, 1.5, Number.NaN])('falls back to page 1 for page %s', async (page) => {
    mockApiFetch.mockResolvedValue({ items: [], total: 0 })
    await searchJobs({ page })
    expect(mockApiFetch).toHaveBeenCalledWith('/jobs?page=1')
  })

  it('shows 10 jobs per page', () => {
    expect(JOBS_PER_PAGE).toBe(10)
  })
})

describe('getJob', () => {
  it.each([0, -1, 2.5])('returns null without calling the server for id %s', async (id) => {
    await expect(getJob(id)).resolves.toBeNull()
    expect(mockApiFetch).not.toHaveBeenCalled()
  })

  it('returns the job when it exists', async () => {
    mockApiFetch.mockResolvedValue({ id: 5, title: 'Dev' })
    await expect(getJob(5)).resolves.toEqual({ id: 5, title: 'Dev' })
    expect(mockApiFetch).toHaveBeenCalledWith('/jobs/5')
  })

  it('returns null when the job is not found', async () => {
    mockApiFetch.mockRejectedValue(new ApiError('missing', 404))
    await expect(getJob(5)).resolves.toBeNull()
  })

  it('rethrows other errors', async () => {
    const failure = new ApiError('boom', 500)
    mockApiFetch.mockRejectedValue(failure)
    await expect(getJob(5)).rejects.toBe(failure)
  })
})
