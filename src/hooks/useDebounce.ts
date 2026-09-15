import { useEffect, useRef, useState } from 'react'

export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}

export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delay = 250
): (...args: A) => void {
  const timer = useRef<number | undefined>(undefined)
  const fnRef = useRef(fn)
  fnRef.current = fn

  return (...args: A) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => fnRef.current(...args), delay)
  }
}