import { describe, it, expect } from 'vitest'
import { render, screen } from '@/tests/utils/testUtils'
import { Button } from './button'

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should render as disabled', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button', { name: /disabled/i })
    expect(button).toBeDisabled()
  })

  it('should handle click events', async () => {
    let clicked = false
    const handleClick = () => {
      clicked = true
    }
    
    render(<Button onClick={handleClick}>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    button.click()
    
    expect(clicked).toBe(true)
  })

  it('should render different variants', () => {
    const { container } = render(<Button variant="outline">Outline</Button>)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('should render different sizes', () => {
    const { container } = render(<Button size="lg">Large</Button>)
    expect(container.firstChild).toBeInTheDocument()
  })
})
