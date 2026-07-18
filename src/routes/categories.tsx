import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { authClient } from '#/lib/auth-client'
import { Button, buttonVariants } from '#/components/ui/button'
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
import { cn } from '#/lib/utils'
import { AppHeader } from '#/components/layout/app-header'
import { LoadingSpinner } from '#/components/layout/loading'
import { apiGet, apiPost, apiPut, apiDelete } from '#/lib/api'

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
  const [error, setError] = useState('')

  useEffect(() => {
    if (session?.user) {
      fetchCategories()
    }
  }, [session])

  const fetchCategories = async () => {
    try {
      const data = await apiGet<{ categories: Category[] }>('/api/categories')
      setCategories(data.categories)
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!categoryName.trim()) return
    setSaving(true)
    setError('')

    try {
      if (editingCategory) {
        await apiPut(`/api/categories/${editingCategory.id}`, {
          name: categoryName.trim(),
        })
      } else {
        await apiPost('/api/categories', { name: categoryName.trim() })
      }
      await fetchCategories()
      setDialogOpen(false)
      setEditingCategory(null)
      setCategoryName('')
    } catch (err: any) {
      setError(err.message || 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      await apiDelete(`/api/categories/${id}`)
      await fetchCategories()
    } catch (err) {
      console.error('Failed to delete category:', err)
    }
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setCategoryName(category.name)
    setError('')
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingCategory(null)
    setCategoryName('')
    setError('')
    setDialogOpen(true)
  }

  if (isPending || loading) return <LoadingSpinner />

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          Please sign in to manage categories.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader session={session} activeRoute="/categories" />

      <main className="flex-1">
        <div className="page-wrap px-4 sm:px-6 py-8 sm:py-12">
          <div className="rise-in flex items-center justify-between mb-8">
            <div>
              <h1 className="display-title text-2xl sm:text-3xl font-semibold text-foreground mb-1">
                Categories
              </h1>
              <p className="text-muted-foreground">
                Organize your items into categories
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                className={cn(buttonVariants({ size: 'sm' }))}
                onClick={openCreateDialog}
              >
                <Plus className="size-4" />
                Add Category
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? 'Edit Category' : 'New Category'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingCategory
                      ? 'Update the category name.'
                      : 'Create a new category to organize your items.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {error && (
                    <div className="p-3 rounded-md border border-destructive/40 bg-destructive/10 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="category-name">Name</Label>
                    <Input
                      id="category-name"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      placeholder="e.g., Fruits, Dairy, Bakery"
                      className="bg-background"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !categoryName.trim()}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {categories.length === 0 ? (
            <div className="rise-in text-center py-16 surface rounded-lg">
              <Tag className="size-10 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No categories yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Create your first category to start organizing items.
              </p>
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
                  className="rise-in tile rounded-lg p-5"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="icon-badge size-10 rounded-md">
                        <Tag className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {cat.name}
                        </h3>
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
