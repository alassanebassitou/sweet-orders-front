import { useEffect, useMemo, useState } from 'react';
import { Search, Users, Phone, MapPin, Star, Eye, UserCheck, UserX, SearchX, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { userService } from '@/lib/services';
import { formatFCFA } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ClientDetailSheet from '@/components/clients/ClientDetailSheet';
import { LoadingState, ErrorState, EmptyState } from '@/components/common/StateViews';
import { usePresenceStore } from '@/stores/presenceStore';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@radix-ui/react-select';
// Come back to update client info and commandes in the detail sheet, and add possibility to create new client from the page (with a form in a sheet)


export default function ClientsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [vipOnly, setVipOnly] = useState(false);
  const [sortBy, setSortBy] = useState<
    'name-asc' | 'name-desc' | 'spent-desc' | 'spent-asc' | 'orders-desc' | 'orders-asc'
  >('name-asc');
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);
  const qc = useQueryClient();

  const { data: users = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => userService.listAdmin(),
  });

  // Debounce search input by 300ms so we don't re-filter the list on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const clients = users.filter((u: any) => u.role === 'ROLE_CLIENT');

  const filtered = useMemo(() => {
    let list = clients.filter((c: any) => {
      const matchSearch = [c.name, c.firstname, c.telephone, c.city, c.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search);
      const isActive = c.actif || c.isActif;
      const matchActive = activeFilter === 'all' ? true : activeFilter === 'active' ? isActive : !isActive;
      const matchVip = vipOnly ? (c.estVip || c.isVIP) : true;
      return matchSearch && matchActive && matchVip;
    });

    list = [...list].sort((a: any, b: any) => {
      switch (sortBy) {
        case 'name-asc':
          return `${a.firstname || ''} ${a.lastname || a.name || ''}`.localeCompare(
            `${b.firstname || ''} ${b.lastname || b.name || ''}`
          );
        case 'name-desc':
          return `${b.firstname || ''} ${b.lastname || b.name || ''}`.localeCompare(
            `${a.firstname || ''} ${a.lastname || a.name || ''}`
          );
        case 'spent-desc':
          return (b.totalExpenses ?? 0) - (a.totalExpenses ?? 0);
        case 'spent-asc':
          return (a.totalExpenses ?? 0) - (b.totalExpenses ?? 0);
        case 'orders-desc':
          return (b.totalCommande ?? 0) - (a.totalCommande ?? 0);
        case 'orders-asc':
          return (a.totalCommande ?? 0) - (b.totalCommande ?? 0);
        default:
          return 0;
      }
    });

    return list;
  }, [clients, search, activeFilter, vipOnly, sortBy]);

  const hasActiveFilters = search !== '' || activeFilter !== 'all' || vipOnly;

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setActiveFilter('all');
    setVipOnly(false);
    setSortBy('name-asc');
  };

  const activateMut = useMutation({
    mutationFn: (id: number) => userService.activate(id),
    onSuccess: () => {
      toast.success('Client activé — un email de bienvenue a été envoyé');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('Erreur lors de l\'activation'),
  });

  const deactivateMut = useMutation({
    mutationFn: (id: number) => userService.deactivate(id),
    onSuccess: () => {
      toast.success('Client désactivé');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('Erreur lors de la désactivation'),
  });
  const selected = clients.find((c: any) => c.id === selectedClientId);

  return (
    <div className="p-4 md:p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm">
            {filtered.length} client(s)
            {hasActiveFilters && clients.length !== filtered.length ? ` sur ${clients.length}` : ''}
          </p>
        </div>
        {/* <Button className="gap-2"><Plus className="w-4 h-4" /> Nouveau</Button> */}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, téléphone ou ville..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Nom (A → Z)</SelectItem>
            <SelectItem value="name-desc">Nom (Z → A)</SelectItem>
            <SelectItem value="spent-desc">Total dépensé (haut → bas)</SelectItem>
            <SelectItem value="spent-asc">Total dépensé (bas → haut)</SelectItem>
            <SelectItem value="orders-desc">Nb commandes (haut → bas)</SelectItem>
            <SelectItem value="orders-asc">Nb commandes (bas → haut)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { value: 'all', label: 'Tous' },
          { value: 'active', label: 'Actifs' },
          { value: 'inactive', label: 'Inactifs' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value as any)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              activeFilter === f.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:bg-secondary'
            )}>
            {f.label}
          </button>
        ))}

        {/* VIP filter — independent toggle, combinable with the status filter above */}
        <button
          onClick={() => setVipOnly((v) => !v)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1',
            vipOnly
              ? 'bg-warning/15 text-warning border-warning/40'
              : 'bg-card text-muted-foreground border-border hover:bg-secondary'
          )}>
          <Star className="w-3 h-3" /> VIP
        </button>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Réinitialiser
          </button>
        )}
      </div>

      {isLoading ? <LoadingState /> :
       isError ? <ErrorState message="Impossible de charger les clients" onRetry={refetch} /> :
       clients.length === 0 ? <EmptyState message="Aucun client trouvé" icon={Users} /> :
       filtered.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <SearchX className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Aucun client ne correspond à ces filtres</p>
          <Button variant="outline" size="sm" onClick={resetFilters}>Réinitialiser les filtres</Button>
        </div>
       ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c: any) => (
            <Card key={c.id} className={cn('shadow-sm hover:shadow-md transition-shadow cursor-pointer', !(c.actif || c.isActif) && 'opacity-60 grayscale-[30%]')} onClick={() => setSelectedClientId(c.id)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {(c.firstname?.charAt(0) || '')}{(c.lastname?.charAt(0) || c.name?.charAt(0) || '')}
                      </div>
                      {onlineUsers.has(String(c.id)) && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-card rounded-full" title="En ligne" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{c.firstname} {c.lastname || c.name}</p>
                      {c.city && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" /> {c.city}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {(c.estVip || c.isVIP) && (
                      <Badge className="bg-warning/15 text-warning text-[10px] gap-1">
                        <Star className="w-3 h-3" /> VIP
                      </Badge>
                    )}
                    {!(c.actif || c.isActif) && (
                      <Badge className="bg-destructive/10 text-destructive text-[10px]">Inactif</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {c.telephone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.telephone}</div>}
                  <span>{c.totalCommande ?? 0} commande(s)</span>
                </div>
                <div className="mt-2 pt-2 border-t border-border flex justify-between text-xs">
                  <span className="text-muted-foreground">Total dépensé</span>
                  <span className="font-semibold">{formatFCFA(c.totalExpenses ?? 0)}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2">
                  <Button size="sm" variant="ghost" className="text-xs gap-1" onClick={(e) => { e.stopPropagation(); setSelectedClientId(c.id); }}>
                    <Eye className="w-3 h-3" /> Voir fiche
                  </Button>
                  {c.actif || c.isActif ? (
                    <Button size="sm" variant="outline" className="text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/5" onClick={(e) => { e.stopPropagation(); if (confirm(`Désactiver le compte de ${c.firstname} ${c.lastname} ?`)) { deactivateMut.mutate(c.id); } }} disabled={deactivateMut.isPending}>
                      <UserX className="w-3 h-3" /> Désactiver
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="text-xs gap-1 text-success border-success/30 hover:bg-success/5" onClick={(e) => { e.stopPropagation(); activateMut.mutate(c.id); }} disabled={activateMut.isPending}>
                      <UserCheck className="w-3 h-3" /> Activer
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selected && <ClientDetailSheet client={selected} onClose={() => setSelectedClientId(null)} />}
    </div>
  );
}
