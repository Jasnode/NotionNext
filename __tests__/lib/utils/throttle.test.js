/**
 * @jest-environment node
 */
import throttle from '@/lib/utils/throttle'

describe('throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('exposes cancel to clear pending calls like lodash.throttle', () => {
    const callback = jest.fn()
    const throttled = throttle(callback, 100)

    throttled()
    throttled()
    throttled.cancel()
    jest.advanceTimersByTime(100)

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('allows a new immediate call after cancel', () => {
    const callback = jest.fn()
    const throttled = throttle(callback, 100)

    throttled()
    throttled()
    throttled.cancel()
    throttled()

    expect(callback).toHaveBeenCalledTimes(2)
  })
})
