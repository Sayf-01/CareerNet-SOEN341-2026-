import { afterEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from './client'

afterEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('apiFetch', () => {
  it('sends requests to the /api/v1 endpoint', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await apiFetch('/jobs')

    const requestedUrl = fetchMock.mock.calls[0]?.[0]
    expect(requestedUrl).toBeDefined()
    expect(new URL(String(requestedUrl)).pathname).toMatch(
      /^\/api\/v1(?:\/|$)/,
    )
  })

  it('sends the saved access token as an Authorization header', async () => {
    localStorage.setItem('access_token', 'test-token')
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await apiFetch('/jobs')

    const requestOptions = fetchMock.mock.calls[0]?.[1]
    expect(new Headers(requestOptions?.headers).get('Authorization')).toBe(
      'Bearer test-token',
    )
  })

  it('does not send an Authorization header without a saved token', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    await apiFetch('/jobs')

    const requestOptions = fetchMock.mock.calls[0]?.[1]
    expect(new Headers(requestOptions?.headers).has('Authorization')).toBe(
      false,
    )
  })
})
