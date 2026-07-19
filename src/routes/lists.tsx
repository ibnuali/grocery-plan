import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Pencil,
  Trash2,
  ClipboardList,
  CalendarDays,
  ShoppingCart,
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

export const Route = createFileRoute('/lists')({
  component: ListsPage,
})

interface ShoppingList {
  id: string
  name: string
  period: string
  startDate: string
  endDate: string
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
  const [listStartDate, setListStartDate] = useState('')
  const [listEndDate, setListEndDate] = useState('')
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['lists'],
    queryFn: () => apiGet<{ lists: ShoppingList[] }>('/api/lists'),
    enabled: !!session?.user,
  })
  const lists = data?.lists ?? []

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: listName.trim(),
        period: listPeriod,
        startDate: new Date(listStartDate).toISOString(),
        endDate: new Date(listEndDate).toISOString(),
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
      setListStartDate('')
      setListEndDate('')
      setError('')
    },
    onError: (err: any) => setError(err.message || 'Failed to save list'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/lists/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lists'] }),
  })

  const handleSave = () => {
    if (!listName.trim() || !listStartDate || !listEndDate) return
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
    setListStartDate(list.startDate.split('T')[0])
    setListEndDate(list.endDate.split('T')[0])
    setError('')
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingList(null)
    setListName('')
    setListPeriod('weekly')
    setListStartDate('')
    setListEndDate('')
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
            <div>
              <h1 className="display-title text-2xl sm:text-3xl font-semibold text-foreground mb-1">
                Shopping Lists
              </h1>
              <p className="text-muted-foreground">
                Plan your weekly and monthly grocery trips
              </p>
            </div>
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
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="list-period">Period</Label>
                    <Select
                      value={listPeriod}
                      onValueChange={(v) => setListPeriod(v ?? 'weekly')}
                    >
                      <SelectTrigger className="w-full bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="list-start">Start Date</Label>
                      <Input
                        id="list-start"
                        type="date"
                        value={listStartDate}
                        onChange={(e) => setListStartDate(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="list-end">End Date</Label>
                      <Input
                        id="list-end"
                        type="date"
                        value={listEndDate}
                        onChange={(e) => setListEndDate(e.target.value)}
                        className="bg-background"
                      />
                    </div>
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
                      !listName.trim() ||
                      !listStartDate ||
                      !listEndDate
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lists.map((list, i) => (
                <div
                  key={list.id}
                  className="rise-in tile rounded-lg p-5"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="icon-badge size-10 rounded-md">
                        <ShoppingCart className="size-5" />
                      </div>
                      <div>
                        <Link
                          to="/lists/$listId"
                          params={{ listId: list.id }}
                          className="font-semibold text-foreground no-underline hover:text-primary"
                        >
                          {list.name}
                        </Link>
                        <p className="text-xs text-muted-foreground capitalize">
                          {list.period}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
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
                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="size-4" />
                      <span className="tabular">
                        {formatDate(list.startDate)} –{' '}
                        {formatDate(list.endDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {list.itemCount} {list.itemCount === 1 ? 'item' : 'items'}
                      </span>
                      <span className="font-medium tabular">
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
