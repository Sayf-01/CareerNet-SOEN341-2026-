import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApplicationError, applyToJob } from '../api/applications'
import { getResumes } from '../api/resumes'
import type { Resume } from '../types/resume'
import ApplyDialog from './ApplyDialog'

vi.mock('../api/resumes', () => ({ getResumes: vi.fn() }))
vi.mock('../api/applications', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/applications')>()),
  applyToJob: vi.fn(),
}))

const mockGetResumes = vi.mocked(getResumes)
const mockApply = vi.mocked(applyToJob)

const resumes: Resume[] = [
  { id: 4, filename: 'cv-2026.pdf', content_type: 'application/pdf', size_bytes: 100, uploaded_at: '2026-11-01T00:00:00Z' },
  { id: 5, filename: 'cv-old.pdf', content_type: 'application/pdf', size_bytes: 100, uploaded_at: '2026-10-01T00:00:00Z' },
]

// jsdom does not implement the <dialog> methods, so add simple versions.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})

function renderDialog() {
  return render(
    <MemoryRouter>
      <ApplyDialog jobId={9} jobTitle="Data Engineer" />
    </MemoryRouter>,
  )
}

async function openDialog() {
  await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
}

beforeEach(() => {
  mockGetResumes.mockReset()
  mockApply.mockReset()
})
afterEach(() => {
  cleanup()
})

describe('ApplyDialog', () => {
  it('loads the resumes when opened and selects the first one', async () => {
    mockGetResumes.mockResolvedValue(resumes)
    renderDialog()
    await openDialog()

    const select = await screen.findByLabelText('Select Resume *')
    expect(select).toHaveValue('4')
    expect(screen.getByText('Data Engineer')).toBeInTheDocument()
  })

  it('tells the user to upload a resume first when there are none', async () => {
    mockGetResumes.mockResolvedValue([])
    renderDialog()
    await openDialog()

    expect(await screen.findByText(/Upload a resume first/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to My Profile' })).toHaveAttribute('href', '/profile')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText(/Upload a resume first/)).not.toBeVisible()
  })

  it('shows an error when the resumes cannot be loaded', async () => {
    mockGetResumes.mockRejectedValue(new Error('down'))
    renderDialog()
    await openDialog()
    expect(await screen.findByText('Unable to load your resumes.')).toBeInTheDocument()
  })

  it('submits the application with the chosen resume and cover note', async () => {
    mockGetResumes.mockResolvedValue(resumes)
    mockApply.mockResolvedValue({ id: 1, status: 'Applied', applied_at: '', message: '' })
    renderDialog()
    await openDialog()

    await userEvent.selectOptions(await screen.findByLabelText('Select Resume *'), '5')
    await userEvent.type(screen.getByLabelText('Cover Note (Optional)'), 'Hi')
    expect(screen.getByText('2/1000 characters')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Submit Application' }))

    expect(await screen.findByText('Application submitted successfully!')).toBeInTheDocument()
    expect(mockApply).toHaveBeenCalledWith(9, 5, 'Hi')
    expect(screen.getByRole('link', { name: 'See my applications' })).toHaveAttribute('href', '/applications')

    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByText('Application submitted successfully!')).not.toBeVisible()
  })

  it('shows "already applied" when the server answers 409', async () => {
    mockGetResumes.mockResolvedValue(resumes)
    mockApply.mockRejectedValue(new ApplicationError('conflict', 409))
    renderDialog()
    await openDialog()
    await screen.findByLabelText('Select Resume *')
    await userEvent.click(screen.getByRole('button', { name: 'Submit Application' }))

    expect(await screen.findByText('You have already applied to this job.')).toBeInTheDocument()
  })

  it('shows the message of any other error', async () => {
    mockGetResumes.mockResolvedValue(resumes)
    mockApply.mockRejectedValue(new Error('Server error'))
    renderDialog()
    await openDialog()
    await screen.findByLabelText('Select Resume *')
    await userEvent.click(screen.getByRole('button', { name: 'Submit Application' }))
    expect(await screen.findByText('Server error')).toBeInTheDocument()
  })

  it('shows a default message for an error that is not an Error', async () => {
    mockGetResumes.mockResolvedValue(resumes)
    mockApply.mockRejectedValue('weird')
    renderDialog()
    await openDialog()
    await screen.findByLabelText('Select Resume *')
    await userEvent.click(screen.getByRole('button', { name: 'Submit Application' }))
    expect(await screen.findByText('Unable to submit your application.')).toBeInTheDocument()
  })

  it('does not submit without a resume chosen', async () => {
    mockGetResumes.mockResolvedValue(resumes)
    renderDialog()
    await openDialog()
    await userEvent.selectOptions(await screen.findByLabelText('Select Resume *'), '')
    expect(screen.getByRole('button', { name: 'Submit Application' })).toBeDisabled()
    expect(mockApply).not.toHaveBeenCalled()
  })

  it('locks the form while the application is being sent', async () => {
    mockGetResumes.mockResolvedValue(resumes)
    mockApply.mockReturnValue(new Promise(() => {}))
    renderDialog()
    await openDialog()
    await screen.findByLabelText('Select Resume *')
    await userEvent.click(screen.getByRole('button', { name: 'Submit Application' }))

    expect(await screen.findByRole('button', { name: 'Submitting...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })

  it('starts fresh each time it is reopened', async () => {
    mockGetResumes.mockResolvedValue(resumes)
    renderDialog()
    await openDialog()
    await userEvent.type(await screen.findByLabelText('Cover Note (Optional)'), 'draft')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await openDialog()
    expect(await screen.findByLabelText('Cover Note (Optional)')).toHaveValue('')
  })
})
