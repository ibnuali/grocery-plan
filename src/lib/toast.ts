import { useState, useEffect, useCallback } from 'react'

interface Toast {
  id: number
  message: string
  variant: 'default' | 'destructive'
}

let nextId = 0
let listeners: Array<(toasts: Toast[]) => void> = []
let toasts: Toast[] = []

function emit() {
  for (const fn of listeners) fn([...toasts])
}

export function toast(message: string, variant: 'default' | 'destructive' = 'default') {
  const id = nextId++
  toasts = [...toasts, { id, message, variant }]
  emit()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, 4000)
}

export function useToasts() {
  const [state, setState] = useState<Toast[]>(toasts)
  useEffect(() => {
    listeners.push(setState)
    return () => {
      listeners = listeners.filter((fn) => fn !== setState)
    }
  }, [])
  const dismiss = useCallback((id: number) => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, [])
  return { toasts: state, dismiss }
}
