import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import PostingForm from './PostingForm'

afterEach(() => {
  cleanup()
})

const values = {
  title: 'Developer',
  company: 'CareerNet',
  location: 'Montreal',
  category: 'Software Development',
  description: 'Build things.',
}

describe('PostingForm', () => {
  it('ignores a second submit while the first is still saving', async () => {
    const onSave = vi.fn(() => new Promise<void>(() => {}))
    render(<PostingForm initialValues={values} onSave={onSave} />)

    const form = screen.getByDisplayValue('Developer').closest('form')!
    fireEvent.submit(form)
    await screen.findByRole('button', { name: /saving/i })
    fireEvent.submit(form)

    expect(onSave).toHaveBeenCalledTimes(1)
  })
})
