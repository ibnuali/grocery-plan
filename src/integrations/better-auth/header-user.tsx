import { authClient } from '#/lib/auth-client'

export default function BetterAuthHeader() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return <div className="h-8 w-8 rounded-full bg-secondary animate-pulse" />
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        {session.user.image ? (
          <img src={session.user.image} alt={session.user.name} className="h-8 w-8 rounded-full" />
        ) : (
          <div className="icon-badge h-8 w-8 rounded-full">
            <span className="text-xs font-semibold">
              {session.user.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        )}
        <button
          onClick={() => {
            void authClient.signOut()
          }}
          className="h-9 px-4 rounded-md text-sm font-medium bg-background text-foreground border border-border hover:bg-accent transition-colors"
        >
          Sign out
        </button>
      </div>
    )
  }

  return null
}
