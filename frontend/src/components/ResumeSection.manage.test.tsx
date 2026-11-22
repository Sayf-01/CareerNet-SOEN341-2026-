import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  deleteResume,
  downloadResume,
  getResumeFeedback,
  getResumes,
  replaceResume,
  uploadResume,
} from '../api/resumes'
import type { Resume } from '../types/resume'
import ResumeSection from './ResumeSection'

vi.mock('../api/resumes', () => ({
  getResumes: vi.fn(),
  uploadResume: vi.fn(),
  replaceResume: vi.fn(),
  deleteResume: vi.fn(),
  downloadResume: vi.fn(),
  getResumeFeedback: vi.fn(),
}))

const mockGet = vi.mocked(getResumes)
const mockUpload = vi.mocked(uploadResume)
const mockReplace = vi.mocked(replaceResume)
const mockDelete = vi.mocked(deleteResume)
const mockDownload = vi.mocked(downloadResume)
const mockFeedback = vi.mocked(getResumeFeedback)

function resume(id: number, filename: string, size: number): Resume {
  return { id, filename, content_type: 'application/pdf', size_bytes: size, uploaded_at: '2026-11-10T14:00:00Z' }
}

const pdf = () => new File(['%PDF-1.4'], 'new.pdf', { type: 'application/pdf' })

