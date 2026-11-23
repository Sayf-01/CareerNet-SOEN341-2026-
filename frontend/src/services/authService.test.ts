import { AxiosError, AxiosHeaders } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { post } = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>()
  return {
    ...actual,
    default: { ...actual.default, create: () => ({ post }) },
  }
})

import { authService, getAuthErrorMessage } from './authService'

function axiosError(status: number, data?: unknown) {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError('failed', 'ERR_BAD_REQUEST', config, null, {
    status,
    statusText: 'x',
    headers: {},
    config,
    data,
  })
}

beforeEach(() => {
  post.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe('authService.register', () => {
  it('maps the form fields to the backend field names', async () => {
    post.mockResolvedValue({ data: { message: 'ok' } })

    const result = await authService.register({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secret123',
      role: 'JOB_SEEKER',
    })

    expect(post).toHaveBeenCalledWith('/api/v1/auth/register', {
      full_name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secret123',
      role: 'JOB_SEEKER',
    })
    expect(result).toEqual({ message: 'ok' })
  })
})

describe('authService.login', () => {
  it('posts the credentials and returns the response data', async () => {
    post.mockResolvedValue({ data: { access_token: 'abc' } })

    const result = await authService.login({ email: 'a@b.com', password: 'pw' })

    expect(post).toHaveBeenCalledWith('/api/v1/auth/login', {
      email: 'a@b.com',
      password: 'pw',
    })
    expect(result).toEqual({ access_token: 'abc' })
  })
})

describe('mock login mode', () => {
  async function loadMockService() {
    vi.stubEnv('VITE_USE_MOCK_AUTH', 'true')
    vi.resetModules()
    return (await import('./authService')).authService
  }

  it('accepts the demo password without calling the backend', async () => {
    vi.useFakeTimers()
    const service = await loadMockService()

    const pending = service.login({ email: 'me@example.com', password: 'password123' })
    await vi.advanceTimersByTimeAsync(1000)
    const result = await pending

    expect(result.access_token).toBe('mock-token-123')
    expect(result.user.email).toBe('me@example.com')
    expect(post).not.toHaveBeenCalled()
  })

  it('rejects any other password with a 401-style error', async () => {
    vi.useFakeTimers()
    const service = await loadMockService()
    const { getAuthErrorMessage: message } = await import('./authService')

    const pending = service.login({ email: 'me@example.com', password: 'wrong' })
    const caught = pending.catch((e: unknown) => e)
    await vi.advanceTimersByTimeAsync(1000)

    expect(message(await caught)).toBe('Incorrect email or password.')
  })
})

describe('getAuthErrorMessage', () => {
  it('prefers detail, then message, then error', () => {
    expect(getAuthErrorMessage(axiosError(400, { detail: 'D', message: 'M' }))).toBe('D')
    expect(getAuthErrorMessage(axiosError(400, { message: 'M', error: 'E' }))).toBe('M')
    expect(getAuthErrorMessage(axiosError(400, { error: 'E' }))).toBe('E')
  })

  it('has friendly text for 409, 400 and 500 without a body', () => {
    expect(getAuthErrorMessage(axiosError(409))).toBe(
      'An account with this email already exists.',
    )
    expect(getAuthErrorMessage(axiosError(400))).toBe(
      'Invalid registration data. Please check your inputs.',
    )
    expect(getAuthErrorMessage(axiosError(500))).toBe(
      'Server error. Please try again later.',
    )
  })

  it('uses a generic message for other errors', () => {
    expect(getAuthErrorMessage(axiosError(418))).toBe(
      'Something went wrong. Please try again.',
    )
    expect(getAuthErrorMessage(new Error('plain'))).toBe(
      'Something went wrong. Please try again.',
    )
  })
})
