import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import LandingPage from './LandingPage'

describe('LandingPage', () => {
  it('invites visitors to register or log in', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Find Your Next Opportunity' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create Account' })).toHaveAttribute('href', '/register')
    expect(screen.getByRole('link', { name: 'Log In' })).toHaveAttribute('href', '/login')
  })
})
