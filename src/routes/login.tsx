import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ShoppingBasket, User, Lock, ArrowRight } from 'lucide-react'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await authClient.signIn.username({
      username,
      password,
      callbackURL: '/',
    })

    setLoading(false)

    if (error) {
      setError(error.message || 'Login failed')
    } else {
      navigate({ to: '/' })
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[var(--sea-ink)] via-[#1a4550] to-[var(--palm)] items-center justify-center p-12">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 size-64 rounded-full bg-[var(--lagoon)]/30 blur-3xl" />
          <div className="absolute bottom-20 right-20 size-48 rounded-full bg-[var(--palm)]/40 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 size-32 rounded-full bg-[var(--lagoon)]/20 blur-2xl" />
        </div>
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center size-20 rounded-2xl bg-white/10 backdrop-blur-sm mb-6 shadow-lg">
            <ShoppingBasket className="size-10 text-white" />
          </div>
          <h1 className="display-title text-4xl font-bold text-white mb-3">Grocery</h1>
          <p className="text-white/70 text-lg max-w-xs mx-auto leading-relaxed">
            Plan your shopping, track your prices, never overpay again.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-[var(--lagoon)] to-[var(--palm)] text-white shadow-sm">
              <ShoppingBasket className="size-5" />
            </div>
            <span className="display-title text-2xl font-bold text-[var(--sea-ink)]">Grocery</span>
          </div>

          <div className="rise-in">
            <h2 className="text-2xl font-bold text-[var(--sea-ink)] mb-1">Welcome back</h2>
            <p className="text-muted-foreground mb-8">Sign in to access your shopping lists and price history</p>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-[var(--sea-ink)]">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="pl-10 h-11 bg-white/60 border-border/60 focus:border-[var(--lagoon)] focus:ring-[var(--lagoon)]/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-[var(--sea-ink)]">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 h-11 bg-white/60 border-border/60 focus:border-[var(--lagoon)] focus:ring-[var(--lagoon)]/20"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="default"
                className="w-full h-11 shadow-md hover:shadow-lg transition-all"
                disabled={loading}
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-8 text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-[var(--lagoon-deep)] hover:text-[var(--palm)] transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
