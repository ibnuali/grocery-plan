import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Pencil,
  Trash2,
  ShoppingCart,
  DollarSign,
  Zap,
  TrendingDown,
  TrendingUp,
  Minus,
  CornerDownLeft,
} from 'lucide-react'
import { authClient } from '#/lib/auth-client'
import { Button, buttonVariants } from '#/components/ui/button'
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
import { cn } from '#/lib/utils'
import { AppHeader } from '#/components/layout/app-header'
import { LoadingSpinner } from '#/components/layout/loading'
import { formatPrice } from '#/lib/format'
import { apiGet, apiPost, apiPut, apiDelete, errMessage } from '#/lib/api'
import { renderSelectLabel } from '#/lib/select-label'
import { Textarea } from '#/components/ui/textarea'
import { Switch } from '#/components/ui/switch'
import { toast } from '#/lib/toast'

export const Route = createFileRoute('/lists/$listId')({
  component: ListDetailPage,
})

interface ListItem {
  id: string
  itemId: string
  quantity: number
  unit: string | null
  notes: string | null
  purchased: boolean
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

interface Purchase {
  id: string
  actualPrice: number
  purchasedAt: string
  quantity: number
  itemName: string
  estimatedPrice: number
  listName: string
  shoppingListItemId: string
}

function ListDetailPage() {
  const { listId } = Route.useParams()
  const { data: session, isPending } = authClient.useSession()
  const queryClient = useQueryClient()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingListItem, setEditingListItem] = useState<ListItem | null>(null)
  const [editQuantity, setEditQuantity] = useState('1')
  const [editUnit, setEditUnit] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [selectedItemId, setSelectedItemId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [actualPrice, setActualPrice] = useState('')
  const [selectedListItem, setSelectedListItem] = useState<ListItem | null>(
    null,
  )
  const [error, setError] = useState('')
  const [quickName, setQuickName] = useState('')
  const [quickQuantity, setQuickQuantity] = useState('1')

  const {
    data: listInfo,
    isLoading: listLoading,
    error: listError,
  } = useQuery({
    queryKey: ['list', listId],
    queryFn: () => apiGet<ListInfo>(`/api/lists/${listId}`),
    enabled: !!session?.user && !!listId,
  })

  const {
    data: listItemsData,
    isLoading: itemsLoading,
    error: listItemsError,
  } = useQuery({
    queryKey: ['listItems', listId],
    queryFn: () =>
      apiGet<{ items: ListItem[] }>(`/api/lists/items?listId=${listId}`),
    enabled: !!session?.user && !!listId,
  })
  const listItems = listItemsData?.items ?? []

  const { data: availableItemsData } = useQuery({
    queryKey: ['items'],
    queryFn: () => apiGet<{ items: AvailableItem[] }>('/api/items'),
    enabled: !!session?.user,
  })
  const availableItems = availableItemsData?.items ?? []

  useEffect(() => {
    if (listError) toast('Failed to load list', 'destructive')
  }, [listError])

  useEffect(() => {
    if (listItemsError) toast('Failed to load list items', 'destructive')
  }, [listItemsError])

  const { data: purchasesData } = useQuery({
    queryKey: ['purchases', listId],
    queryFn: () =>
      apiGet<{ purchases: Purchase[] }>(`/api/purchases?listId=${listId}`),
    enabled: !!session?.user && !!listId,
  })
  const purchases = purchasesData?.purchases ?? []

  const addItemMutation = useMutation({
    mutationFn: () =>
      apiPost('/api/lists/items', {
        shoppingListId: listId,
        itemId: selectedItemId,
        quantity: parseInt(quantity, 10) || 1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listItems', listId] })
      setAddDialogOpen(false)
      setSelectedItemId('')
      setQuantity('1')
      setError('')
    },
    onError: (err) => setError(errMessage(err, 'Failed to add item')),
  })

  const quickAddMutation = useMutation({
    mutationFn: () =>
      apiPost('/api/lists/items/add', {
        shoppingListId: listId,
        name: quickName.trim(),
        quantity: parseInt(quickQuantity, 10) || 1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listItems', listId] })
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      setQuickName('')
      setQuickQuantity('1')
    },
    onError: (err) =>
      toast(errMessage(err, 'Failed to add item'), 'destructive'),
  })

  const removeItemMutation = useMutation({
    mutationFn: (id: string) => apiDelete('/api/lists/items', { id }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['listItems', listId] }),
  })

  const editItemMutation = useMutation({
    mutationFn: () =>
      apiPut('/api/lists/items', {
        id: editingListItem!.id,
        quantity: parseInt(editQuantity, 10) || 1,
        unit: editUnit.trim() || null,
        notes: editNotes.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listItems', listId] })
      setEditDialogOpen(false)
      setEditingListItem(null)
      setError('')
    },
    onError: (err) => setError(errMessage(err, 'Failed to update item')),
  })

  const togglePurchasedMutation = useMutation({
    mutationFn: (listItem: ListItem) =>
      apiPut('/api/lists/items', {
        id: listItem.id,
        purchased: !listItem.purchased,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['listItems', listId] }),
    onError: (err) => toast(errMessage(err, 'Failed to update'), 'destructive'),
  })

  const purchaseMutation = useMutation({
    mutationFn: () =>
      apiPost('/api/purchases', {
        shoppingListItemId: selectedListItem!.id,
        actualPrice: Math.round(parseFloat(actualPrice) * 100),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listItems', listId] })
      queryClient.invalidateQueries({ queryKey: ['purchases', listId] })
      setPurchaseDialogOpen(false)
      setSelectedListItem(null)
      setActualPrice('')
      setError('')
    },
    onError: (err) => setError(errMessage(err, 'Failed to record purchase')),
  })

  const quickRecordMutation = useMutation({
    mutationFn: (listItem: ListItem) =>
      apiPost('/api/purchases', {
        shoppingListItemId: listItem.id,
        actualPrice: listItem.estimatedPrice,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listItems', listId] })
      toast('Purchase recorded')
    },
    onError: (err) =>
      toast(errMessage(err, 'Failed to record purchase'), 'destructive'),
  })

  const handleAddItem = () => {
    if (!selectedItemId) return
    setError('')
    addItemMutation.mutate()
  }

  const handleQuickAdd = () => {
    if (!quickName.trim()) return
    quickAddMutation.mutate()
  }

  const handleQuickAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && quickName.trim()) {
      e.preventDefault()
      handleQuickAdd()
    }
  }

  const handleRemoveItem = (id: string) => {
    if (!confirm('Remove this item from the list?')) return
    removeItemMutation.mutate(id)
  }

  const handleRecordPurchase = () => {
    if (!selectedListItem || !actualPrice) return
    setError('')
    purchaseMutation.mutate()
  }

  const openPurchaseDialog = (listItem: ListItem) => {
    setSelectedListItem(listItem)
    setActualPrice((listItem.estimatedPrice / 100).toFixed(2))
    setError('')
    setPurchaseDialogOpen(true)
  }

  const openEditDialog = (listItem: ListItem) => {
    setEditingListItem(listItem)
    setEditQuantity(String(listItem.quantity))
    setEditUnit(listItem.unit ?? '')
    setEditNotes(listItem.notes ?? '')
    setError('')
    setEditDialogOpen(true)
  }

  const handleEditSave = () => {
    setError('')
    editItemMutation.mutate()
  }

  const totalEstimated = listItems.reduce(
    (sum, item) => sum + item.estimatedPrice * item.quantity,
    0,
  )

  if (isPending || listLoading || itemsLoading) return <LoadingSpinner />

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          Please sign in to view this list.
        </p>
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
            <Link
              to="/lists"
              className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block no-underline"
            >
              ← Back to Lists
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="display-title text-2xl sm:text-3xl font-semibold text-foreground mb-1">
                  {listInfo.name}
                </h1>
                <p className="text-muted-foreground capitalize">
                  {listInfo.period} list
                </p>
              </div>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger className={cn(buttonVariants({ size: 'sm' }))}>
                  <Plus className="size-4" />
                  Add Item
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Item to List</DialogTitle>
                    <DialogDescription>
                      Select an item and set the quantity.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {error && (
                      <div className="p-3 rounded-md border border-destructive/40 bg-destructive/10 text-sm text-destructive">
                        {error}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="item-select">Item</Label>
                      <Select
                        value={selectedItemId}
                        onValueChange={(v) => setSelectedItemId(v ?? '')}
                      >
                        <SelectTrigger className="w-full bg-background">
                          <SelectValue>
                            {renderSelectLabel(
                              availableItems,
                              'Select an item',
                              (item) =>
                                `${item.name} (${formatPrice(item.estimatedPrice)})`,
                            )}
                          </SelectValue>
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
                    <Button
                      variant="outline"
                      onClick={() => setAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddItem}
                      disabled={addItemMutation.isPending || !selectedItemId}
                    >
                      {addItemMutation.isPending ? 'Adding...' : 'Add Item'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Quick Add */}
          <div className="rise-in surface-2 rounded-lg p-4 mb-6">
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label
                  htmlFor="quick-name"
                  className="text-xs text-muted-foreground"
                >
                  Add a product
                </Label>
                <Input
                  id="quick-name"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  onKeyDown={handleQuickAddKeyDown}
                  placeholder="Type a product name, e.g. Rice, Milk, Eggs"
                  className="bg-background"
                />
              </div>
              <div className="w-24 space-y-1.5">
                <Label
                  htmlFor="quick-qty"
                  className="text-xs text-muted-foreground"
                >
                  Qty
                </Label>
                <Input
                  id="quick-qty"
                  type="number"
                  min="1"
                  value={quickQuantity}
                  onChange={(e) => setQuickQuantity(e.target.value)}
                  onKeyDown={handleQuickAddKeyDown}
                  className="bg-background"
                />
              </div>
              <Button
                onClick={handleQuickAdd}
                disabled={quickAddMutation.isPending || !quickName.trim()}
                className="shrink-0"
              >
                {quickAddMutation.isPending ? (
                  'Adding…'
                ) : (
                  <>
                    <CornerDownLeft className="size-4" />
                    Add
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter or click Add. For catalog items with price tracking,
              use the catalog dialog.
            </p>
          </div>

          {/* Summary */}
          <div className="rise-in surface-2 rounded-lg p-5 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total estimated</p>
                <p className="tabular display-title text-2xl font-semibold text-foreground">
                  {formatPrice(totalEstimated)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Items</p>
                <p className="tabular display-title text-2xl font-semibold text-foreground">
                  {listItems.length}
                  {listItems.some((i) => i.purchased) && (
                    <span className="text-base text-muted-foreground">
                      {' '}
                      ({listItems.filter((i) => i.purchased).length} bought)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* List Items */}
          {listItems.length === 0 ? (
            <div className="rise-in text-center py-16 surface rounded-lg">
              <ShoppingCart className="size-10 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No items in this list
              </h3>
              <p className="text-muted-foreground mb-4">
                Add items from your catalog to start planning.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                  <Plus className="size-4" />
                  Add Item
                </Button>
                <Link
                  to="/items"
                  className={cn(
                    buttonVariants({ size: 'sm', variant: 'outline' }),
                  )}
                >
                  Browse Catalog
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {listItems.map((listItem, i) => (
                <div
                  key={listItem.id}
                  className={cn(
                    'rise-in tile rounded-lg p-4 flex items-center justify-between gap-3 transition-opacity',
                    listItem.purchased && 'opacity-50',
                  )}
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Switch
                      size="default"
                      checked={listItem.purchased}
                      onCheckedChange={() =>
                        togglePurchasedMutation.mutate(listItem)
                      }
                      disabled={togglePurchasedMutation.isPending}
                      aria-label={`Mark ${listItem.itemName} as purchased`}
                    />
                    <div className="min-w-0">
                      <h3
                        className={cn(
                          'font-semibold text-foreground truncate',
                          listItem.purchased &&
                            'line-through text-muted-foreground',
                        )}
                      >
                        {listItem.itemName}
                      </h3>
                      <p className="tabular text-sm text-muted-foreground">
                        Qty {listItem.quantity}
                        {listItem.unit ? ` ${listItem.unit}` : ''}
                        {listItem.estimatedPrice > 0 && (
                          <> × {formatPrice(listItem.estimatedPrice)}</>
                        )}
                      </p>
                      {listItem.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {listItem.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p
                      className={cn(
                        'tabular font-semibold text-foreground mr-2 hidden sm:block',
                        listItem.purchased &&
                          'line-through text-muted-foreground',
                      )}
                    >
                      {formatPrice(listItem.estimatedPrice * listItem.quantity)}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => quickRecordMutation.mutate(listItem)}
                      disabled={quickRecordMutation.isPending}
                      title="Record at estimated price"
                    >
                      <Zap className="size-4" />
                      Quick
                    </Button>
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
                      onClick={() => openEditDialog(listItem)}
                    >
                      <Pencil className="size-3.5" />
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

          {/* Price Comparison */}
          {purchases.length > 0 && (
            <div className="rise-in mt-8">
              <h2 className="display-title text-lg font-semibold text-foreground mb-4">
                Purchase History
              </h2>
              <div className="space-y-3">
                {purchases.map((p, i) => {
                  const diff = p.actualPrice - p.estimatedPrice
                  const diffAbs = Math.abs(diff)
                  const isExact = diff === 0
                  const isCheaper = diff < 0

                  return (
                    <div
                      key={p.id}
                      className="rise-in tile rounded-lg p-4 flex items-center justify-between gap-3"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="icon-badge size-10 rounded-md shrink-0">
                          {isExact ? (
                            <Minus className="size-5" />
                          ) : isCheaper ? (
                            <TrendingDown className="size-5" />
                          ) : (
                            <TrendingUp className="size-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {p.itemName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Qty {p.quantity} &middot;{' '}
                            {new Date(p.purchasedAt).toLocaleDateString(
                              'id-ID',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              },
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="tabular font-semibold text-foreground">
                          {formatPrice(p.actualPrice)}
                        </p>
                        <p className="tabular text-xs text-muted-foreground">
                          Est. {formatPrice(p.estimatedPrice)}
                        </p>
                        <p
                          className={`tabular text-xs font-medium ${
                            isExact
                              ? 'text-muted-foreground'
                              : isCheaper
                                ? 'text-green-600'
                                : 'text-destructive'
                          }`}
                        >
                          {isExact
                            ? 'On budget'
                            : isCheaper
                              ? `${formatPrice(diffAbs)} under`
                              : `${formatPrice(diffAbs)} over`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
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
                {selectedListItem
                  ? formatPrice(selectedListItem.estimatedPrice)
                  : '—'}
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
            <Button
              variant="outline"
              onClick={() => setPurchaseDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRecordPurchase}
              disabled={purchaseMutation.isPending || !actualPrice}
            >
              {purchaseMutation.isPending ? 'Saving...' : 'Save Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit List Item Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Adjust quantity, unit, or notes for {editingListItem?.itemName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 rounded-md border border-destructive/40 bg-destructive/10 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
                type="number"
                min="1"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-unit">Unit</Label>
              <Input
                id="edit-unit"
                value={editUnit}
                onChange={(e) => setEditUnit(e.target.value)}
                placeholder="e.g., kg, pcs, pack"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Optional notes"
                className="bg-background"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={editItemMutation.isPending}
            >
              {editItemMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
