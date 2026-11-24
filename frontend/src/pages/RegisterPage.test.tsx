import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { authService } from '../services/authService'
import RegisterPage from './RegisterPage'

vi.mock('../services/authService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/authService')>()),
  authService: { login: vi.fn(), register: vi.fn() },
}))
const mockRegister = vi.mocked(authService.register)

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText('Full name'), ' Ada Lovelace ')
  await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com')
  await userEvent.type(screen.getByLabelText('Password'), 'secret123')
  await userEvent.type(screen.getByLabelText('Confirm password'), 'secret123')
  await userEvent.selectOptions(screen.getByLabelText('I am a'), 'RECRUITER')
}

beforeEach(() => {
  mockRegister.mockReset()
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('RegisterPage', () => {
  it('lists every required field as an error on an empty submit', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    for (const text of [
      'Full name is required.',
      'Email is required.',
      'Password is required.',
      'Please confirm your password.',
      'Please select a role.',
    ]) {
      expect(screen.getByText(text)).toBeInTheDocument()
    }
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('checks the email format, password length and password match', async () => {
    renderPage()
    await userEvent.type(screen.getByLabelText('Full name'), 'Ada')
    await userEvent.type(screen.getByLabelText('Email'), 'bad-email')
    await userEvent.type(screen.getByLabelText('Password'), 'short')
    await userEvent.type(screen.getByLabelText('Confirm password'), 'different')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument()
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
  })

  it('clears an error once the user edits that field', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    await userEvent.type(screen.getByLabelText('Full name'), 'A')
    expect(screen.queryByText('Full name is required.')).not.toBeInTheDocument()
  })

  it('registers, shows success and moves to the login page', async () => {
    mockRegister.mockResolvedValue({ message: 'ok', user: { id: 1, full_name: 'Ada', email: 'ada@example.com', role: 'RECRUITER' } })
    renderPage()
    await fillValidForm()

    vi.useFakeTimers({ shouldAdvanceTime: true })
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Registration successful! Redirecting to login...')).toBeInTheDocument()
    expect(mockRegister).toHaveBeenCalledWith({
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secret123',
      role: 'RECRUITER',
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500)
    })
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('shows the error from the server when registration fails', async () => {
    mockRegister.mockRejectedValue(new Error('boom'))
    renderPage()
    await fillValidForm()
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled()
  })
})
