import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { searchJobs } from '../api/jobs'
import type { Job } from '../types/job'
import JobsPage from './JobsPage'

vi.mock('../api/jobs', () => ({ searchJobs: vi.fn(), JOBS_PER_PAGE: 10 }))
const mockSearch = vi.mocked(searchJobs)

function job(id: number, title = `Job ${id}`): Job {
  return {
    id,
    title,
    company: 'CareerNet',
    location: 'Montreal',
    category: 'Design',
    posted_at: '2026-11-07T18:58:43Z',
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <JobsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockSearch.mockReset()
})
afterEach(() => {
  cleanup()
})

describe('JobsPage', () => {
  it('shows a loading message, then the jobs and the count', async () => {
    mockSearch.mockResolvedValue({ items: [job(1), job(2)], total: 2 })
    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Loading jobs...')
    expect(await screen.findByText('Job 1')).toBeInTheDocument()
    expect(screen.getByText('Job 2')).toBeInTheDocument()
    expect(screen.getByText('2').closest('p')).toHaveTextContent('2 jobs found')
    expect(mockSearch).toHaveBeenCalledWith({ keyword: '', location: '', category: '', page: 1 })
  })

  it('uses the singular for one job', async () => {
    mockSearch.mockResolvedValue({ items: [job(1)], total: 1 })
    renderPage()
    expect((await screen.findByText('1')).closest('p')).toHaveTextContent('1 job found')
  })

  it('says no jobs are available when nothing is posted', async () => {
    mockSearch.mockResolvedValue({ items: [], total: 0 })
    renderPage()
    expect(await screen.findByText('No jobs available')).toBeInTheDocument()
  })

  it('shows the error message when loading fails', async () => {
    mockSearch.mockRejectedValue(new Error('Server is down'))
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Server is down')
  })

  it('shows a default message for an error that is not an Error', async () => {
    mockSearch.mockRejectedValue('weird')
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load jobs. Please try again.')
  })

  it('searches with the keyword and selected filters, trimmed', async () => {
    mockSearch.mockResolvedValue({ items: [job(1)], total: 1 })
    renderPage()
    await screen.findByText('Job 1')

    await userEvent.type(screen.getByLabelText('Keyword'), '  python ')
    await userEvent.selectOptions(screen.getByLabelText('Location'), 'Toronto')
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'Design')
    await userEvent.click(screen.getByRole('button', { name: 'Search' }))

    await screen.findByText('Job 1')
    expect(mockSearch).toHaveBeenLastCalledWith({
      keyword: 'python',
      location: 'Toronto',
      category: 'Design',
      page: 1,
    })
  })

  it('says no jobs were found and can clear the filters', async () => {
    mockSearch.mockResolvedValueOnce({ items: [job(1)], total: 1 })
    mockSearch.mockResolvedValueOnce({ items: [], total: 0 })
    mockSearch.mockResolvedValue({ items: [job(1)], total: 1 })
    renderPage()
    await screen.findByText('Job 1')

    await userEvent.type(screen.getByLabelText('Keyword'), 'zzz')
    await userEvent.click(screen.getByRole('button', { name: 'Search' }))
    expect(await screen.findByText('No jobs found')).toBeInTheDocument()

    const clearButtons = screen.getAllByRole('button', { name: 'Clear Filters' })
    await userEvent.click(clearButtons[clearButtons.length - 1])

    expect(await screen.findByText('Job 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Keyword')).toHaveValue('')
    expect(mockSearch).toHaveBeenLastCalledWith({ keyword: '', location: '', category: '', page: 1 })
  })

  it('moves between pages with Previous and Next', async () => {
    mockSearch.mockResolvedValue({ items: [job(1)], total: 25 })
    renderPage()

    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument()
    expect(mockSearch).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))

    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('Page 3 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument()
  })
})
