import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Search,
  Globe,
  Check,
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
import { apiGet, apiPost, apiPut, apiDelete } from '#/lib/api'
import { toast } from '#/lib/toast'

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
  globalItemId?: string | null
}

interface GlobalCategory {
  id: string
  name: string
}

interface GlobalItem {
  id: string
  name: string
  unit: string
  globalCategoryId: string
  categoryName: string
}

type AddMode = 'catalog' | 'custom'

function ItemsPage() {
  const { data: session, isPending } = authClient.useSession()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [addMode, setAddMode] = useState<AddMode>('catalog')
  const [itemName, setItemName] = useState('')
  const [itemCategoryId, setItemCategoryId] = useState('')
  const [itemPrice, setItemPrice] = useState('')
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [selectedGlobalCategoryId, setSelectedGlobalCategoryId] = useState('')
  const [selectedGlobalItemId, setSelectedGlobalItemId] = useState('')

  const {
    data: itemsData,
    isLoading: itemsLoading,
    error: itemsError,
  } = useQuery({
    queryKey: ['items'],
    queryFn: () => apiGet<{ items: Item[] }>('/api/items'),
    enabled: !!session?.user,
  })
  const items = itemsData?.items ?? []

  const { data: categoriesData, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet<{ categories: Category[] }>('/api/categories'),
    enabled: !!session?.user,
  })
  const categories = categoriesData?.categories ?? []

  const { data: globalCategoriesData } = useQuery({
    queryKey: ['catalogCategories'],
    queryFn: () =>
      apiGet<{ categories: GlobalCategory[] }>('/api/catalog/categories'),
    enabled: !!session?.user && dialogOpen && addMode === 'catalog',
  })
  const globalCategories = globalCategoriesData?.categories ?? []

  const { data: globalItemsData } = useQuery({
    queryKey: ['catalogItems', selectedGlobalCategoryId, catalogSearch],
    queryFn: () => {
      const params = new URLSearchParams()
      if (selectedGlobalCategoryId)
        params.set('categoryId', selectedGlobalCategoryId)
      if (catalogSearch.trim()) params.set('search', catalogSearch.trim())
      return apiGet<{ items: GlobalItem[] }>(`/api/catalog/items?${params}`)
    },
    enabled: !!session?.user && dialogOpen && addMode === 'catalog',
  })
  const globalItems = globalItemsData?.items ?? []

  const { data: userData } = useQuery({
    queryKey: ['userLocation'],
    queryFn: () =>
      apiGet<{ provinceId: string | null; cityId: string | null }>(
        '/api/user/location',
      ),
    enabled: !!session?.user && dialogOpen && addMode === 'catalog',
  })

  const selectedGlobalItem = useMemo(
    () => globalItems.find((g) => g.id === selectedGlobalItemId) ?? null,
    [globalItems, selectedGlobalItemId],
  )

  const { data: priceData } = useQuery({
    queryKey: ['catalogPrice', selectedGlobalItemId, userData?.cityId],
    queryFn: () =>
      apiGet<{ price: { price: number } }>(
        `/api/catalog/price?globalItemId=${selectedGlobalItemId}&cityId=${userData!.cityId}`,
      ),
    enabled: !!selectedGlobalItemId && !!userData?.cityId,
  })

  useEffect(() => {
    if (itemsError) toast('Failed to load items', 'destructive')
  }, [itemsError])

  useEffect(() => {
    if (categoriesError) toast('Failed to load categories', 'destructive')
  }, [categoriesError])

  const categoryMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  )

  const filteredItems = useMemo(
    () =>
      searchQuery.trim()
        ? items.filter((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()),
          )
        : items,
    [items, searchQuery],
  )

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        name: itemName.trim(),
        categoryId: itemCategoryId,
        estimatedPrice: Math.round(parseFloat(itemPrice) * 100),
      }
      if (addMode === 'catalog' && selectedGlobalItemId) {
        payload.globalItemId = selectedGlobalItemId
        if (userData?.cityId) payload.cityId = userData.cityId
      }
      if (editingItem) {
        return apiPut(`/api/items/${editingItem.id}`, payload)
      }
      return apiPost('/api/items', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      setDialogOpen(false)
      setEditingItem(null)
      setAddMode('catalog')
      setItemName('')
      setItemCategoryId('')
      setItemPrice('')
      setError('')
      setCatalogSearch('')
      setSelectedGlobalCategoryId('')
      setSelectedGlobalItemId('')
    },
    onError: (err: any) => setError(err.message || 'Failed to save item'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/items/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  })

  const handleSave = () => {
    if (!itemName.trim() || !itemCategoryId || !itemPrice) return
    setError('')
    saveMutation.mutate()
  }

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    deleteMutation.mutate(id)
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
    setAddMode('catalog')
    setItemName('')
    setItemCategoryId('')
    setItemPrice('')
    setError('')
    setCatalogSearch('')
    setSelectedGlobalCategoryId('')
    setSelectedGlobalItemId('')
    setDialogOpen(true)
  }

  const handleSelectGlobalItem = (globalItem: GlobalItem) => {
    setSelectedGlobalItemId(globalItem.id)
    setItemName(globalItem.name)
    // Find matching local category by name, or pick the first one
    const match = categories.find((c) => c.name === globalItem.categoryName)
    if (match) {
      setItemCategoryId(match.id)
    } else if (categories.length > 0) {
      setItemCategoryId(categories[0].id)
    }
    // Price will be filled by the price query effect
  }

  // Auto-fill price when catalog price data arrives
  useEffect(() => {
    if (addMode === 'catalog' && priceData?.price.price && !editingItem) {
      setItemPrice((priceData.price.price / 100).toFixed(2))
    }
  }, [addMode, priceData, editingItem])

  if (isPending || itemsLoading) return <LoadingSpinner />

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
          <div className="rise-in flex items-center justify-between mb-6">
            <h1 className="display-title text-2xl sm:text-3xl font-semibold text-foreground">
              Items
            </h1>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                className={cn(buttonVariants({ size: 'sm' }))}
                onClick={openCreateDialog}
              >
                <Plus className="size-4" />
                Add Item
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Edit Item' : 'New Item'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingItem
                      ? 'Update the item details.'
                      : 'Add a new item to your catalog.'}
                  </DialogDescription>
                </DialogHeader>

                {/* Mode toggle — hidden when editing */}
                {!editingItem && (
                  <div className="flex rounded-md border border-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setAddMode('catalog')}
                      className={cn(
                        'flex-1 py-2 px-3 text-sm font-medium transition-colors',
                        addMode === 'catalog'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Globe className="inline size-3.5 mr-1.5 -mt-0.5" />
                      Browse Catalog
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddMode('custom')}
                      className={cn(
                        'flex-1 py-2 px-3 text-sm font-medium transition-colors',
                        addMode === 'custom'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Plus className="inline size-3.5 mr-1.5 -mt-0.5" />
                      Create Custom
                    </button>
                  </div>
                )}

                <div className="space-y-4 py-4">
                  {error && (
                    <div className="p-3 rounded-md border border-destructive/40 bg-destructive/10 text-sm text-destructive">
                      {error}
                    </div>
                  )}

                  {/* Catalog browsing mode */}
                  {!editingItem && addMode === 'catalog' && (
                    <>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={selectedGlobalCategoryId}
                          onValueChange={(v) => {
                            setSelectedGlobalCategoryId(v ?? '')
                            setSelectedGlobalItemId('')
                          }}
                          items={[
                            { value: '', label: 'All categories' },
                            ...globalCategories.map((c) => ({
                              value: c.id,
                              label: c.name,
                            })),
                          ]}
                        >
                          <SelectTrigger className="w-full bg-background">
                            <SelectValue placeholder="All categories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All categories</SelectItem>
                            {globalCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                          value={catalogSearch}
                          onChange={(e) => setCatalogSearch(e.target.value)}
                          placeholder="Search catalog items…"
                          className="pl-9 bg-background"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto rounded-md border border-border divide-y divide-border">
                        {globalItems.length === 0 ? (
                          <p className="p-3 text-sm text-muted-foreground text-center">
                            No catalog items found.
                          </p>
                        ) : (
                          globalItems.map((g) => (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => handleSelectGlobalItem(g)}
                              className={cn(
                                'w-full text-left px-3 py-2 text-sm transition-colors hover:bg-accent/10',
                                selectedGlobalItemId === g.id && 'bg-accent/10',
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium text-foreground">
                                    {g.name}
                                  </span>
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    {g.categoryName} · {g.unit}
                                  </span>
                                </div>
                                {selectedGlobalItemId === g.id && (
                                  <Check className="size-4 text-primary" />
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                      {selectedGlobalItem && (
                        <div className="rounded-md border border-border bg-surface p-3 space-y-2">
                          <p className="text-sm font-medium text-foreground">
                            {selectedGlobalItem.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedGlobalItem.categoryName} ·{' '}
                            {selectedGlobalItem.unit}
                          </p>
                          {userData?.cityId && priceData?.price.price ? (
                            <p className="text-sm text-foreground">
                              Suggested price:{' '}
                              <span className="tabular font-semibold">
                                {formatPrice(priceData.price.price)}
                              </span>
                            </p>
                          ) : userData?.cityId ? (
                            <p className="text-xs text-muted-foreground">
                              No price data for your city.
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Set your city in settings for price suggestions.
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Item name — always visible */}
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
                    <Select
                      value={itemCategoryId}
                      onValueChange={(v) => setItemCategoryId(v ?? '')}
                      items={categories.map((c) => ({
                        value: c.id,
                        label: c.name,
                      }))}
                    >
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
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={
                      saveMutation.isPending ||
                      !itemName.trim() ||
                      !itemCategoryId ||
                      !itemPrice
                    }
                  >
                    {saveMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {items.length > 0 && (
            <div className="toolbar">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items…"
                  className="pl-9"
                />
              </div>
              <p className="text-sm text-muted-foreground tabular">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          )}

          {items.length === 0 ? (
            <div className="rise-in text-center py-16 surface rounded-lg">
              <Package className="size-10 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No items yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Add your first grocery item to start tracking prices.
              </p>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="size-4" />
                Add Item
              </Button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rise-in text-center py-12 surface rounded-lg">
              <p className="text-muted-foreground">
                No items match "{searchQuery}".
              </p>
            </div>
          ) : (
            <div className="rise-in data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th className="text-right">Est. Price</th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <span className="font-medium text-foreground">
                          {item.name}
                        </span>
                        {item.globalItemId && (
                          <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-primary">
                            <Globe className="size-3" />
                            Catalog
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="text-muted-foreground">
                          {categoryMap[item.categoryId] || '—'}
                        </span>
                      </td>
                      <td className="text-right tabular font-medium text-foreground">
                        {formatPrice(item.estimatedPrice)}
                      </td>
                      <td>
                        <div className="row-actions flex items-center gap-0.5 justify-end">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
