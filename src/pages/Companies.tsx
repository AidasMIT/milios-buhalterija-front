import { useState } from 'react';
import { Plus, Pencil, Trash2, Building2, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import type { CompanyData, CompanyListItem } from '@/api/types';
import { companiesApi } from '@/api/endpoints';
import { MainLayout } from '@/components/layout/MainLayout';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCan } from '@/hooks/use-auth';
import { useArchiveCompany, useCompanies, useSaveCompany } from '@/hooks/use-companies';
import { useDebounced } from '@/hooks/use-debounced';
import { toastError } from '@/lib/errors';

const EMPTY: CompanyData = { name: '', code: '', vatCode: '', email: '', phone: '', address: '' };

const FIELDS: { key: keyof CompanyData; label: string; placeholder: string; type?: string }[] = [
  { key: 'name', label: 'Pavadinimas *', placeholder: 'UAB „Įmonės pavadinimas"' },
  { key: 'code', label: 'Įmonės kodas *', placeholder: '123456789' },
  { key: 'vatCode', label: 'PVM kodas', placeholder: 'LT123456789' },
  { key: 'email', label: 'El. paštas', placeholder: 'info@imone.lt', type: 'email' },
  { key: 'phone', label: 'Telefonas', placeholder: '+370 600 00000' },
  { key: 'address', label: 'Adresas', placeholder: 'Gatvė 15, Miestas' },
];

/** Client address book, shared by all profiles. Invoices keep their own copy of the buyer. */
export default function Companies() {
  const can = useCan();
  const canManage = can('companies.manage');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search.trim());
  const { data: companies = [], isLoading } = useCompanies(debouncedSearch || undefined);
  const save = useSaveCompany();
  const archive = useArchiveCompany();

  const [editing, setEditing] = useState<{ id?: string; version?: number } | null>(null);
  const [form, setForm] = useState<CompanyData>(EMPTY);
  const [toArchive, setToArchive] = useState<CompanyListItem | null>(null);

  const openNew = () => {
    setForm(EMPTY);
    setEditing({});
  };

  const openEdit = async (id: string) => {
    try {
      const company = await companiesApi.get(id);
      setForm({ ...EMPTY, ...Object.fromEntries(Object.entries(company).map(([k, v]) => [k, v ?? ''])) });
      setEditing({ id: company.id, version: company.version });
    } catch (error) {
      toastError(error);
    }
  };

  const handleSubmit = () => {
    if (!form.name?.trim() || !form.code?.trim()) {
      toast.error('Užpildykite pavadinimą ir įmonės kodą');
      return;
    }
    const company = Object.fromEntries(
      FIELDS.map(({ key }) => [key, form[key]?.trim() || null])) as unknown as CompanyData;
    save.mutate({ ...editing, company }, {
      onSuccess: () => {
        toast.success(editing?.id ? 'Įmonė atnaujinta' : 'Įmonė pridėta');
        setEditing(null);
      },
      onError: toastError,
    });
  };

  const handleArchive = () => {
    if (!toArchive) return;
    archive.mutate(toArchive.id, {
      onSuccess: () => toast.success('Įmonė pašalinta iš sąrašo'),
      onError: toastError,
      onSettled: () => setToArchive(null),
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Įmonės</h1>
            <p className="text-muted-foreground mt-1">Klientų sąrašas pirkėjo duomenims užpildyti</p>
          </div>
          {canManage && (
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              Nauja įmonė
            </Button>
          )}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Ieškoti pagal pavadinimą ar kodą..." className="pl-9 pr-9" />
          {search && (
            <button onClick={() => setSearch('')} aria-label="Išvalyti paiešką"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Kraunama…</p>
        ) : companies.length === 0 ? (
          <div className="rounded-xl bg-card p-12 text-center shadow-card">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">{search ? 'Įmonių nerasta' : 'Nėra įmonių'}</h3>
            {!search && canManage && (
              <Button onClick={openNew}>
                <Plus className="h-4 w-4 mr-2" />
                Pridėti įmonę
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <div key={company.id} className="rounded-xl bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow animate-fade-in">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground line-clamp-1">{company.name}</h3>
                    <p className="text-sm text-muted-foreground">{company.code}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground mb-4">
                  {company.vatCode && <p>PVM: {company.vatCode}</p>}
                  {company.email && <p>{company.email}</p>}
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(company.id)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Redaguoti
                    </Button>
                    <Button variant="ghost" size="sm" aria-label="Pašalinti"
                      className="text-muted-foreground hover:text-destructive" onClick={() => setToArchive(company)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Redaguoti įmonę' : 'Nauja įmonė'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            {FIELDS.map(({ key, label, placeholder, type }) => (
              <div key={key} className={key === 'name' || key === 'address' ? 'space-y-2 sm:col-span-2' : 'space-y-2'}>
                <Label htmlFor={`company-${key}`}>{label}</Label>
                <Input id={`company-${key}`} type={type} placeholder={placeholder} value={form[key] ?? ''}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditing(null)}>Atšaukti</Button>
            <Button onClick={handleSubmit} disabled={save.isPending}>{editing?.id ? 'Išsaugoti' : 'Pridėti'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!toArchive}
        onOpenChange={(open) => !open && setToArchive(null)}
        title={`Pašalinti „${toArchive?.name}"?`}
        description="Įmonė dings iš sąrašo. Jau išrašytos sąskaitos nepasikeis – jose saugoma pirkėjo duomenų kopija."
        confirmLabel="Pašalinti"
        onConfirm={handleArchive}
      />
    </MainLayout>
  );
}
