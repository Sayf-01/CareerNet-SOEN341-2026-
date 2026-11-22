import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../context/AuthContext'
import { authService } from '../services/authService'
import LoginPage from './LoginPage'

vi.mock('../services/authService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/authService')>()),
  authService: { login: vi.fn(), register: vi.fn() },
}))
const mockLogin = vi.mocked(authService.login)

function renderPage() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<p>Dashboard page</p>} />
          <Route path="/register" element={<p>Register page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  mockLogin.mockReset()
})
afterEach(() => {
  cleanup()
})

describe('LoginPage', () => {
  it('shows both fields and a link to register', () => {
    renderPage()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create one' })).toHaveAttribute('href', '/register')
  })

  it('asks for both fields when the form is empty', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('rejects an email that is not valid', async () => {
    renderPage()
    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email')
    await userEvent.type(screen.getByLabelText('Password'), 'pw')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument()
    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('clears a field error as soon as the user starts fixing it', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    await userEvent.type(screen.getByLabelText('Email'), 'a')
    expect(screen.queryByText('Email is required.')).not.toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
  })

  it('logs in, saves the session and opens the dashboard', async () => {
    mockLogin.mockResolvedValue({
      access_token: 'tok',
      token_type: 'bearer',
      user: { id: 1, full_name: 'Ada', email: 'ada@example.com', role: 'JOB_SEEKER' },
    })
    renderPage()

    await userEvent.type(screen.getByLabelText('Email'), '  ada@example.com ')
    await userEvent.type(screen.getByLabelText('Password'), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('Dashboard page')).toBeInTheDocument()
    expect(mockLogin).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'secret123' })
    expect(localStorage.getItem('access_token')).toBe('tok')
  })

  it('shows the server message when the login fails', async () => {
    mockLogin.mockRejectedValue(new Error('network'))
    renderPage()

    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'bad')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled()
  })

  it('locks the form while waiting for the server', async () => {
    let finish: (value: never) => void = () => {}
    mockLogin.mockReturnValue(new Promise<never>((resolve) => { finish = resolve }))
    renderPage()

    await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'pw')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled())
    expect(screen.getByRole('button')).toHaveTextContent('Logging in...')
    expect(screen.getByLabelText('Email')).toBeDisabled()
    finish(undefined as never)
  })
})
