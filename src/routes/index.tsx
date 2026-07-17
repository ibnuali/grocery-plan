import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ClipboardList,
  Tag,
  TrendingUp,
  CalendarDays,
  Package,
  CircleDollarSign,
  ArrowRight,
} from 'lucide-react'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import { AppHeader } from '#/components/layout/app-header'
import { LoadingSpinner } from '#/components/layout/loading'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) return <LoadingSpinner />

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader session={session} activeRoute="/" />

      <main className="flex-1">
        {session?.user ? (
          <AuthenticatedView name={session.user.name} />
        ) : (
          <GuestView />
        )}
      </main>

      <footer className="site-footer mt-auto">
        <div className="page-wrap flex flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 py-6 text-sm text-muted-foreground">
          <span className="display-title font-semibold text-foreground">Grocery</span>
          <p>Plan smart, shop smart.</p>
          <p className="tabular">&copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  )
}

const quickActions = [
  { icon: ClipboardList, title: 'Shopping Lists', desc: 'Plan your next trip', href: '/lists' as const },
  { icon: Package, title: 'Item Catalog', desc: 'Manage your items', href: '/items' as const },
  { icon: Tag, title: 'Categories', desc: 'Organize by type', href: '/categories' as const },
]

function AuthenticatedView({ name }: { name: string }) {
  return (
    <div className="page-wrap px-4 sm:px-6 py-10 sm:py-16">
      <div className="rise-in mb-10 max-w-2xl">
        <h1 className="display-title text-3xl sm:text-4xl font-semibold text-foreground mb-2">
          Welcome back, {name}
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg">
          Ready to plan your next shopping trip?
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickActions.map((f, i) => (
          <Link
            key={f.title}
            to={f.href}
            className="rise-in tile group rounded-lg p-5 no-underline"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="icon-badge size-11 rounded-md mb-4">
              <f.icon className="size-5" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Open
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

const guestFeatures = [
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
] as const

function GuestView() {
  return (
    <div className="page-wrap px-4 sm:px-6">
      {/* Marquee hero — the statement carries the fold */}
      <section className="rise-in py-16 sm:py-24 max-w-4xl">
        <h1 className="display-title text-5xl sm:text-6xl lg:text-7xl font-semibold text-foreground leading-[1.02] wrap-anywhere">
          Plan your grocery shopping,{' '}
          <span className="text-primary">down to the price.</span>
        </h1>
        <p className="text-muted-foreground text-lg sm:text-xl max-w-xl mt-6 leading-relaxed">
          Record weekly and monthly purchases, track item prices over time, and
          always know what to buy and how much it costs.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8">
          <Button size="lg" asChild className="w-full sm:w-auto">
            <Link to="/signup">Start free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </section>

      <hr className="border-0 border-t border-border" />

      <section className="py-14 sm:py-20">
        <h2 className="display-title text-2xl sm:text-3xl font-semibold text-foreground mb-8 max-w-md">
          Everything you need to shop deliberately
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border border border-border rounded-lg overflow-hidden">
          {guestFeatures.map((f, i) => (
            <div
              key={f.title}
              className="rise-in bg-background p-6"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="icon-badge size-11 rounded-md mb-4">
                <f.icon className="size-5" />
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rise-in py-14 sm:py-20 border-t border-border">
        <h2 className="display-title text-2xl sm:text-3xl font-semibold text-foreground mb-10 max-w-md">
          How it works
        </h2>
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
          {[
            { step: '1', title: 'Add items', desc: 'Create your master list of grocery items with categories and prices.' },
            { step: '2', title: 'Track purchases', desc: 'Log what you bought and at what price each time you shop.' },
            { step: '3', title: 'See trends', desc: 'View how your prices change across weeks and months.' },
          ].map((s) => (
            <li key={s.step} className="flex flex-col">
              <span className="display-title tabular text-4xl font-semibold text-primary leading-none mb-3">
                {s.step}
              </span>
              <h4 className="font-semibold text-foreground mb-1">{s.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
