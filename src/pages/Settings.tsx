import { useState, type FormEvent } from 'react';
import { Building2, Pencil, Plus, User } from 'lucide-react';
import { toast } from 'sonner';
import type { BusinessType, ProfileData } from '@/api/types';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActiveProfile } from '@/context/ActiveProfile';
import { useCan, useCanEverywhere, useChangePassword } from '@/hooks/use-auth';
import { useProfile, useSaveProfile } from '@/hooks/use-profiles';
import { errorMessage, toastError } from '@/lib/errors';
import { BUSINESS_TYPE_LABELS } from '@/lib/profile';

const EMPTY_PROFILE: ProfileData = {
  type: 'Individual', name: '', code: '', vatCode: '', address: '', bankAccount: '', bankName: '', email: '', phone: '',
  invoiceSeries: '',
};

const TEXT_FIELDS: { key: Exclude<keyof ProfileData, 'type'>; label: string; placeholder?: string; wide?: boolean }[] = [
  { key: 'name', label: 'Pavadinimas / vardas, pavardė *', wide: true },
  { key: 'code', label: 'Įmonės kodas / IV pažymos nr. *' },
  { key: 'vatCode', label: 'PVM mokėtojo kodas', placeholder: 'LT123456789' },
  { key: 'address', label: 'Adresas *', wide: true },
  { key: 'bankAccount', label: 'Banko sąskaita (IBAN)', placeholder: 'LT00 0000 0000 0000 0000' },
  { key: 'bankName', label: 'Bankas', placeholder: 'AB „Swedbank", B.k. 73000' },
  { key: 'email', label: 'El. paštas' },
  { key: 'phone', label: 'Telefonas' },
  { key: 'invoiceSeries', label: 'Sąskaitų serija *', placeholder: 'AM' },
];

/** Mounted only while open, so every opening starts from a clean form. */
function ProfileDialog({ profileId, onClose }: { profileId?: string; onClose: () => void }) {
  const save = useSaveProfile();
  const { data: loaded } = useProfile(profileId);
  const [form, setForm] = useState<ProfileData>(EMPTY_PROFILE);
  const [lastSequence, setLastSequence] = useState('0');
  const [loadedVersion, setLoadedVersion] = useState<number>();

  // Copy the full profile into the form once it arrives (the list holds only a summary).
  if (loaded && loaded.version !== loadedVersion) {
    setLoadedVersion(loaded.version);
    setForm({
      type: loaded.type, name: loaded.name, code: loaded.code, vatCode: loaded.vatCode ?? '', address: loaded.address,
      bankAccount: loaded.bankAccount ?? '', bankName: loaded.bankName ?? '', email: loaded.email ?? '',
      phone: loaded.phone ?? '', invoiceSeries: loaded.invoiceSeries,
    });
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const details = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() || null : v])) as unknown as ProfileData;
    save.mutate({ id: profileId, details, version: loadedVersion, lastInvoiceSequence: Number(lastSequence) || 0 }, {
      onSuccess: () => {
        toast.success(profileId ? 'Profilis atnaujintas' : 'Profilis sukurtas');
        onClose();
      },
      onError: toastError,
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{profileId ? 'Redaguoti profilį' : 'Naujas verslo profilis'}</DialogTitle>
        </DialogHeader>
        {profileId && !loaded ? (
          <p className="text-muted-foreground">Kraunama…</p>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Veiklos forma</Label>
              <Select value={form.type} onValueChange={(type: BusinessType) => setForm({ ...form, type })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(BUSINESS_TYPE_LABELS) as BusinessType[]).map((t) => (
                    <SelectItem key={t} value={t}>{BUSINESS_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {TEXT_FIELDS.map(({ key, label, placeholder, wide }) => (
              <div key={key} className={wide ? 'space-y-2 sm:col-span-2' : 'space-y-2'}>
                <Label htmlFor={`profile-${key}`}>{label}</Label>
                <Input id={`profile-${key}`} placeholder={placeholder} value={form[key] ?? ''}
                  onChange={(e) => setForm({ ...form, [key]: key === 'invoiceSeries' ? e.target.value.toUpperCase() : e.target.value })} />
              </div>
            ))}
            {!profileId && (
              <div className="space-y-2">
                <Label htmlFor="profile-sequence">Paskutinės išrašytos sąskaitos nr.</Label>
                <Input id="profile-sequence" inputMode="numeric" value={lastSequence}
                  onChange={(e) => setLastSequence(e.target.value.replace(/\D/g, ''))} />
                <p className="text-xs text-muted-foreground">Pvz. 14 – kita sąskaita gaus nr. 15.</p>
              </div>
            )}
            <div className="flex justify-end gap-3 sm:col-span-2">
              <Button type="button" variant="outline" onClick={onClose}>Atšaukti</Button>
              <Button type="submit" disabled={save.isPending}>{profileId ? 'Išsaugoti' : 'Sukurti'}</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ChangePasswordForm() {
  const change = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    change.mutate({ currentPassword: current, newPassword: next }, {
      onSuccess: () => {
        toast.success('Slaptažodis pakeistas');
        setCurrent('');
        setNext('');
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="current-password">Dabartinis slaptažodis</Label>
        <Input id="current-password" type="password" autoComplete="current-password" required value={current}
          onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">Naujas slaptažodis (min. 10 simbolių)</Label>
        <Input id="new-password" type="password" autoComplete="new-password" required minLength={10} value={next}
          onChange={(e) => setNext(e.target.value)} />
      </div>
      {change.isError && (
        <p className="text-sm text-destructive sm:col-span-2" role="alert">{errorMessage(change.error)}</p>
      )}
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" disabled={change.isPending}>Pakeisti slaptažodį</Button>
      </div>
    </form>
  );
}

export default function Settings() {
  const { profiles } = useActiveProfile();
  const can = useCan();
  const canEverywhere = useCanEverywhere();
  const [editing, setEditing] = useState<{ id?: string } | null>(null);

  return (
    <MainLayout>
      <div className="max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nustatymai</h1>
          <p className="text-muted-foreground mt-1">Verslo profiliai ir paskyra</p>
        </div>

        <section className="rounded-xl bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Verslo profiliai</h2>
            {canEverywhere('profiles.manage') && (
              <Button size="sm" onClick={() => setEditing({})}>
                <Plus className="h-4 w-4 mr-2" />
                Naujas profilis
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Profilio duomenys spausdinami sąskaitose kaip pardavėjas. Pakeitimai paliečia tik juodraščius – išrašytos
            sąskaitos lieka tokios, kokios buvo išrašytos.
          </p>
          {profiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Profilių dar nėra.</p>
          ) : (
            <div className="divide-y divide-border">
              {profiles.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    {profile.type === 'Individual'
                      ? <User className="h-5 w-5 text-primary" />
                      : <Building2 className="h-5 w-5 text-primary" />}
                    <div>
                      <p className="font-medium">{profile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {BUSINESS_TYPE_LABELS[profile.type]} · {profile.code} · serija {profile.invoiceSeries}
                      </p>
                    </div>
                  </div>
                  {can('profiles.manage', profile.id) && (
                    <Button variant="outline" size="sm" onClick={() => setEditing({ id: profile.id })}>
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Redaguoti
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl bg-card p-6 shadow-card space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Slaptažodis</h2>
          <ChangePasswordForm />
        </section>
      </div>

      {editing && <ProfileDialog profileId={editing.id} onClose={() => setEditing(null)} />}
    </MainLayout>
  );
}
