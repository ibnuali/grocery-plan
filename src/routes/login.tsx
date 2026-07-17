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
      <div className="hidden lg:flex lg:w-1/2 relative bg-foreground text-background p-12 flex-col justify-between">
        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center justify-center size-9 rounded-md border border-primary/40 bg-primary/15 text-primary">
            <ShoppingBasket className="size-5" />
          </div>
          <span className="display-title text-xl font-semibold">Grocery</span>
        </div>
        <div className="max-w-md">
          <h1 className="display-title text-4xl font-semibold leading-tight mb-4">
            Plan your shopping,{' '}
            <span className="text-primary">track every price.</span>
          </h1>
          <p className="text-background/60 text-lg leading-relaxed">
            Never overpay again. Your lists and price history, waiting for you.
          </p>
        </div>
        <div className="h-px w-16 bg-primary" />
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="icon-badge size-10 rounded-md">
              <ShoppingBasket className="size-5" />
            </div>
            <span className="display-title text-2xl font-semibold text-foreground">Grocery</span>
          </div>

          <div className="rise-in">
            <h2 className="display-title text-2xl font-semibold text-foreground mb-1">Welcome back</h2>
            <p className="text-muted-foreground mb-8">Sign in to access your shopping lists and price history</p>

            {error && (
              <div className="mb-6 p-3 rounded-md border border-destructive/40 bg-destructive/10 text-sm text-destructive text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-foreground">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="pl-10 h-11 bg-background border-border"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
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
                    className="pl-10 h-11 bg-background border-border"
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
              <Link to="/signup" className="font-semibold text-primary">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
