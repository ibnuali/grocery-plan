import { Link } from '@tanstack/react-router'
import { ShoppingBasket } from 'lucide-react'
import { Button } from '#/components/ui/button'
import BetterAuthHeader from '#/integrations/better-auth/header-user'

interface AppHeaderProps {
  session: { user: { name: string } } | null | undefined
  activeRoute?: string
}

export function AppHeader({ session, activeRoute }: AppHeaderProps) {
  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/categories', label: 'Categories' },
    { to: '/items', label: 'Items' },
    { to: '/lists', label: 'Lists' },
  ] as const

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="page-wrap flex items-center justify-between h-16 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="icon-badge size-9 rounded-md">
            <ShoppingBasket className="size-5" />
          </div>
          <span className="display-title text-xl font-semibold text-foreground">Grocery</span>
        </Link>

        {session?.user ? (
          <div className="flex items-center gap-4">
            <nav className="hidden sm:flex items-center gap-4">
              {navLinks
                .filter((link) => link.to !== '/')
                .map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`nav-link text-sm font-medium${activeRoute === link.to ? ' is-active' : ''}`}
                  >
                    {link.label}
                  </Link>
                ))}
            </nav>
            <BetterAuthHeader />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild className="shadow-sm hover:shadow-md">
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
