import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authClient } from '#/lib/auth-client'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { AppHeader } from '#/components/layout/app-header'
import { LoadingSpinner } from '#/components/layout/loading'
import { apiGet, apiPut, errMessage } from '#/lib/api'
import { renderSelectLabel } from '#/lib/select-label'
import { toast } from '#/lib/toast'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

interface Province {
  id: string
  name: string
}

interface City {
  id: string
  name: string
  provinceId: string
}

function SettingsPage() {
  const { data: session, isPending } = authClient.useSession()
  const queryClient = useQueryClient()

  const [selectedProvince, setSelectedProvince] = useState<string>('')
  const [selectedCity, setSelectedCity] = useState<string>('')

  // Load current user location
  const { data: userLocation, isLoading: locationLoading } = useQuery({
    queryKey: ['userLocation'],
    queryFn: () =>
      apiGet<{ provinceId: string | null; cityId: string | null }>(
        '/api/user/location',
      ),
    enabled: !!session?.user,
  })

  // Load provinces
  const { data: provincesData, isLoading: provincesLoading } = useQuery({
    queryKey: ['provinces'],
    queryFn: () =>
      apiGet<{ provinces: Province[] }>('/api/locations/provinces'),
  })
  const provinces = provincesData?.provinces ?? []

  // Load cities when province changes
  const { data: citiesData, isLoading: citiesLoading } = useQuery({
    queryKey: ['cities', selectedProvince],
    queryFn: () =>
      apiGet<{ cities: City[] }>(
        `/api/locations/cities?provinceId=${selectedProvince}`,
      ),
    enabled: !!selectedProvince,
  })
  const cities = citiesData?.cities ?? []

  // Initialize form from user location
  useEffect(() => {
    if (userLocation) {
      setSelectedProvince(userLocation.provinceId ?? '')
      setSelectedCity(userLocation.cityId ?? '')
    }
  }, [userLocation])

  // User-initiated province change: switch province and clear city selection.
  const handleProvinceChange = (v: string | null) => {
    setSelectedProvince(v ?? '')
    setSelectedCity('')
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      apiPut('/api/user/location', {
        provinceId: selectedProvince || null,
        cityId: selectedCity || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userLocation'] })
      toast('Location saved')
    },
    onError: (err) =>
      toast(errMessage(err, 'Failed to save location'), 'destructive'),
  })

  if (isPending || locationLoading) return <LoadingSpinner />

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          Please sign in to access settings.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader session={session} activeRoute="/settings" />

      <main className="flex-1">
        <div className="page-wrap px-4 sm:px-6 py-8 sm:py-12">
          <div className="rise-in mb-8">
            <h1 className="display-title text-2xl sm:text-3xl font-semibold text-foreground">
              Settings
            </h1>
          </div>

          <div className="rise-in max-w-lg section-accent space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">
                Location
              </h2>
              <p className="text-sm text-muted-foreground">
                Set your province and city for localized pricing.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <Select
                  value={selectedProvince}
                  onValueChange={handleProvinceChange}
                >
                  <SelectTrigger className="w-full" disabled={provincesLoading}>
                    <SelectValue>
                      {renderSelectLabel(
                        provinces,
                        provincesLoading ? 'Loading...' : 'Select province',
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((prov) => (
                      <SelectItem key={prov.id} value={prov.id}>
                        {prov.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Select
                  value={selectedCity}
                  onValueChange={(v) => setSelectedCity(v ?? '')}
                >
                  <SelectTrigger
                    className="w-full"
                    disabled={!selectedProvince || citiesLoading}
                  >
                    <SelectValue>
                      {renderSelectLabel(
                        cities,
                        !selectedProvince
                          ? 'Select a province first'
                          : citiesLoading
                            ? 'Loading...'
                            : 'Select city',
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save Location'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
