import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import JobCard from './JobCard'

describe('JobCard', () => {
  it('shows the job details and links to the job page', () => {
    render(
      <MemoryRouter>
        <JobCard
          job={{
            id: 12,
            title: 'Data Engineer',
            company: 'CareerNet',
            location: 'Montreal',
            category: 'Data',
            posted_at: '2026-11-07T18:58:43Z',
          }}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Data Engineer' })).toBeInTheDocument()
    expect(screen.getByText('CareerNet')).toBeInTheDocument()
    expect(screen.getByText('Location: Montreal')).toBeInTheDocument()
    expect(screen.getByText('Category: Data')).toBeInTheDocument()
    expect(screen.getByText(/Posted: .*2026/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Details' })).toHaveAttribute('href', '/jobs/12')
  })
})
