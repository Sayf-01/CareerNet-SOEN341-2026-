import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'

// Replace each page and the navbar with a small stand-in, so only the routing is tested.
vi.mock('./components/Navbar', () => ({ default: () => <nav>navbar</nav> }))
vi.mock('./pages/LandingPage', () => ({ default: () => <p>landing page</p> }))
vi.mock('./pages/LoginPage', () => ({ default: () => <p>login page</p> }))
vi.mock('./pages/RegisterPage', () => ({ default: () => <p>register page</p> }))
vi.mock('./pages/DashboardPage', () => ({ default: () => <p>dashboard page</p> }))
vi.mock('./pages/ProfilePage', () => ({ default: () => <p>profile page</p> }))
vi.mock('./pages/JobsPage', () => ({ default: () => <p>jobs page</p> }))
vi.mock('./pages/JobDetailPage', () => ({ default: () => <p>job detail page</p> }))
vi.mock('./pages/MyApplicationsPage', () => ({ default: () => <p>applications page</p> }))
vi.mock('./pages/NotificationsPage', () => ({ default: () => <p>notifications page</p> }))
vi.mock('./pages/RecruiterDashboardPage', () => ({ default: () => <p>recruiter page</p> }))
vi.mock('./pages/RecruiterJobPage', () => ({ default: () => <p>recruiter job page</p> }))

function logIn(role: 'JOB_SEEKER' | 'RECRUITER') {
  localStorage.setItem('access_token', 't')
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ id: 1, full_name: 'Ada', email: 'ada@example.com', role }),
  )
}

function visit(path: string) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  cleanup()
  window.history.pushState({}, '', '/')
})

describe('App routes', () => {
  it('always shows the navbar', () => {
    visit('/')
    expect(screen.getByText('navbar')).toBeInTheDocument()
  })

  it.each([
    ['/', 'landing page'],
    ['/login', 'login page'],
    ['/register', 'register page'],
  ])('shows %s to everyone', (path, text) => {
    visit(path)
    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it.each(['/dashboard', '/profile', '/jobs', '/jobs/5', '/applications', '/notifications', '/recruiter', '/recruiter/jobs/3'])(
    'sends visitors from %s to the login page',
    (path) => {
      visit(path)
      expect(screen.getByText('login page')).toBeInTheDocument()
    },
  )

  it.each([
    ['/dashboard', 'dashboard page'],
    ['/profile', 'profile page'],
    ['/jobs', 'jobs page'],
    ['/jobs/5', 'job detail page'],
    ['/applications', 'applications page'],
    ['/notifications', 'notifications page'],
  ])('lets a job seeker open %s', (path, text) => {
    logIn('JOB_SEEKER')
    visit(path)
    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it('keeps job seekers out of the recruiter pages', () => {
    logIn('JOB_SEEKER')
    visit('/recruiter')
    expect(screen.getByText('dashboard page')).toBeInTheDocument()
  })

  it.each([
    ['/recruiter', 'recruiter page'],
    ['/recruiter/jobs/3', 'recruiter job page'],
  ])('lets a recruiter open %s', (path, text) => {
    logIn('RECRUITER')
    visit(path)
    expect(screen.getByText(text)).toBeInTheDocument()
  })
})
