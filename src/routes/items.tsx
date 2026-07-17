import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, Package } from 'lucide-react'
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
import { AppHeader } from '#/components/layout/app-header'
import { LoadingSpinner } from '#/components/layout/loading'
import { formatPrice } from '#/lib/format'
import { apiGet, apiPost, apiPut, apiDelete } from '#/lib/api'

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
  const [error, setError] = useState('')

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  )

  useEffect(() => {
    if (session?.user) {
      Promise.all([fetchItems(), fetchCategories()])
    }
  }, [session])

  const fetchItems = async () => {
    try {
      const data = await apiGet<{ items: Item[] }>('/api/items')
      setItems(data.items || [])
    } catch (err) {
      console.error('Failed to fetch items:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await apiGet<{ categories: Category[] }>('/api/categories')
      setCategories(data.categories || [])
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const handleSave = async () => {
    if (!itemName.trim() || !itemCategoryId || !itemPrice) return
    setSaving(true)
    setError('')

    try {
      const payload = {
        name: itemName.trim(),
        categoryId: itemCategoryId,
        estimatedPrice: Math.round(parseFloat(itemPrice) * 100),
      }

      if (editingItem) {
        await apiPut(`/api/items/${editingItem.id}`, payload)
      } else {
        await apiPost('/api/items', payload)
      }
      await fetchItems()
      setDialogOpen(false)
      setEditingItem(null)
      setItemName('')
      setItemCategoryId('')
      setItemPrice('')
    } catch (err: any) {
      setError(err.message || 'Failed to save item')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      await apiDelete(`/api/items/${id}`)
      await fetchItems()
    } catch (err) {
      console.error('Failed to delete item:', err)
    }
  }

  const openEditDialog = (item: Item) => {
    setEditingItem(item)
    setItemName(item.name)
    setItemCategoryId(item.categoryId)
    setItemPrice((item.estimatedPrice / 100).toFixed(2))
    setError('')
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingItem(null)
    setItemName('')
    setItemCategoryId('')
    setItemPrice('')
    setError('')
    setDialogOpen(true)
  }

  if (isPending || loading) return <LoadingSpinner />

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Please sign in to manage items.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader session={session} activeRoute="/items" />

      <main className="flex-1">
        <div className="page-wrap px-4 sm:px-6 py-8 sm:py-12">
          <div className="rise-in flex items-center justify-between mb-8">
            <div>
              <h1 className="display-title text-2xl sm:text-3xl font-semibold text-foreground mb-1">Items</h1>
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
                  {error && (
                    <div className="p-3 rounded-md border border-destructive/40 bg-destructive/10 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="item-name">Name</Label>
                    <Input
                      id="item-name"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="e.g., Rice, Milk, Eggs"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-category">Category</Label>
                    <Select value={itemCategoryId} onValueChange={setItemCategoryId}>
                      <SelectTrigger className="w-full bg-background">
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
                      className="bg-background"
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
            <div className="rise-in text-center py-16 surface rounded-lg">
              <Package className="size-10 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No items yet</h3>
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
                  className="rise-in tile rounded-lg p-5"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="icon-badge size-10 rounded-md">
                        <Package className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                        <p className="text-xs text-muted-foreground">{categoryMap[item.categoryId] || 'Unknown'}</p>
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
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">Estimated price</p>
                    <p className="tabular text-lg font-semibold text-foreground">{formatPrice(item.estimatedPrice)}</p>
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
