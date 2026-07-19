import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Pencil,
  Trash2,
  ClipboardList,
  CalendarDays,
  Copy,
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
import { formatPrice } from '#/lib/format'
import { AppHeader } from '#/components/layout/app-header'
import { LoadingSpinner } from '#/components/layout/loading'
import { apiGet, apiPost, apiPut, apiDelete } from '#/lib/api'
import { toast } from '#/lib/toast'

export const Route = createFileRoute('/lists/')({
  component: ListsPage,
})

interface ShoppingList {
  id: string
  name: string
  period: string
  date: string
  createdAt: string
  itemCount: number
  totalEstimate: number
}

function ListsPage() {
  const { data: session, isPending } = authClient.useSession()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingList, setEditingList] = useState<ShoppingList | null>(null)
  const [listName, setListName] = useState('')
  const [listPeriod, setListPeriod] = useState('weekly')
  const [listDate, setListDate] = useState('')
  const [error, setError] = useState('')

  const {
    data,
    isLoading,
    error: listsError,
  } = useQuery({
    queryKey: ['lists'],
    queryFn: () => apiGet<{ lists: ShoppingList[] }>('/api/lists'),
    enabled: !!session?.user,
  })
  const lists = data?.lists ?? []

  useEffect(() => {
    if (listsError) toast('Failed to load lists', 'destructive')
  }, [listsError])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: listName.trim(),
        period: listPeriod,
        date: new Date(listDate).toISOString(),
      }
      if (editingList) {
        return apiPut(`/api/lists/${editingList.id}`, payload)
      }
      return apiPost('/api/lists', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      setDialogOpen(false)
      setEditingList(null)
      setListName('')
      setListPeriod('weekly')
      setListDate('')
      setError('')
    },
    onError: (err: any) => setError(err.message || 'Failed to save list'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/lists/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists'] }),
  })

  const duplicateMutation = useMutation({
    mutationFn: async (list: ShoppingList) => {
      const newList = await apiPost<ShoppingList>('/api/lists', {
        name: `${list.name} (Copy)`,
        period: list.period,
        date: new Date().toISOString(),
      })
      const { items } = await apiGet<{
        items: Array<{ itemId: string; quantity: number }>
      }>(`/api/lists/items?listId=${list.id}`)
      for (const item of items) {
        await apiPost('/api/lists/items', {
          shoppingListId: newList.id,
          itemId: item.itemId,
          quantity: item.quantity,
        })
      }
      return newList
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      toast('List duplicated')
    },
    onError: (err: any) =>
      toast(err.message || 'Failed to duplicate list', 'destructive'),
  })

  const handleSave = () => {
    if (!listName.trim() || !listDate) return
    setError('')
    saveMutation.mutate()
  }

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this list?')) return
    deleteMutation.mutate(id)
  }

  const openEditDialog = (list: ShoppingList) => {
    setEditingList(list)
    setListName(list.name)
    setListPeriod(list.period)
    setListDate(list.date.split('T')[0])
    setError('')
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingList(null)
    setListName('')
    setListPeriod('weekly')
    setListDate(new Date().toISOString().split('T')[0])
    setError('')
    setDialogOpen(true)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  if (isPending || isLoading) return <LoadingSpinner />

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          Please sign in to manage shopping lists.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader session={session} activeRoute="/lists" />

      <main className="flex-1">
        <div className="page-wrap px-4 sm:px-6 py-8 sm:py-12">
          <div className="rise-in flex items-center justify-between mb-8">
            <h1 className="display-title text-2xl sm:text-3xl font-semibold text-foreground">
              Shopping Lists
            </h1>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                className={cn(buttonVariants({ size: 'sm' }))}
                onClick={openCreateDialog}
              >
                <Plus className="size-4" />
                New List
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingList ? 'Edit List' : 'New Shopping List'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingList
                      ? 'Update the list details.'
                      : 'Create a new shopping list for your next trip.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {error && (
                    <div className="p-3 rounded-md border border-destructive/40 bg-destructive/10 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="list-name">Name</Label>
                    <Input
                      id="list-name"
                      value={listName}
                      onChange={(e) => setListName(e.target.value)}
                      placeholder="e.g., Weekly Groceries, Monthly Stock"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="list-period">Period</Label>
                    <Select
                      value={listPeriod}
                      onValueChange={(v) => setListPeriod(v ?? 'weekly')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="list-date">Date</Label>
                    <Input
                      id="list-date"
                      type="date"
                      value={listDate}
                      onChange={(e) => setListDate(e.target.value)}
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
                      saveMutation.isPending || !listName.trim() || !listDate
                    }
                  >
                    {saveMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {lists.length === 0 ? (
            <div className="rise-in text-center py-16 surface rounded-lg">
              <ClipboardList className="size-10 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No shopping lists yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Create your first list to start planning your grocery trips.
              </p>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="size-4" />
                New List
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lists.map((list, i) => (
                <div
                  key={list.id}
                  className="rise-in tile rounded-lg p-5 flex flex-col"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to="/lists/$listId"
                        params={{ listId: list.id }}
                        className="font-semibold text-foreground no-underline hover:text-primary text-base"
                      >
                        {list.name}
                      </Link>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">
                        {list.period}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => duplicateMutation.mutate(list)}
                        disabled={duplicateMutation.isPending}
                        title="Duplicate list"
                      >
                        <Copy className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => openEditDialog(list)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDelete(list.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-auto pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <CalendarDays className="size-4 shrink-0" />
                      <span className="tabular">{formatDate(list.date)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {list.itemCount}{' '}
                        {list.itemCount === 1 ? 'item' : 'items'}
                      </span>
                      <span className="tabular text-lg font-semibold text-foreground">
                        {formatPrice(list.totalEstimate)}
                      </span>
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
