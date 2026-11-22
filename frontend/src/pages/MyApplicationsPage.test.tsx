import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getMyApplications } from '../api/myApplications'
import type { MyApplication } from '../types/application'
import MyApplicationsPage from './MyApplicationsPage'

vi.mock('../api/myApplications', () => ({ getMyApplications: vi.fn() }))
const mockGet = vi.mocked(getMyApplications)

function app(overrides: Partial<MyApplication>): MyApplication {
  return {
    id: 1,
    job_title: 'Developer',
    company: 'CareerNet',
    status: 'Applied',
    applied_at: '2026-11-01T12:00:00Z',
    updated_at: '2026-11-02T12:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  mockGet.mockReset()
})
afterEach(() => {
  cleanup()
})

describe('MyApplicationsPage', () => {
  it('shows a loading message first', () => {
    mockGet.mockReturnValue(new Promise(() => {}))
    render(<MyApplicationsPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading your applications...')
  })

  it('shows an empty state when there are no applications', async () => {
    mockGet.mockResolvedValue([])
    render(<MyApplicationsPage />)
    expect(await screen.findByText('No applications yet')).toBeInTheDocument()
  })

  it('shows an error when loading fails', async () => {
    mockGet.mockRejectedValue(new Error('down'))
    render(<MyApplicationsPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load your applications')
  })

  it('lists applications newest first with their status and total', async () => {
    mockGet.mockResolvedValue([
      app({ id: 1, job_title: 'Older Job', applied_at: '2026-10-01T12:00:00Z' }),
      app({ id: 2, job_title: 'Newer Job', applied_at: '2026-11-05T12:00:00Z', status: 'Offered' }),
    ])
    render(<MyApplicationsPage />)

    expect(await screen.findByText('Total Applications: 2')).toBeInTheDocument()
    const rows = screen.getAllByRole('row').slice(1)
    expect(within(rows[0]).getByText('Newer Job')).toBeInTheDocument()
    expect(within(rows[0]).getByText('Offered')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Older Job')).toBeInTheDocument()
  })

  it('shows the interview time when one is set', async () => {
    mockGet.mockResolvedValue([
      app({ status: 'Interview', interview_at: '2026-11-20T15:00:00Z' }),
    ])
    render(<MyApplicationsPage />)
    expect(await screen.findByText(/Interview:/)).toBeInTheDocument()
  })

  it('shows "Unknown date" for a date it cannot read', async () => {
    mockGet.mockResolvedValue([app({ applied_at: 'not-a-date', updated_at: 'also-bad' })])
    render(<MyApplicationsPage />)
    expect((await screen.findAllByText('Unknown date')).length).toBe(2)
  })
})
