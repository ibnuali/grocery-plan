import { Link } from '@tanstack/react-router'
import { Menu, ShoppingBasket } from 'lucide-react'
import BetterAuthHeader from '#/integrations/better-auth/header-user'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from '#/components/ui/dialog'

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

  const menuLinks = navLinks.filter((link) => link.to !== '/')

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="page-wrap flex items-center justify-between h-16 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="icon-badge size-9 rounded-md">
            <ShoppingBasket className="size-5" />
          </div>
          <span className="display-title text-xl font-semibold text-foreground">
            Grocery
          </span>
        </Link>

        {session?.user ? (
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-4">
              {menuLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav-link text-sm font-medium${activeRoute === link.to ? ' is-active' : ''}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile hamburger */}
            <Dialog>
              <DialogTrigger
                render={
                  <button
                    className="sm:hidden inline-flex items-center justify-center size-8 rounded-md hover:bg-muted transition-colors"
                    aria-label="Open navigation menu"
                  />
                }
              >
                <Menu className="size-5" />
              </DialogTrigger>
              <DialogContent
                className="top-4 translate-y-0 sm:max-w-xs"
                showCloseButton
              >
                <nav className="flex flex-col gap-1 pt-2">
                  {menuLinks.map((link) => (
                    <DialogClose
                      key={link.to}
                      render={
                        <Link
                          to={link.to}
                          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted${activeRoute === link.to ? ' bg-muted text-foreground' : ' text-muted-foreground'}`}
                        />
                      }
                    >
                      {link.label}
                    </DialogClose>
                  ))}
                </nav>
              </DialogContent>
            </Dialog>

            <BetterAuthHeader />
          </div>
        ) : (
          <></>
        )}
      </div>
    </header>
  )
}
