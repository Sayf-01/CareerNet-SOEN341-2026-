import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch } from './client'

afterEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

function stubFetch(response: Response) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('apiFetch errors and response types', () => {
  it('rejects paths that do not start with a single slash', async () => {
    await expect(apiFetch('jobs')).rejects.toThrow('single /')
    await expect(apiFetch('//evil.example.com')).rejects.toThrow('single /')
  })

  it('does not add the /api/v1 prefix twice', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 204 }))
    await apiFetch('/api/v1/jobs')
    expect(new URL(String(fetchMock.mock.calls[0]?.[0])).pathname).toBe(
      '/api/v1/jobs',
    )
  })

  it('keeps an Authorization header the caller already set', async () => {
    localStorage.setItem('access_token', 'saved')
    const fetchMock = stubFetch(new Response(null, { status: 204 }))
    await apiFetch('/jobs', { headers: { Authorization: 'Bearer custom' } })
    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers)
    expect(headers.get('Authorization')).toBe('Bearer custom')
  })

  it('sets a JSON content type for string bodies', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 204 }))
    await apiFetch('/jobs', { method: 'POST', body: '{"a":1}' })
    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers)
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('leaves the content type to the browser for FormData uploads', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 204 }))
    await apiFetch('/resumes', {
      method: 'POST',
      body: new FormData(),
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers)
    expect(headers.has('Content-Type')).toBe(false)
  })

  it('reports a connection problem when fetch itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')))
    await expect(apiFetch('/jobs')).rejects.toThrow('Unable to connect')
  })

  it('uses the detail field of an error response', async () => {
    stubFetch(new Response(JSON.stringify({ detail: 'Nope' }), { status: 403 }))
    const error = await apiFetch('/jobs').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).message).toBe('Nope')
    expect((error as ApiError).status).toBe(403)
  })

  it('falls back to the message field of an error response', async () => {
    stubFetch(new Response(JSON.stringify({ message: 'Bad' }), { status: 400 }))
    await expect(apiFetch('/jobs')).rejects.toThrow('Bad')
  })

  it('uses the raw text when the error body is not JSON', async () => {
    stubFetch(new Response('Gateway down', { status: 502 }))
    await expect(apiFetch('/jobs')).rejects.toThrow('Gateway down')
  })

  it('uses a generic message for an empty error body', async () => {
    stubFetch(new Response('', { status: 500 }))
    await expect(apiFetch('/jobs')).rejects.toThrow('Request failed (500).')
  })

  it('uses a generic message when the JSON error has no known field', async () => {
    stubFetch(new Response(JSON.stringify({ other: 1 }), { status: 422 }))
    await expect(apiFetch('/jobs')).rejects.toThrow('Request failed (422).')
  })

  it('parses JSON responses', async () => {
    stubFetch(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    await expect(apiFetch('/jobs')).resolves.toEqual({ ok: true })
  })

  it('returns a Blob for non-JSON responses', async () => {
    stubFetch(
      new Response('file-bytes', {
        status: 200,
        headers: { 'Content-Type': 'application/pdf' },
      }),
    )
    const result = await apiFetch<Blob>('/resumes/1/download')
    expect(result.type).toBe('application/pdf')
    expect(result.size).toBe('file-bytes'.length)
  })
})
