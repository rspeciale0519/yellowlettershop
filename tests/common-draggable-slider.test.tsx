import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { DraggableSlider } from '@/components/list-builder/common/draggable-slider'

function setup(initial: [number, number] = [20, 120]) {
  const calls: Array<number[]> = []
  render(
    <DraggableSlider
      label="Price"
      value={initial}
      min={0}
      max={200}
      step={10}
      formatValue={(v) => `$${v}`}
      onChange={(v) => calls.push(v)}
      ariaLabel="Price range"
    />,
  )
  return { calls }
}

describe('DraggableSlider (common)', () => {
  it('drags min handle and emits updated value within bounds', async () => {
    const { calls } = setup([20, 120])

    // Track element used for bounds and mouse calc
    const track = screen.getByRole('slider', { name: 'Price range' }) as HTMLElement & {
      getBoundingClientRect: () => DOMRect
    }

    // Mock bounding box to a known width (200px) and origin (left=0)
    Object.defineProperty(track, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        x: 0, y: 0, left: 0, top: 0, right: 200, bottom: 0, width: 200, height: 0, toJSON: () => ({})
      })
    })

    // Min handle has role slider with label "Price minimum value"
    const minHandle = screen.getByRole('slider', { name: /Price minimum value/i })

    // Start dragging
    fireEvent.mouseDown(minHandle)
    // wait a tick for effect to attach document listeners
    await new Promise((r) => setTimeout(r, 0))

    // Move cursor to 50px (25% of 200), expect value to snap to 50 (step=10)
    fireEvent.mouseMove(document, { clientX: 50 })

    // Release
    fireEvent.mouseUp(document)

    // Last call should reflect updated min with preserved max
    assert.ok(calls.length >= 1)
    const last = calls[calls.length - 1]
    assert.deepEqual(last, [50, 120])
  })

  it('respects min <= max - step constraint while dragging', async () => {
    const { calls } = setup([100, 110])

    const track = screen.getByRole('slider', { name: 'Price range' }) as HTMLElement & {
      getBoundingClientRect: () => DOMRect
    }
    track.getBoundingClientRect = () => ({
      x: 0, y: 0, left: 0, top: 0, right: 200, bottom: 0, width: 200, height: 0, toJSON: () => ({}),
    } as any)

    const minHandle = screen.getByRole('slider', { name: /Price minimum value/i })
    fireEvent.mouseDown(minHandle)
    await new Promise((r) => setTimeout(r, 0))

    // Try to move min close to current max (should clamp to max - step = 100)
    // 200px width => 190px maps to value 190, but should clamp to 100
    fireEvent.mouseMove(document, { clientX: 190 })
    fireEvent.mouseUp(document)

    assert.ok(calls.length >= 1)
    const last = calls[calls.length - 1]
    assert.deepEqual(last, [100, 110])
  })
})
