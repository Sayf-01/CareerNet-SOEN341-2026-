import { act, cleanup, render, renderHook, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'

import ProtectedRoute from '../components/ProtectedRoute'
import { AuthProvider } from './AuthContext'
import { useAuth } from './useAuth'

const user = {
  id: 1,
  full_name: 'Ada',
  email: 'ada@example.com',
  role: 'JOB_SEEKER' as const,
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  cleanup()
})

describe('AuthProvider', () => {
  it('starts logged out when storage is empty', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.token).toBeNull()
    expect(result.current.user).toBeNull()
  })

  it('restores a saved login after a page refresh', () => {
    localStorage.setItem('access_token', 'saved-token')
    localStorage.setItem('auth_user', JSON.stringify(user))

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual(user)
  })

  it('treats a broken saved user as logged out of the user, not a crash', () => {
    localStorage.setItem('access_token', 'saved-token')
    localStorage.setItem('auth_user', '{not json')

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBe('saved-token')
  })

  it('login saves the token and user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => result.current.login('new-token', user))

    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem('access_token')).toBe('new-token')
    expect(JSON.parse(localStorage.getItem('auth_user') ?? 'null')).toEqual(user)
  })

  it('login without a user only saves the token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => result.current.login('only-token'))

    expect(result.current.token).toBe('only-token')
    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('auth_user')).toBeNull()
  })

  it('logout clears everything', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    act(() => result.current.login('t', user))

    act(() => result.current.logout())

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('auth_user')).toBeNull()
  })
})

describe('useAuth', () => {
  it('throws a clear error outside the provider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used inside <AuthProvider>',
    )
  })
})

describe('ProtectedRoute', () => {
  function renderRoute(role?: 'JOB_SEEKER' | 'RECRUITER') {
    return render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/secret']}>
          <Routes>
            <Route
              path="/secret"
              element={
                <ProtectedRoute requiredRole={role}>
                  <p>Secret page</p>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<p>Login page</p>} />
            <Route path="/dashboard" element={<p>Dashboard page</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    )
  }

  it('sends visitors who are not logged in to the login page', () => {
    renderRoute()
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('shows the page to a logged in user', () => {
    localStorage.setItem('access_token', 't')
    localStorage.setItem('auth_user', JSON.stringify(user))
    renderRoute()
    expect(screen.getByText('Secret page')).toBeInTheDocument()
  })

  it('sends a user with the wrong role to the dashboard', () => {
    localStorage.setItem('access_token', 't')
    localStorage.setItem('auth_user', JSON.stringify(user))
    renderRoute('RECRUITER')
    expect(screen.getByText('Dashboard page')).toBeInTheDocument()
  })

  it('lets a user with the right role in', () => {
    localStorage.setItem('access_token', 't')
    localStorage.setItem('auth_user', JSON.stringify({ ...user, role: 'RECRUITER' }))
    renderRoute('RECRUITER')
    expect(screen.getByText('Secret page')).toBeInTheDocument()
  })
})
