class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Extracts a human-readable message from an unknown error value, falling back
 * to the provided default when the error is not an `Error` or has no message.
 */
export function errMessage(err: unknown, fallback: string): string {
  return (err instanceof Error && err.message) || fallback
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.error || `Request failed (${res.status})`)
  }
  return res.json()
}

export function apiGet<T>(url: string) {
  return request<T>(url)
}

export function apiPost<T>(url: string, body: unknown) {
  return request<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function apiPut<T>(url: string, body: unknown) {
  return request<T>(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function apiDelete<T>(url: string, body?: unknown) {
  return request<T>(url, {
    method: 'DELETE',
    ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  })
}
