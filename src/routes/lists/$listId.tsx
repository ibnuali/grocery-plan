import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Plus, Trash2, ShoppingCart, DollarSign } from 'lucide-react'
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
import { apiGet, apiPost, apiDelete } from '#/lib/api'

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
  const [error, setError] = useState('')

  useEffect(() => {
    if (session?.user && listId) {
      Promise.all([fetchListInfo(), fetchListItems(), fetchAvailableItems()])
    }
  }, [session, listId])

  const fetchListInfo = async () => {
    try {
      const data = await apiGet<ListInfo>(`/api/lists/${listId}`)
      setListInfo(data)
    } catch (err) {
      console.error('Failed to fetch list:', err)
    }
  }

  const fetchListItems = async () => {
    try {
      const data = await apiGet<{ items: ListItem[] }>(`/api/lists/items?listId=${listId}`)
      setListItems(data.items || [])
    } catch (err) {
      console.error('Failed to fetch list items:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableItems = async () => {
    try {
      const data = await apiGet<{ items: AvailableItem[] }>('/api/items')
      setAvailableItems(data.items || [])
    } catch (err) {
      console.error('Failed to fetch items:', err)
    }
  }

  const handleAddItem = async () => {
    if (!selectedItemId) return
    setSaving(true)
    setError('')

    try {
      await apiPost('/api/lists/items', {
        shoppingListId: listId,
        itemId: selectedItemId,
        quantity: parseInt(quantity) || 1,
      })
      await fetchListItems()
      setAddDialogOpen(false)
      setSelectedItemId('')
      setQuantity('1')
    } catch (err: any) {
      setError(err.message || 'Failed to add item')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveItem = async (id: string) => {
    if (!confirm('Remove this item from the list?')) return

    try {
      await apiDelete('/api/lists/items', { id })
      await fetchListItems()
    } catch (err) {
      console.error('Failed to remove item:', err)
    }
  }

  const handleRecordPurchase = async () => {
    if (!selectedListItem || !actualPrice) return
    setSaving(true)
    setError('')

    try {
      await apiPost('/api/purchases', {
        shoppingListItemId: selectedListItem.id,
        actualPrice: Math.round(parseFloat(actualPrice) * 100),
      })
      setPurchaseDialogOpen(false)
      setSelectedListItem(null)
      setActualPrice('')
      await fetchListItems()
    } catch (err: any) {
      setError(err.message || 'Failed to record purchase')
    } finally {
      setSaving(false)
    }
  }

  const openPurchaseDialog = (listItem: ListItem) => {
    setSelectedListItem(listItem)
    setActualPrice((listItem.estimatedPrice / 100).toFixed(2))
    setError('')
    setPurchaseDialogOpen(true)
  }

  const totalEstimated = listItems.reduce((sum, item) => sum + (item.estimatedPrice * item.quantity), 0)

  if (isPending || loading) return <LoadingSpinner />

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
      <AppHeader session={session} activeRoute="/lists" />

      <main className="flex-1">
        <div className="page-wrap px-4 sm:px-6 py-8 sm:py-12">
          <div className="rise-in mb-8">
            <Link to="/lists" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block no-underline">
              ← Back to Lists
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="display-title text-2xl sm:text-3xl font-semibold text-foreground mb-1">{listInfo.name}</h1>
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
                    {error && (
                      <div className="p-3 rounded-md border border-destructive/40 bg-destructive/10 text-sm text-destructive">
                        {error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="item-select">Item</Label>
                      <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                        <SelectTrigger className="w-full bg-background">
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
                        className="bg-background"
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
          <div className="rise-in surface-2 rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total estimated</p>
                <p className="tabular display-title text-2xl font-semibold text-foreground">{formatPrice(totalEstimated)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Items</p>
                <p className="tabular display-title text-2xl font-semibold text-foreground">{listItems.length}</p>
              </div>
            </div>
          </div>

          {/* List Items */}
          {listItems.length === 0 ? (
            <div className="rise-in text-center py-16 surface rounded-lg">
              <ShoppingCart className="size-10 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No items in this list</h3>
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
                  className="rise-in tile rounded-lg p-4 flex items-center justify-between gap-3"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="icon-badge size-10 rounded-md shrink-0">
                      <ShoppingCart className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{listItem.itemName}</h3>
                      <p className="tabular text-sm text-muted-foreground">
                        Qty {listItem.quantity} × {formatPrice(listItem.estimatedPrice)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="tabular font-semibold text-foreground mr-2 hidden sm:block">
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
            {error && (
              <div className="p-3 rounded-md border border-destructive/40 bg-destructive/10 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="p-4 rounded-md surface-2">
              <p className="text-sm text-muted-foreground">Estimated price</p>
              <p className="tabular text-lg font-semibold text-foreground">
                {selectedListItem ? formatPrice(selectedListItem.estimatedPrice) : '—'}
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
                className="bg-background"
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
