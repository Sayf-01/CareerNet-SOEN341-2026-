import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { getNotifications } from '../api/notifications'
import { getRecommendations } from '../api/recommendations'
import { getResumes } from '../api/resumes'
import { useAuth } from '../context/useAuth'
import ApplyDialog from './ApplyDialog'
import NotificationBell from './NotificationBell'
import RecommendedJobs from './RecommendedJobs'

vi.mock('../api/notifications', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/notifications')>()),
  getNotifications: vi.fn(),
}))
vi.mock('../api/recommendations')
vi.mock('../api/resumes', () => ({ getResumes: vi.fn() }))
vi.mock('../api/applications', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/applications')>()),
  applyToJob: vi.fn(),
}))
vi.mock('../context/useAuth')

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
})

beforeEach(() => {
  vi.mocked(useAuth).mockReturnValue({
    token: 't',
    user: { id: 1, full_name: 'Ada', email: 'ada@example.com', role: 'JOB_SEEKER' },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  })
})
afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

describe('RecommendedJobs score colours', () => {
  it('shows a score for strong, medium and weak matches', async () => {
    vi.mocked(getRecommendations).mockResolvedValue({
      items: [75, 50, 10].map((score, i) => ({
        job_id: i + 1,
        title: `Job ${score}`,
        company: 'Acme',
        location: 'Montreal',
        category: 'Software',
        score,
        reasons: ['Reason'],
      })),
      mode: 'ai',
      resume_used: true,
      message: null,
    })
    render(
      <MemoryRouter>
        <RecommendedJobs />
      </MemoryRouter>,
    )
    expect(await screen.findByLabelText('Match score 75 out of 100')).toBeInTheDocument()
    expect(screen.getByLabelText('Match score 50 out of 100')).toBeInTheDocument()
    expect(screen.getByLabelText('Match score 10 out of 100')).toBeInTheDocument()
  })
})

describe('NotificationBell menu', () => {
  it('closes the menu when "View all" is clicked', async () => {
    vi.mocked(getNotifications).mockResolvedValue({ items: [], unread_count: 0 })
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    )
    await userEvent.click(await screen.findByLabelText('Notifications, 0 unread'))
    await userEvent.click(screen.getByRole('link', { name: 'View all' }))
    expect(screen.queryByRole('link', { name: 'View all' })).not.toBeInTheDocument()
  })
})

describe('ApplyDialog guards', () => {
  const resumes = [
    { id: 4, filename: 'cv.pdf', content_type: 'application/pdf', size_bytes: 1, uploaded_at: '2026-11-01T00:00:00Z' },
  ]

  async function open() {
    vi.mocked(getResumes).mockResolvedValue(resumes)
    render(
      <MemoryRouter>
        <ApplyDialog jobId={9} jobTitle="Dev" />
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    await screen.findByLabelText('Select Resume *')
  }

  it('asks for a resume if the form is submitted without one', async () => {
    await open()
    await userEvent.selectOptions(screen.getByLabelText('Select Resume *'), '')
    fireEvent.submit(screen.getByLabelText('Select Resume *').closest('form')!)
    expect(await screen.findByText('Please select a resume.')).toBeInTheDocument()
  })

  it('refuses a cover note over 1000 characters', async () => {
    await open()
    fireEvent.change(screen.getByLabelText('Cover Note (Optional)'), { target: { value: 'x'.repeat(1001) } })
    fireEvent.submit(screen.getByLabelText('Select Resume *').closest('form')!)
    expect(await screen.findByText('Cover note cannot exceed 1000 characters.')).toBeInTheDocument()
  })

  it('cannot be cancelled with Escape while an application is being sent', async () => {
    const { applyToJob } = await import('../api/applications')
    vi.mocked(applyToJob).mockReturnValue(new Promise(() => {}))
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Submit Application' }))
    await screen.findByRole('button', { name: 'Submitting...' })

    const cancel = new Event('cancel', { cancelable: true })
    document.querySelector('dialog')!.dispatchEvent(cancel)

    expect(cancel.defaultPrevented).toBe(true)
  })
})
