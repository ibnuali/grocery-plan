import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { ShoppingBasket, Plus, Pencil, Trash2, Package } from 'lucide-react'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'

export const Route = createFileRoute('/items')({
  component: ItemsPage,
})

interface Category {
  id: string
  name: string
}

interface Item {
  id: string
  name: string
  categoryId: string
  estimatedPrice: number
  createdAt: string
  categoryName?: string
}

function ItemsPage() {
  const { data: session, isPending } = authClient.useSession()
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [itemName, setItemName] = useState('')
  const [itemCategoryId, setItemCategoryId] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session?.user) {
      Promise.all([fetchItems(), fetchCategories()])
    }
  }, [session])

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/items')
      const data = await res.json()
      setItems(data.items || [])
    } catch (error) {
      console.error('Failed to fetch items:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleSave = async () => {
    if (!itemName.trim() || !itemCategoryId || !itemPrice) return
    setSaving(true)

    try {
      const payload = {
        name: itemName.trim(),
        categoryId: itemCategoryId,
        estimatedPrice: Math.round(parseFloat(itemPrice) * 100), // Convert to cents
      }

      if (editingItem) {
        await fetch(`/api/items/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      await fetchItems()
      setDialogOpen(false)
      setEditingItem(null)
      setItemName('')
      setItemCategoryId('')
      setItemPrice('')
    } catch (error) {
      console.error('Failed to save item:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await fetch(`/api/items/${id}`, { method: 'DELETE' })
      await fetchItems()
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  const openEditDialog = (item: Item) => {
    setEditingItem(item)
    setItemName(item.name)
    setItemCategoryId(item.categoryId)
    setItemPrice((item.estimatedPrice / 100).toFixed(2))
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingItem(null)
    setItemName('')
    setItemCategoryId('')
    setItemPrice('')
    setDialogOpen(true)
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(cents)
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Unknown'
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
        <p className="text-muted-foreground">Please sign in to manage items.</p>
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
            <Link to="/categories" className="nav-link text-sm font-medium">Categories</Link>
            <Link to="/items" className="nav-link is-active text-sm font-medium">Items</Link>
            <Link to="/lists" className="nav-link text-sm font-medium">Lists</Link>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <div className="page-wrap px-4 sm:px-6 py-8 sm:py-12">
          <div className="rise-in flex items-center justify-between mb-8">
            <div>
              <h1 className="display-title text-2xl sm:text-3xl font-bold text-[var(--sea-ink)] mb-1">Items</h1>
              <p className="text-muted-foreground">Manage your grocery item catalog</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={openCreateDialog}>
                  <Plus className="size-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Edit Item' : 'New Item'}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? 'Update the item details.' : 'Add a new item to your catalog.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="item-name">Name</Label>
                    <Input
                      id="item-name"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="e.g., Rice, Milk, Eggs"
                      className="bg-white/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-category">Category</Label>
                    <Select value={itemCategoryId} onValueChange={setItemCategoryId}>
                      <SelectTrigger className="w-full bg-white/60">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-price">Estimated Price (IDR)</Label>
                    <Input
                      id="item-price"
                      type="number"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(e.target.value)}
                      placeholder="e.g., 15000"
                      className="bg-white/60"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving || !itemName.trim() || !itemCategoryId || !itemPrice}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {items.length === 0 ? (
            <div className="rise-in text-center py-16 feature-card rounded-2xl border border-border/60">
              <Package className="size-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--sea-ink)] mb-2">No items yet</h3>
              <p className="text-muted-foreground mb-4">Add your first grocery item to start tracking prices.</p>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="size-4" />
                Add Item
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item, i) => (
                <div
                  key={item.id}
                  className="rise-in feature-card rounded-2xl border border-border/60 p-5"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-[var(--lagoon)]/20 to-[var(--palm)]/20 text-[var(--palm)] shadow-sm">
                        <Package className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--sea-ink)]">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">{getCategoryName(item.categoryId)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDelete(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <p className="text-sm text-muted-foreground">Estimated Price</p>
                    <p className="text-lg font-semibold text-[var(--sea-ink)]">{formatPrice(item.estimatedPrice)}</p>
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
