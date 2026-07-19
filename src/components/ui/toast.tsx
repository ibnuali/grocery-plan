import { useToasts } from '#/lib/toast'
import { X } from 'lucide-react'

export function Toaster() {
  const { toasts, dismiss } = useToasts()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center justify-between gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg animate-in slide-in-from-bottom-2 ${
            t.variant === 'destructive'
              ? 'border-destructive/40 bg-destructive/10 text-destructive'
              : 'border-border bg-background text-foreground'
          }`}
        >
          <span>{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 hover:opacity-70"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
