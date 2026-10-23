import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../src/App'

describe('UI behavior', () => {
  it('validates allocation input before appending to the workload', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Allocation size'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Allocate' }))
    expect(screen.getByText(/Allocation size must be a positive integer/i)).toBeInTheDocument()
  })

  it('updates event history when allocate and release actions are triggered', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText('Allocation ID'), { target: { value: 'Z8' } })
    fireEvent.change(screen.getByLabelText('Allocation size'), { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: 'Allocate' }))

    expect(screen.getByText(/Queued allocation Z8 for 12 units/i)).toBeInTheDocument()
    const releaseSelect = screen.getByLabelText('Release allocation')
    fireEvent.change(releaseSelect, { target: { value: 'Z8' } })
    fireEvent.click(screen.getByRole('button', { name: 'Release' }))
    expect(screen.getByText(/Queued release for Z8/i)).toBeInTheDocument()
  })
})
