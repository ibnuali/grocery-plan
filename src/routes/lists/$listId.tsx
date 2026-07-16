import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { ShoppingBasket, Plus, Trash2, ShoppingCart, Check, DollarSign } from 'lucide-react'
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

export const Route = createFileRoute('/lists/$listId')({
  component: ListDetailPage,
})

interface ListItem {
  id: string
  itemId: string
  quantity: number
  itemName: string
  estimatedPrice: number
}

interface AvailableItem {
  id: string
  name: string
  estimatedPrice: number
}

interface ListInfo {
  id: string
  name: string
  period: string
  startDate: string
  endDate: string
}

function ListDetailPage() {
  const { listId } = Route.useParams()
  const { data: session, isPending } = authClient.useSession()
  const [listInfo, setListInfo] = useState<ListInfo | null>(null)
  const [listItems, setListItems] = useState<ListItem[]>([])
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [actualPrice, setActualPrice] = useState('')
  const [selectedListItem, setSelectedListItem] = useState<ListItem | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session?.user && listId) {
      Promise.all([fetchListInfo(), fetchListItems(), fetchAvailableItems()])
    }
  }, [session, listId])

  const fetchListInfo = async () => {
    try {
      const res = await fetch(`/api/lists/${listId}`)
      const data = await res.json()
      setListInfo(data)
    } catch (error) {
      console.error('Failed to fetch list:', error)
    }
  }

  const fetchListItems = async () => {
    try {
      const res = await fetch(`/api/lists/items?listId=${listId}`)
      const data = await res.json()
      setListItems(data.items || [])
    } catch (error) {
      console.error('Failed to fetch list items:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableItems = async () => {
    try {
      const res = await fetch('/api/items')
      const data = await res.json()
      setAvailableItems(data.items || [])
    } catch (error) {
      console.error('Failed to fetch items:', error)
    }
  }

  const handleAddItem = async () => {
    if (!selectedItemId) return
    setSaving(true)

    try {
      await fetch('/api/lists/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shoppingListId: listId,
          itemId: selectedItemId,
          quantity: parseInt(quantity) || 1,
        }),
      })
      await fetchListItems()
      setAddDialogOpen(false)
      setSelectedItemId('')
      setQuantity('1')
    } catch (error) {
      console.error('Failed to add item:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveItem = async (id: string) => {
    if (!confirm('Remove this item from the list?')) return

    try {
      await fetch('/api/lists/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      await fetchListItems()
    } catch (error) {
      console.error('Failed to remove item:', error)
    }
  }

  const handleRecordPurchase = async () => {
    if (!selectedListItem || !actualPrice) return
    setSaving(true)

    try {
      await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shoppingListItemId: selectedListItem.id,
          actualPrice: Math.round(parseFloat(actualPrice) * 100),
        }),
      })
      setPurchaseDialogOpen(false)
      setSelectedListItem(null)
      setActualPrice('')
      // Refresh items to show purchase status
      await fetchListItems()
    } catch (error) {
      console.error('Failed to record purchase:', error)
    } finally {
      setSaving(false)
    }
  }

  const openPurchaseDialog = (listItem: ListItem) => {
    setSelectedListItem(listItem)
    setActualPrice((listItem.estimatedPrice / 100).toFixed(2))
    setPurchaseDialogOpen(true)
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(cents)
  }

  const totalEstimated = listItems.reduce((sum, item) => sum + (item.estimatedPrice * item.quantity), 0)

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
        <p className="text-muted-foreground">Please sign in to view this list.</p>
      </div>
    )
  }

  if (!listInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">List not found.</p>
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
            <Link to="/items" className="nav-link text-sm font-medium">Items</Link>
            <Link to="/lists" className="nav-link is-active text-sm font-medium">Lists</Link>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <div className="page-wrap px-4 sm:px-6 py-8 sm:py-12">
          <div className="rise-in mb-8">
            <Link to="/lists" className="text-sm text-muted-foreground hover:text-[var(--sea-ink)] mb-2 inline-block">
              ← Back to Lists
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="display-title text-2xl sm:text-3xl font-bold text-[var(--sea-ink)] mb-1">{listInfo.name}</h1>
                <p className="text-muted-foreground capitalize">{listInfo.period} list</p>
              </div>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="size-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Item to List</DialogTitle>
                    <DialogDescription>Select an item and set the quantity.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="item-select">Item</Label>
                      <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                        <SelectTrigger className="w-full bg-white/60">
                          <SelectValue placeholder="Select an item" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableItems.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name} ({formatPrice(item.estimatedPrice)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="bg-white/60"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddItem} disabled={saving || !selectedItemId}>
                      {saving ? 'Adding...' : 'Add Item'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Summary */}
          <div className="rise-in feature-card rounded-2xl border border-border/60 p-5 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Estimated</p>
                <p className="text-2xl font-bold text-[var(--sea-ink)]">{formatPrice(totalEstimated)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Items</p>
                <p className="text-2xl font-bold text-[var(--sea-ink)]">{listItems.length}</p>
              </div>
            </div>
          </div>

          {/* List Items */}
          {listItems.length === 0 ? (
            <div className="rise-in text-center py-16 feature-card rounded-2xl border border-border/60">
              <ShoppingCart className="size-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--sea-ink)] mb-2">No items in this list</h3>
              <p className="text-muted-foreground mb-4">Add items from your catalog to start planning.</p>
              <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                <Plus className="size-4" />
                Add Item
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {listItems.map((listItem, i) => (
                <div
                  key={listItem.id}
                  className="rise-in feature-card rounded-2xl border border-border/60 p-4 flex items-center justify-between"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-[var(--sand)] to-[var(--foam)] text-[var(--palm)] shadow-sm">
                      <ShoppingCart className="size-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--sea-ink)]">{listItem.itemName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Qty: {listItem.quantity} × {formatPrice(listItem.estimatedPrice)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[var(--sea-ink)] mr-2">
                      {formatPrice(listItem.estimatedPrice * listItem.quantity)}
                    </p>
                    <Button
                     
                      size="sm"
                      onClick={() => openPurchaseDialog(listItem)}
                    >
                      <DollarSign className="size-4" />
                      Record
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleRemoveItem(listItem.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Purchase</DialogTitle>
            <DialogDescription>
              Enter the actual price you paid for {selectedListItem?.itemName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-xl bg-muted/50">
              <p className="text-sm text-muted-foreground">Estimated Price</p>
              <p className="text-lg font-semibold text-[var(--sea-ink)]">
                {selectedListItem ? formatPrice(selectedListItem.estimatedPrice) : '-'}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="actual-price">Actual Price (IDR)</Label>
              <Input
                id="actual-price"
                type="number"
                value={actualPrice}
                onChange={(e) => setActualPrice(e.target.value)}
                placeholder="Enter actual price"
                className="bg-white/60"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPurchase} disabled={saving || !actualPrice}>
              {saving ? 'Saving...' : 'Save Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
