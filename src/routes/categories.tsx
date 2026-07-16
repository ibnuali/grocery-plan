import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { ShoppingBasket, Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'

export const Route = createFileRoute('/categories')({
  component: CategoriesPage,
})

interface Category {
  id: string
  name: string
  createdAt: string
}

function CategoriesPage() {
  const { data: session, isPending } = authClient.useSession()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchCategories()
    }
  }, [session])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!categoryName.trim()) return
    setSaving(true)

    try {
      if (editingCategory) {
        await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: categoryName.trim() }),
        })
      } else {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: categoryName.trim() }),
        })
      }
      await fetchCategories()
      setDialogOpen(false)
      setEditingCategory(null)
      setCategoryName('')
    } catch (error) {
      console.error('Failed to save category:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      await fetchCategories()
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setCategoryName(category.name)
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingCategory(null)
    setCategoryName('')
    setDialogOpen(true)
  }

  if (isPending || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-5 w-5 border-2 border-neutral-300 dark:border-neutral-600 border-t-transparent dark:border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Please sign in to manage categories.</p>
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
          <nav className="flex items-center gap-4">
            <Link to="/" className="nav-link text-sm font-medium">Home</Link>
            <Link to="/categories" className="nav-link is-active text-sm font-medium">Categories</Link>
            <Link to="/items" className="nav-link text-sm font-medium">Items</Link>
            <Link to="/lists" className="nav-link text-sm font-medium">Lists</Link>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <div className="page-wrap px-4 sm:px-6 py-8 sm:py-12">
          <div className="rise-in flex items-center justify-between mb-8">
            <div>
              <h1 className="display-title text-2xl sm:text-3xl font-bold text-[var(--sea-ink)] mb-1">Categories</h1>
              <p className="text-muted-foreground">Organize your items into categories</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={openCreateDialog}>
                  <Plus className="size-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
                  <DialogDescription>
                    {editingCategory ? 'Update the category name.' : 'Create a new category to organize your items.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="category-name">Name</Label>
                    <Input
                      id="category-name"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      placeholder="e.g., Fruits, Dairy, Bakery"
                      className="bg-white/60"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving || !categoryName.trim()}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {categories.length === 0 ? (
            <div className="rise-in text-center py-16 feature-card rounded-2xl border border-border/60">
              <Tag className="size-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--sea-ink)] mb-2">No categories yet</h3>
              <p className="text-muted-foreground mb-4">Create your first category to start organizing items.</p>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="size-4" />
                Add Category
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat, i) => (
                <div
                  key={cat.id}
                  className="rise-in feature-card rounded-2xl border border-border/60 p-5"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-[var(--sand)] to-[var(--foam)] text-[var(--palm)] shadow-sm">
                        <Tag className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--sea-ink)]">{cat.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(cat.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => openEditDialog(cat)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDelete(cat.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
