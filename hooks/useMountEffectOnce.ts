import { useEffect, useRef } from 'react'

export default function useMountEffectOnce(fn: () => void) {
  const wasExecutedRef = useRef(false)
  useEffect(() => {
    if (!wasExecutedRef.current) {
      fn()
    }
    wasExecutedRef.current = true
  }, [fn])
}