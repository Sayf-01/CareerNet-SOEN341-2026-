import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch } from './client'
import { ApplicationError, applyToJob } from './applications'

vi.mock('./client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./client')>()),
  apiFetch: vi.fn(),
}))

const mockApiFetch = vi.mocked(apiFetch)

beforeEach(() => {
  mockApiFetch.mockReset()
})

describe('applyToJob', () => {
  it('posts the job, resume and cover note', async () => {
    mockApiFetch.mockResolvedValue({ id: 1, status: 'Applied' })

    await applyToJob(3, 7, 'Hello')

    expect(mockApiFetch).toHaveBeenCalledWith('/applications', {
      method: 'POST',
      body: JSON.stringify({ job_id: 3, resume_id: 7, cover_note: 'Hello' }),
    })
  })

  it('sends an empty cover note by default', async () => {
    mockApiFetch.mockResolvedValue({ id: 1 })
    await applyToJob(3, 7)
    const body = JSON.parse(String(mockApiFetch.mock.calls[0]?.[1]?.body))
    expect(body.cover_note).toBe('')
  })

  it.each([0, -1, 1.5, Number.NaN])('rejects the invalid job id %s', async (id) => {
    await expect(applyToJob(id, 7)).rejects.toThrow('Invalid job.')
    expect(mockApiFetch).not.toHaveBeenCalled()
  })

  it.each([0, -2, 2.5])('rejects the invalid resume id %s', async (id) => {
    await expect(applyToJob(3, id)).rejects.toThrow('valid resume')
    expect(mockApiFetch).not.toHaveBeenCalled()
  })

  it('rejects a cover note over 1000 characters', async () => {
    const error = await applyToJob(3, 7, 'x'.repeat(1001)).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApplicationError)
    expect((error as ApplicationError).status).toBe(400)
    expect(mockApiFetch).not.toHaveBeenCalled()
  })

  it('turns a 409 into an "already applied" error', async () => {
    mockApiFetch.mockRejectedValue(new ApiError('conflict', 409))
    const error = await applyToJob(3, 7).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApplicationError)
    expect((error as ApplicationError).message).toBe(
      'You have already applied to this job.',
    )
  })

  it('passes other errors through unchanged', async () => {
    const failure = new ApiError('boom', 500)
    mockApiFetch.mockRejectedValue(failure)
    await expect(applyToJob(3, 7)).rejects.toBe(failure)
  })
})
