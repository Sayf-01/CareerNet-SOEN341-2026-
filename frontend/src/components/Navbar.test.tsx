import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../context/AuthContext'
import Navbar from './Navbar'

vi.mock('./NotificationBell', () => ({ default: () => <span>bell</span> }))

function renderNavbar() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/']}>
        <Navbar />
        <Routes>
          <Route path="/" element={<p>Home</p>} />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

function logIn(role: 'JOB_SEEKER' | 'RECRUITER') {
  localStorage.setItem('access_token', 't')
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ id: 1, full_name: 'Ada', email: 'ada@example.com', role }),
  )
}

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  cleanup()
})

describe('Navbar', () => {
  it('shows Register and Login to visitors', () => {
    renderNavbar()
    expect(screen.getByRole('link', { name: 'Register' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument()
  })

  it('shows the job seeker links and email when logged in', () => {
    logIn('JOB_SEEKER')
    renderNavbar()
    expect(screen.getByText('ada@example.com')).toBeInTheDocument()
    for (const name of ['Dashboard', 'My Profile', 'Find Jobs', 'My Applications']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument()
    }
    expect(screen.getByText('bell')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Recruiter Dashboard' })).not.toBeInTheDocument()
  })

  it('shows the recruiter link only to recruiters', () => {
    logIn('RECRUITER')
    renderNavbar()
    expect(screen.getByRole('link', { name: 'Recruiter Dashboard' })).toBeInTheDocument()
  })

  it('logs out and goes to the login page', async () => {
    logIn('JOB_SEEKER')
    renderNavbar()

    await userEvent.click(screen.getByRole('button', { name: 'Logout' }))

    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(localStorage.getItem('access_token')).toBeNull()
  })
})
