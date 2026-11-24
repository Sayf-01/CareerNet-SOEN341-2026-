import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getProfile, saveProfile } from '../api/profile'
import type { Profile } from '../types/profile'
import ProfilePage from './ProfilePage'

vi.mock('../api/profile', () => ({ getProfile: vi.fn(), saveProfile: vi.fn() }))
vi.mock('../components/ResumeSection', () => ({ default: () => <p>Resume section</p> }))

const mockGet = vi.mocked(getProfile)
const mockSave = vi.mocked(saveProfile)

const saved: Profile = {
  full_name: 'Ada Lovelace',
  headline: 'Engineer',
  location: 'Montreal',
  phone: '514-555-0100',
  summary: 'I write code.',
  skills: ['Python', 'SQL'],
}

beforeEach(() => {
  mockGet.mockReset()
  mockSave.mockReset()
})
afterEach(() => {
  cleanup()
})

describe('ProfilePage', () => {
  it('shows a loading message first', () => {
    mockGet.mockReturnValue(new Promise(() => {}))
    render(<ProfilePage />)
    expect(screen.getByText('Loading profile...')).toBeInTheDocument()
  })

  it('opens the edit form when no profile exists yet', async () => {
    mockGet.mockResolvedValue(null)
    render(<ProfilePage />)
    expect(await screen.findByLabelText('Full Name *')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Save Profile' })).toBeInTheDocument()
  })

  it('shows a saved profile read-only with its fields', async () => {
    mockGet.mockResolvedValue(saved)
    render(<ProfilePage />)

    expect(await screen.findByText('Engineer', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Python, SQL', { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit Profile' })).toBeInTheDocument()
    expect(screen.getByText('Resume section')).toBeInTheDocument()
  })

  it('shows "Not provided" for empty optional fields', async () => {
    mockGet.mockResolvedValue({ ...saved, headline: '', location: '', phone: '', summary: '', skills: [] })
    render(<ProfilePage />)
    await screen.findByRole('button', { name: 'Edit Profile' })
    expect(screen.getAllByText('Not provided', { exact: false })).toHaveLength(5)
  })

  it('shows an error when the profile cannot be loaded', async () => {
    mockGet.mockRejectedValue(new Error('down'))
    render(<ProfilePage />)
    expect(await screen.findByText('Unable to load your profile.')).toBeInTheDocument()
  })

  it('switches to the edit form with the current values', async () => {
    mockGet.mockResolvedValue(saved)
    render(<ProfilePage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Edit Profile' }))
    expect(screen.getByLabelText('Full Name *')).toHaveValue('Ada Lovelace')
    expect(screen.getByLabelText('Skills')).toHaveValue('Python, SQL')
  })

  it('requires a full name', async () => {
    mockGet.mockResolvedValue(null)
    render(<ProfilePage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Save Profile' }))
    expect(screen.getByText('Full name is required.')).toBeInTheDocument()
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('refuses a summary over 2000 characters', async () => {
    mockGet.mockResolvedValue(null)
    render(<ProfilePage />)
    fireEvent.change(await screen.findByLabelText('Full Name *'), { target: { value: 'Ada' } })
    fireEvent.change(screen.getByLabelText('Summary'), { target: { value: 'x'.repeat(2001) } })
    await userEvent.click(screen.getByRole('button', { name: 'Save Profile' }))
    expect(screen.getByText('Summary cannot exceed 2000 characters.')).toBeInTheDocument()
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('refuses more than 30 skills', async () => {
    mockGet.mockResolvedValue(null)
    render(<ProfilePage />)
    fireEvent.change(await screen.findByLabelText('Full Name *'), { target: { value: 'Ada' } })
    fireEvent.change(screen.getByLabelText('Skills'), {
      target: { value: Array.from({ length: 31 }, (_, i) => `s${i}`).join(',') },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Save Profile' }))
    expect(screen.getByText('You can enter a maximum of 30 skills.')).toBeInTheDocument()
  })

  it('saves a trimmed profile and shows it', async () => {
    mockGet.mockResolvedValue(null)
    mockSave.mockResolvedValue({ ...saved, full_name: 'Ada', skills: ['Python', 'SQL'] })
    render(<ProfilePage />)

    await userEvent.type(await screen.findByLabelText('Full Name *'), '  Ada  ')
    await userEvent.type(screen.getByLabelText('Skills'), 'Python, , SQL ,')
    await userEvent.click(screen.getByRole('button', { name: 'Save Profile' }))

    expect(await screen.findByText('Profile saved successfully!')).toBeInTheDocument()
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ full_name: 'Ada', skills: ['Python', 'SQL'] }),
    )
    expect(screen.getByRole('button', { name: 'Edit Profile' })).toBeInTheDocument()
  })

  it('shows an error when saving fails and keeps the form', async () => {
    mockGet.mockResolvedValue(null)
    mockSave.mockRejectedValue(new Error('nope'))
    render(<ProfilePage />)
    await userEvent.type(await screen.findByLabelText('Full Name *'), 'Ada')
    await userEvent.click(screen.getByRole('button', { name: 'Save Profile' }))

    expect(await screen.findByText('Failed to save profile. Please try again.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Profile' })).toBeEnabled()
  })

  it('updates the character counter and clears old messages while typing', async () => {
    mockGet.mockResolvedValue(null)
    render(<ProfilePage />)
    await userEvent.click(await screen.findByRole('button', { name: 'Save Profile' }))
    expect(screen.getByText('Full name is required.')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Summary'), 'Hello')
    expect(screen.queryByText('Full name is required.')).not.toBeInTheDocument()
    expect(screen.getByText('5/2000 characters')).toBeInTheDocument()
  })
})

describe('ProfilePage optional fields', () => {
  it('saves a headline, location and phone typed into the form', async () => {
    mockGet.mockResolvedValue(null)
    mockSave.mockResolvedValue({ ...saved })
    render(<ProfilePage />)

    await userEvent.type(await screen.findByLabelText('Full Name *'), 'Ada')
    await userEvent.type(screen.getByLabelText('Headline'), 'Engineer')
    await userEvent.type(screen.getByLabelText('Location'), 'Montreal')
    await userEvent.type(screen.getByLabelText('Phone'), '514')
    await userEvent.click(screen.getByRole('button', { name: 'Save Profile' }))

    await screen.findByText('Profile saved successfully!')
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ headline: 'Engineer', location: 'Montreal', phone: '514' }),
    )
  })
})