beforeEach(() => {
  mockGet.mockReset()
  mockUpload.mockReset()
  mockReplace.mockReset()
  mockDelete.mockReset()
  mockDownload.mockReset()
  mockFeedback.mockReset()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

async function renderWith(list: Resume[]) {
  mockGet.mockResolvedValue(list)
  render(<ResumeSection />)
  await waitFor(() => expect(screen.queryByText('Loading resumes...')).not.toBeInTheDocument())
}

describe('ResumeSection list', () => {
  it('shows an empty message when there are no resumes', async () => {
    await renderWith([])
    expect(screen.getByText('No resumes uploaded yet.')).toBeInTheDocument()
  })

  it('shows an error when the list cannot be loaded', async () => {
    mockGet.mockRejectedValue(new Error('down'))
    render(<ResumeSection />)
    expect(await screen.findByText('Unable to load resumes.')).toBeInTheDocument()
  })

  it('shows file sizes in B, KB and MB', async () => {
    await renderWith([
      resume(1, 'a.pdf', 500),
      resume(2, 'b.pdf', 2048),
      resume(3, 'c.pdf', 3 * 1024 * 1024),
    ])
    expect(screen.getByText(/500 B/)).toBeInTheDocument()
    expect(screen.getByText(/2\.0 KB/)).toBeInTheDocument()
    expect(screen.getByText(/3\.0 MB/)).toBeInTheDocument()
  })
})

describe('ResumeSection upload', () => {
  it('uploads a valid file and refreshes the list', async () => {
    await renderWith([])
    mockUpload.mockResolvedValue(resume(9, 'new.pdf', 10))
    mockGet.mockResolvedValue([resume(9, 'new.pdf', 10)])

    fireEvent.change(screen.getByLabelText('Choose resume to upload'), { target: { files: [pdf()] } })

    expect(await screen.findByText('Resume uploaded successfully!')).toBeInTheDocument()
    expect(screen.getByText('new.pdf')).toBeInTheDocument()
  })

  it('shows the validation message for a bad file and does not upload', async () => {
    await renderWith([])
    const bad = new File(['x'], 'notes.txt', { type: 'text/plain' })

    fireEvent.change(screen.getByLabelText('Choose resume to upload'), { target: { files: [bad] } })

    expect(await screen.findByText(/Only PDF or Word files/)).toBeInTheDocument()
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('shows the server message when the upload fails', async () => {
    await renderWith([])
    mockUpload.mockRejectedValue(new Error('Too many resumes'))

    fireEvent.change(screen.getByLabelText('Choose resume to upload'), { target: { files: [pdf()] } })

    expect(await screen.findByText('Too many resumes')).toBeInTheDocument()
  })

  it('shows a default message when the upload fails with a non-Error', async () => {
    await renderWith([])
    mockUpload.mockRejectedValue('weird')

    fireEvent.change(screen.getByLabelText('Choose resume to upload'), { target: { files: [pdf()] } })

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
  })

  it('ignores a file picker that was closed without a file', async () => {
    await renderWith([])
    fireEvent.change(screen.getByLabelText('Choose resume to upload'), { target: { files: [] } })
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('opens the file picker from the Upload Resume button', async () => {
    await renderWith([])
    const input = screen.getByLabelText('Choose resume to upload')
    const click = vi.spyOn(input, 'click')
    await userEvent.click(screen.getByRole('button', { name: 'Upload Resume' }))
    expect(click).toHaveBeenCalled()
  })
})

describe('ResumeSection replace', () => {
  it('replaces the chosen resume', async () => {
    await renderWith([resume(7, 'old.pdf', 10)])
    mockReplace.mockResolvedValue(resume(7, 'new.pdf', 10))

    await userEvent.click(screen.getByRole('button', { name: 'Replace' }))
    fireEvent.change(screen.getByLabelText('Choose replacement resume'), { target: { files: [pdf()] } })

    expect(await screen.findByText('Resume replaced successfully!')).toBeInTheDocument()
    expect(mockReplace).toHaveBeenCalledWith(7, expect.any(File))
  })

  it('shows the validation message for a bad replacement file', async () => {
    await renderWith([resume(7, 'old.pdf', 10)])
    await userEvent.click(screen.getByRole('button', { name: 'Replace' }))

    fireEvent.change(screen.getByLabelText('Choose replacement resume'), {
      target: { files: [new File(['x'], 'a.exe', { type: 'application/x-msdownload' })] },
    })

    expect(await screen.findByText(/Only PDF or Word files/)).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('shows the error when replacing fails', async () => {
    await renderWith([resume(7, 'old.pdf', 10)])
    mockReplace.mockRejectedValue(new Error('Replace failed'))
    await userEvent.click(screen.getByRole('button', { name: 'Replace' }))

    fireEvent.change(screen.getByLabelText('Choose replacement resume'), { target: { files: [pdf()] } })

    expect(await screen.findByText('Replace failed')).toBeInTheDocument()
  })

  it('does nothing if no replacement was started', async () => {
    await renderWith([resume(7, 'old.pdf', 10)])
    fireEvent.change(screen.getByLabelText('Choose replacement resume'), { target: { files: [pdf()] } })
    expect(mockReplace).not.toHaveBeenCalled()
  })
})

describe('ResumeSection delete', () => {
  it('deletes after the user confirms', async () => {
    await renderWith([resume(7, 'old.pdf', 10)])
    mockDelete.mockResolvedValue(undefined)
    mockGet.mockResolvedValue([])

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('Resume deleted successfully!')).toBeInTheDocument()
    expect(mockDelete).toHaveBeenCalledWith(7)
  })

  it('does nothing when the user cancels', async () => {
    await renderWith([resume(7, 'old.pdf', 10)])
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('shows the error when deleting fails', async () => {
    await renderWith([resume(7, 'old.pdf', 10)])
    mockDelete.mockRejectedValue(new Error('Cannot delete'))

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('Cannot delete')).toBeInTheDocument()
  })
})

describe('ResumeSection download', () => {
  it('downloads the file through a temporary link', async () => {
    await renderWith([resume(7, 'old.pdf', 10)])
    mockDownload.mockResolvedValue(new Blob(['x']))
    const createUrl = vi.fn(() => 'blob:fake')
    const revokeUrl = vi.fn()
    Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: revokeUrl })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.useFakeTimers({ shouldAdvanceTime: true })

    await userEvent.click(screen.getByRole('button', { name: 'Download' }))
    await waitFor(() => expect(click).toHaveBeenCalled())
    await vi.advanceTimersByTimeAsync(1000)

    expect(mockDownload).toHaveBeenCalledWith(7)
    expect(createUrl).toHaveBeenCalled()
    expect(revokeUrl).toHaveBeenCalledWith('blob:fake')
    vi.useRealTimers()
  })

  it('shows the error when the download fails', async () => {
    await renderWith([resume(7, 'old.pdf', 10)])
    mockDownload.mockRejectedValue(new Error('File missing'))

    await userEvent.click(screen.getByRole('button', { name: 'Download' }))

    expect(await screen.findByText('File missing')).toBeInTheDocument()
  })
})

describe('ResumeSection feedback errors', () => {
  it('shows an error when feedback cannot be created', async () => {
    await renderWith([resume(7, 'old.pdf', 10)])
    mockFeedback.mockRejectedValue(new Error('AI unavailable'))

    await userEvent.click(screen.getByRole('button', { name: 'Get AI feedback' }))

    expect(await screen.findByText(/AI unavailable/)).toBeInTheDocument()
  })
})
