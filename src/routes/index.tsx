import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ShoppingBasket,
  ClipboardList,
  Tag,
  TrendingUp,
  BarChart3,
  CalendarDays,
  Package,
  CircleDollarSign,
  History,
} from 'lucide-react'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import BetterAuthHeader from '#/integrations/better-auth/header-user'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-5 w-5 border-2 border-neutral-300 dark:border-neutral-600 border-t-transparent dark:border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="page-wrap flex items-center justify-between h-16 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div className="flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-[var(--lagoon)] to-[var(--palm)] text-white shadow-sm">
              <ShoppingBasket className="size-5" />
            </div>
            <span className="display-title text-xl font-bold text-[var(--sea-ink)]">Grocery</span>
          </Link>

          {session?.user ? (
            <div className="flex items-center gap-4">
              <nav className="hidden sm:flex items-center gap-4">
                <Link to="/categories" className="nav-link text-sm font-medium">Categories</Link>
                <Link to="/items" className="nav-link text-sm font-medium">Items</Link>
                <Link to="/lists" className="nav-link text-sm font-medium">Lists</Link>
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

      {/* Hero */}
      <main className="flex-1">
        {session?.user ? (
          <AuthenticatedView name={session.user.name} />
        ) : (
          <GuestView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/60 backdrop-blur-sm">
        <div className="page-wrap px-4 sm:px-6 py-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Grocery. Plan smart, shop smart.</p>
        </div>
      </footer>
    </div>
  )
}

function AuthenticatedView({ name }: { name: string }) {
  const quickActions = [
    { icon: ClipboardList, title: 'Shopping List', desc: 'Plan your next trip', color: 'from-[var(--lagoon)] to-[var(--lagoon-deep)]', href: '/lists' },
    { icon: Package, title: 'Item Catalog', desc: 'Manage your items', color: 'from-[var(--palm)] to-emerald-600', href: '/items' },
    { icon: Tag, title: 'Categories', desc: 'Organize by type', color: 'from-amber-500 to-orange-500', href: '/categories' },
    { icon: BarChart3, title: 'Price Charts', desc: 'View price trends', color: 'from-blue-500 to-cyan-500', href: '#' },
  ]

  return (
    <div className="page-wrap px-4 sm:px-6 py-10 sm:py-16">
      <div className="rise-in text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--palm)]/10 text-[var(--palm)] text-xs font-semibold tracking-wide uppercase mb-4">
          <CalendarDays className="size-3.5" />
          Shop Preparation
        </div>
        <h1 className="display-title text-3xl sm:text-4xl font-bold text-[var(--sea-ink)] mb-2">
          Welcome back, {name}
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto">
          Ready to plan your next shopping trip?
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((f, i) => (
          <Link
            key={f.title}
            to={f.href}
            className="rise-in feature-card group relative overflow-hidden rounded-2xl border border-border/60 p-5 cursor-pointer no-underline"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`flex items-center justify-center size-11 rounded-xl bg-gradient-to-br ${f.color} text-white mb-4 shadow-sm group-hover:scale-105 transition-transform`}>
              <f.icon className="size-5" />
            </div>
            <h3 className="font-semibold text-[var(--sea-ink)] mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

function GuestView() {
  const features = [
    {
      icon: ClipboardList,
      title: 'Master Data',
      desc: 'Build your catalog of grocery items with names, categories, and estimated prices.',
    },
    {
      icon: CircleDollarSign,
      title: 'Price History',
      desc: 'Every purchase records the price — track how costs change across weeks and months.',
    },
    {
      icon: TrendingUp,
      title: 'Price Charts',
      desc: 'Visualize historical price data per item to spot trends and plan smarter.',
    },
    {
      icon: CalendarDays,
      title: 'Shop Planning',
      desc: 'Organize weekly or monthly shopping lists so you never miss an essential item.',
    },
  ]

  return (
    <div className="page-wrap px-4 sm:px-6 py-12 sm:py-20">
      {/* Hero */}
      <div className="rise-in text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--lagoon)]/10 text-[var(--lagoon-deep)] text-xs font-semibold tracking-wide uppercase mb-6">
          <ShoppingBasket className="size-3.5" />
          Shop Preparation
        </div>
        <h1 className="display-title text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--sea-ink)] mb-4 leading-tight">
          Plan your grocery
          <br />
          <span className="bg-gradient-to-r from-[var(--lagoon)] to-[var(--palm)] bg-clip-text text-transparent">
            shopping smarter
          </span>
        </h1>
        <p className="text-muted-foreground text-lg sm:text-xl max-w-lg mx-auto mb-8 leading-relaxed">
          Record weekly and monthly purchases, track item prices over time, and always know what to buy and how much it costs.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" asChild className="shadow-md hover:shadow-lg w-full sm:w-auto">
            <Link to="/signup">Get Started Free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 max-w-3xl mx-auto mb-16">
        {features.map((f, i) => (
          <div
            key={f.title}
            className="rise-in feature-card group rounded-2xl border border-border/60 p-6"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-center size-11 rounded-xl bg-gradient-to-br from-[var(--sand)] to-[var(--foam)] text-[var(--palm)] mb-4 shadow-sm group-hover:scale-105 transition-transform">
              <f.icon className="size-5" />
            </div>
            <h3 className="font-semibold text-[var(--sea-ink)] text-lg mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div className="rise-in text-center max-w-2xl mx-auto">
        <h2 className="display-title text-2xl sm:text-3xl font-bold text-[var(--sea-ink)] mb-8">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Add Items', desc: 'Create your master list of grocery items with categories and prices.' },
            { step: '2', title: 'Track Purchases', desc: 'Log what you bought and at what price each time you shop.' },
            { step: '3', title: 'See Trends', desc: 'View charts showing how your prices change over weeks and months.' },
          ].map((s) => (
            <div key={s.step} className="flex flex-col items-center">
              <div className="flex items-center justify-center size-10 rounded-full bg-gradient-to-br from-[var(--lagoon)] to-[var(--palm)] text-white font-bold text-sm mb-3 shadow-sm">
                {s.step}
              </div>
              <h4 className="font-semibold text-[var(--sea-ink)] mb-1">{s.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
