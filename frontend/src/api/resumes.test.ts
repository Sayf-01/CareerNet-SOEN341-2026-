import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from './client'
import {
  deleteResume,
  downloadResume,
  getResumes,
  replaceResume,
  uploadResume,
} from './resumes'

vi.mock('./client', () => ({ apiFetch: vi.fn() }))
const mockApiFetch = vi.mocked(apiFetch)

const pdf = new File(['%PDF-1.4'], 'cv.pdf', { type: 'application/pdf' })

beforeEach(() => {
  mockApiFetch.mockReset()
})

describe('resumes api', () => {
  it('lists my resumes', async () => {
    mockApiFetch.mockResolvedValue([{ id: 1 }])
    await expect(getResumes()).resolves.toEqual([{ id: 1 }])
    expect(mockApiFetch).toHaveBeenCalledWith('/resumes')
  })

  it('uploads a valid file as multipart form data', async () => {
    mockApiFetch.mockResolvedValue({ id: 2 })
    await uploadResume(pdf)
    const [path, options] = mockApiFetch.mock.calls[0]!
    expect(path).toBe('/resumes')
    expect(options?.method).toBe('POST')
    expect((options?.body as FormData).get('file')).toBeInstanceOf(File)
  })

  it('refuses to upload a file type that is not allowed', async () => {
    const exe = new File(['x'], 'virus.exe', { type: 'application/x-msdownload' })
    await expect(uploadResume(exe)).rejects.toThrow('Only PDF or Word files')
    expect(mockApiFetch).not.toHaveBeenCalled()
  })

  it('replaces a resume with PUT', async () => {
    mockApiFetch.mockResolvedValue({ id: 4 })
    await replaceResume(4, pdf)
    const [path, options] = mockApiFetch.mock.calls[0]!
    expect(path).toBe('/resumes/4')
    expect(options?.method).toBe('PUT')
    expect(options?.body).toBeInstanceOf(FormData)
  })

  it('refuses to replace a resume with an invalid file', async () => {
    const empty = new File([], 'cv.pdf', { type: 'application/pdf' })
    await expect(replaceResume(4, empty)).rejects.toThrow('Only PDF or Word files')
    expect(mockApiFetch).not.toHaveBeenCalled()
  })

  it('deletes a resume', async () => {
    mockApiFetch.mockResolvedValue(undefined)
    await deleteResume(9)
    expect(mockApiFetch).toHaveBeenCalledWith('/resumes/9', { method: 'DELETE' })
  })

  it('downloads a resume', async () => {
    const blob = new Blob(['x'])
    mockApiFetch.mockResolvedValue(blob)
    await expect(downloadResume(9)).resolves.toBe(blob)
    expect(mockApiFetch).toHaveBeenCalledWith('/resumes/9/download')
  })
})
