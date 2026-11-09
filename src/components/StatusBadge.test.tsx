import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import StatusBadge from './StatusBadge'

afterEach(cleanup)

describe('StatusBadge', () => {
  it.each([
    'Applied',
    'Under Review',
    'Interview',
    'Offered',
    'Rejected',
  ] as const)('renders the %s status', (status) => {
    render(<StatusBadge status={status} />)

    expect(screen.getByText(status)).toBeInTheDocument()
  })
})
