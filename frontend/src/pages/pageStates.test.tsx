import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getApplicationActivity, getApplicationSummary } from '../api/analytics'
import { getJob } from '../api/jobs'
import { getMyApplications } from '../api/myApplications'
import { markAllNotificationsRead, getNotifications } from '../api/notifications'
import { getRecommendations } from '../api/recommendations'
import { archiveJob, getApplicationsForJob, getMyJobs, updateJob } from '../api/recruiter'
import { useAuth } from '../context/useAuth'
import type { JobDetail } from '../types/job'
import DashboardPage from './DashboardPage'
import JobDetailPage from './JobDetailPage'
import NotificationsPage from './NotificationsPage'
import RecruiterDashboardPage from './RecruiterDashboardPage'
import RecruiterJobPage from './RecruiterJobPage'

vi.mock('../api/analytics')
vi.mock('../api/jobs')
vi.mock('../api/myApplications')
vi.mock('../api/notifications')
vi.mock('../api/recommendations')
vi.mock('../api/recruiter')
vi.mock('../context/useAuth')
vi.mock('../components/ApplyDialog', () => ({ default: () => <button type="button">Apply now</button> }))

const job: JobDetail = {
  id: 34,
  title: 'Software Developer',
  company: 'CareerNet Test',
  location: 'Montreal',
  category: 'Software Development',
  description: 'Develop web applications.',
  status: 'open',
  posted_at: '2026-11-07T18:58:43Z',
}

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
  vi.restoreAllMocks()
})

function detailAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/jobs/:id" element={<JobDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function recruiterJobAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/recruiter/jobs/:id" element={<RecruiterJobPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('JobDetailPage states', () => {
  it('shows "Job not found" for an id that is not a number', async () => {
    detailAt('/jobs/abc')
    expect(await screen.findByText('Job not found')).toBeInTheDocument()
    expect(getJob).not.toHaveBeenCalled()
  })

  it('shows the error message when loading fails', async () => {
    vi.mocked(getJob).mockRejectedValue(new Error('Server error'))
    detailAt('/jobs/5')
    expect(await screen.findByText('Unable to load job')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Server error')
  })

  it('shows a default error message for an error that is not an Error', async () => {
    vi.mocked(getJob).mockRejectedValue('weird')
    detailAt('/jobs/5')
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('shows "Job not found" when the server has no such job', async () => {
    vi.mocked(getJob).mockResolvedValue(null)
    detailAt('/jobs/5')
    expect(await screen.findByText('Job not found')).toBeInTheDocument()
  })
})

describe('RecruiterDashboardPage states', () => {
  it('shows the error when postings cannot be loaded', async () => {
    vi.mocked(getMyJobs).mockRejectedValue(new Error('Cannot load postings'))
    render(
      <MemoryRouter>
        <RecruiterDashboardPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Cannot load postings')).toBeInTheDocument()
  })

  it('shows a default error for an error that is not an Error', async () => {
    vi.mocked(getMyJobs).mockRejectedValue('weird')
    render(
      <MemoryRouter>
        <RecruiterDashboardPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Unable to load job postings.')).toBeInTheDocument()
  })
})

describe('RecruiterJobPage states', () => {
  beforeEach(() => {
    vi.mocked(getApplicationsForJob).mockResolvedValue([])
  })

  it('shows "Job not found." when the posting does not exist', async () => {
    vi.mocked(getJob).mockResolvedValue(null)
    recruiterJobAt('/recruiter/jobs/34')
    expect(await screen.findByText('Job not found.')).toBeInTheDocument()
  })

  it('shows the error message when the posting cannot be loaded', async () => {
    vi.mocked(getJob).mockRejectedValue(new Error('Load failed'))
    recruiterJobAt('/recruiter/jobs/34')
    expect(await screen.findByText('Load failed')).toBeInTheDocument()
  })

  it('shows a default message for a load error that is not an Error', async () => {
    vi.mocked(getJob).mockRejectedValue('weird')
    recruiterJobAt('/recruiter/jobs/34')
    expect(await screen.findByText('Unable to load posting.')).toBeInTheDocument()
  })

  it('says "No changes to save." when the form is submitted unchanged', async () => {
    vi.mocked(getJob).mockResolvedValue(job)
    recruiterJobAt('/recruiter/jobs/34')
    await screen.findByDisplayValue('Software Developer')

    const form = screen.getByDisplayValue('Software Developer').closest('form')!
    fireEvent.submit(form)

    expect(await screen.findByText('No changes to save.')).toBeInTheDocument()
    expect(updateJob).not.toHaveBeenCalled()
    expect(archiveJob).not.toHaveBeenCalled()
  })
})

describe('NotificationsPage states', () => {
  it('shows an error when marking all as read fails', async () => {
    vi.mocked(getNotifications).mockResolvedValue({
      items: [
        { id: 1, type: 'status_changed', message: 'Hello', is_read: false, created_at: '2026-11-14T10:00:00Z', application_id: 1, interview_at: null },
      ],
      unread_count: 1,
    })
    vi.mocked(markAllNotificationsRead).mockRejectedValue(new Error('Cannot mark'))
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    )
    await userEvent.click(await screen.findByRole('button', { name: 'Mark all as read' }))
    expect(await screen.findByText('Cannot mark')).toBeInTheDocument()
  })

  it('uses a default message when marking fails with a non-Error', async () => {
    vi.mocked(getNotifications).mockResolvedValue({
      items: [
        { id: 1, type: 'status_changed', message: 'Hello', is_read: false, created_at: '2026-11-14T10:00:00Z', application_id: 1, interview_at: null },
      ],
      unread_count: 1,
    })
    vi.mocked(markAllNotificationsRead).mockRejectedValue('weird')
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    )
    await userEvent.click(await screen.findByRole('button', { name: 'Mark all as read' }))
    await waitFor(() =>
      expect(screen.getByText('Unable to mark notifications as read.')).toBeInTheDocument(),
    )
  })
})

describe('DashboardPage latest applications', () => {
  it('lists only the five newest applications, newest first', async () => {
    vi.mocked(getRecommendations).mockResolvedValue({ items: [], mode: 'fake', resume_used: false, message: null })
    vi.mocked(getApplicationSummary).mockResolvedValue({
      total: 6,
      by_status: { Applied: 6, 'Under Review': 0, Interview: 0, Offered: 0, Rejected: 0 },
    })
    vi.mocked(getApplicationActivity).mockResolvedValue({ days: 30, points: [] })
    vi.mocked(getMyApplications).mockResolvedValue(
      Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        job_title: `Role ${i + 1}`,
        company: 'Acme',
        status: 'Applied' as const,
        applied_at: `2026-11-0${i + 1}T10:00:00Z`,
        updated_at: `2026-11-0${i + 1}T10:00:00Z`,
      })),
    )
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Role 6')).toBeInTheDocument()
    expect(screen.queryByText('Role 1')).not.toBeInTheDocument()
  })
})
