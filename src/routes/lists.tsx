import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { ShoppingBasket, Plus, Pencil, Trash2, ClipboardList, CalendarDays, ShoppingCart } from 'lucide-react'
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
  itemCount?: number
}

function ListsPage() {
  const { data: session, isPending } = authClient.useSession()
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingList, setEditingList] = useState<ShoppingList | null>(null)
  const [listName, setListName] = useState('')
  const [listPeriod, setListPeriod] = useState('weekly')
  const [listStartDate, setListStartDate] = useState('')
  const [listEndDate, setListEndDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchLists()
    }
  }, [session])

  const fetchLists = async () => {
    try {
      const res = await fetch('/api/lists')
      const data = await res.json()
      setLists(data.lists || [])
    } catch (error) {
      console.error('Failed to fetch lists:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!listName.trim() || !listStartDate || !listEndDate) return
    setSaving(true)

    try {
      const payload = {
        name: listName.trim(),
        period: listPeriod,
        startDate: new Date(listStartDate).toISOString(),
        endDate: new Date(listEndDate).toISOString(),
      }

      if (editingList) {
        await fetch(`/api/lists/${editingList.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch('/api/lists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      await fetchLists()
      setDialogOpen(false)
      setEditingList(null)
      setListName('')
      setListPeriod('weekly')
      setListStartDate('')
      setListEndDate('')
    } catch (error) {
      console.error('Failed to save list:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this list?')) return

    try {
      await fetch(`/api/lists/${id}`, { method: 'DELETE' })
      await fetchLists()
    } catch (error) {
      console.error('Failed to delete list:', error)
    }
  }

  const openEditDialog = (list: ShoppingList) => {
    setEditingList(list)
    setListName(list.name)
    setListPeriod(list.period)
    setListStartDate(list.startDate.split('T')[0])
    setListEndDate(list.endDate.split('T')[0])
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingList(null)
    setListName('')
    setListPeriod('weekly')
    setListStartDate('')
    setListEndDate('')
    setDialogOpen(true)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
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
        <p className="text-muted-foreground">Please sign in to manage shopping lists.</p>
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
          <div className="rise-in flex items-center justify-between mb-8">
            <div>
              <h1 className="display-title text-2xl sm:text-3xl font-bold text-[var(--sea-ink)] mb-1">Shopping Lists</h1>
              <p className="text-muted-foreground">Plan your weekly and monthly grocery trips</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={openCreateDialog}>
                  <Plus className="size-4" />
                  New List
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingList ? 'Edit List' : 'New Shopping List'}</DialogTitle>
                  <DialogDescription>
                    {editingList ? 'Update the list details.' : 'Create a new shopping list for your next trip.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="list-name">Name</Label>
                    <Input
                      id="list-name"
                      value={listName}
                      onChange={(e) => setListName(e.target.value)}
                      placeholder="e.g., Weekly Groceries, Monthly Stock"
                      className="bg-white/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="list-period">Period</Label>
                    <Select value={listPeriod} onValueChange={setListPeriod}>
                      <SelectTrigger className="w-full bg-white/60">
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
                        className="bg-white/60"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="list-end">End Date</Label>
                      <Input
                        id="list-end"
                        type="date"
                        value={listEndDate}
                        onChange={(e) => setListEndDate(e.target.value)}
                        className="bg-white/60"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving || !listName.trim() || !listStartDate || !listEndDate}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {lists.length === 0 ? (
            <div className="rise-in text-center py-16 feature-card rounded-2xl border border-border/60">
              <ClipboardList className="size-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--sea-ink)] mb-2">No shopping lists yet</h3>
              <p className="text-muted-foreground mb-4">Create your first list to start planning your grocery trips.</p>
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
                  className="rise-in feature-card rounded-2xl border border-border/60 p-5"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-[var(--lagoon)] to-[var(--lagoon-deep)] text-white shadow-sm">
                        <ShoppingCart className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--sea-ink)]">{list.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{list.period}</p>
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
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="size-4" />
                      <span>{formatDate(list.startDate)} - {formatDate(list.endDate)}</span>
                    </div>
                    {list.itemCount !== undefined && (
                      <p className="text-xs text-muted-foreground mt-1">{list.itemCount} items</p>
                    )}
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
