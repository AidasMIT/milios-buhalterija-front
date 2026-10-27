import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Send, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Buyer, InvoiceContent, InvoiceDetails, ProfileDetails, UnitOfMeasure } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompanies, useCompany } from '@/hooks/use-companies';
import { addDaysIso, formatCurrency, roundMoney, todayIso } from '@/lib/format';
import { UNIT_LABELS } from '@/lib/invoice';

interface LineState {
  key: number;
  description: string;
  unit: UnitOfMeasure;
  quantity: string; // text, so "7,5" can be typed
  unitPrice: string;
}

interface InvoiceFormProps {
  profile: ProfileDetails;
  invoice?: InvoiceDetails;
  canIssue: boolean;
  submitting: boolean;
  onSubmit: (content: InvoiceContent, issue: boolean) => void;
}

const parseNumber = (value: string) => Number(value.replace(',', '.').trim());
let nextKey = 1;
const newLine = (): LineState => ({ key: nextKey++, description: '', unit: 'Month', quantity: '1', unitPrice: '' });

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-card p-6 shadow-card">
      <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

/**
 * Creates or edits a draft. Only what the user decides is sent: the seller comes from the profile and the number,
 * totals and amount in words are computed by the API. The totals shown here are a preview with the same rounding.
 */
export function InvoiceForm({ profile, invoice, canIssue, submitting, onSubmit }: InvoiceFormProps) {
  const navigate = useNavigate();
  const { data: companies = [] } = useCompanies();
  const [companyId, setCompanyId] = useState<string>();
  const { data: company } = useCompany(companyId);

  const [buyer, setBuyer] = useState<Buyer>(
    invoice?.buyer ?? { name: '', companyCode: '', vatCode: '', address: '' });
  const [meta, setMeta] = useState(() => {
    const issueDate = invoice?.issueDate ?? todayIso();
    return {
      isAdvance: invoice?.isAdvance ?? false,
      issueDate,
      dueDate: invoice?.dueDate ?? addDaysIso(issueDate, 14),
      vatRate: String(invoice?.vatRate ?? 0),
      notes: invoice?.notes ?? '',
      issuedBy: invoice?.issuedBy ?? (profile.type === 'Individual' ? profile.name : ''),
      receivedBy: invoice?.receivedBy ?? '',
    };
  });
  const [lines, setLines] = useState<LineState[]>(() =>
    invoice?.lines.map((l) => ({
      key: nextKey++,
      description: l.description,
      unit: l.unit,
      quantity: String(l.quantity),
      unitPrice: String(l.unitPrice),
    })) ?? [newLine()]);

  // Picking a company copies its details once; the fields stay editable.
  const [appliedCompanyId, setAppliedCompanyId] = useState<string>();
  if (company && company.id !== appliedCompanyId) {
    setAppliedCompanyId(company.id);
    setBuyer({ name: company.name, companyCode: company.code, vatCode: company.vatCode ?? '', address: company.address ?? '' });
  }

  const lineTotal = (line: LineState) => roundMoney((parseNumber(line.quantity) || 0) * (parseNumber(line.unitPrice) || 0));
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + lineTotal(line), 0));
  const vat = roundMoney((subtotal * (parseNumber(meta.vatRate) || 0)) / 100);
  const total = roundMoney(subtotal + vat);

  const updateLine = (key: number, patch: Partial<LineState>) =>
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));

  const handleSubmit = (issue: boolean) => {
    if (!buyer.name.trim() || !buyer.address.trim()) {
      toast.error('Užpildykite pirkėjo pavadinimą ir adresą');
      return;
    }
    if (lines.some((l) => !l.description.trim() || !(parseNumber(l.quantity) > 0) || Number.isNaN(parseNumber(l.unitPrice)))) {
      toast.error('Kiekvienai eilutei nurodykite pavadinimą, kiekį ir kainą');
      return;
    }
    if (meta.dueDate < meta.issueDate) {
      toast.error('Apmokėjimo terminas negali būti ankstesnis už išrašymo datą');
      return;
    }

    onSubmit({
      isAdvance: meta.isAdvance,
      issueDate: meta.issueDate,
      dueDate: meta.dueDate,
      buyer: {
        name: buyer.name.trim(),
        companyCode: buyer.companyCode?.trim() || null,
        vatCode: buyer.vatCode?.trim() || null,
        address: buyer.address.trim(),
      },
      lines: lines.map((l) => ({
        description: l.description.trim(),
        unit: l.unit,
        quantity: parseNumber(l.quantity),
        unitPrice: parseNumber(l.unitPrice),
      })),
      vatRate: parseNumber(meta.vatRate) || 0,
      notes: meta.notes.trim() || null,
      issuedBy: meta.issuedBy.trim() || null,
      receivedBy: meta.receivedBy.trim() || null,
    }, issue);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <Section title="Pardavėjas">
        <div className="text-sm space-y-1">
          <p className="font-medium text-foreground">{profile.name}</p>
          <p className="text-muted-foreground">
            {profile.type === 'Individual' ? 'Individualios veiklos nr.' : 'Įmonės kodas'}: {profile.code}
            {profile.vatCode && ` · PVM kodas: ${profile.vatCode}`}
          </p>
          <p className="text-muted-foreground">{profile.address}</p>
          {profile.bankAccount && <p className="text-muted-foreground">{profile.bankAccount} {profile.bankName}</p>}
          <p className="text-xs text-muted-foreground pt-2">
            Pardavėjo duomenys imami iš profilio (Nustatymai). Numeris {profile.invoiceSeries} serijoje suteikiamas išrašant.
          </p>
        </div>
      </Section>

      <Section title="Pirkėjas">
        {companies.length > 0 && (
          <div className="mb-4">
            <Label>Pasirinkti iš įmonių sąrašo</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger className="mt-2">
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Pasirinkite įmonę..." />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="buyerName">Pavadinimas *</Label>
            <Input id="buyerName" value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
              placeholder='UAB „Įmonės pavadinimas"' />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buyerCode">Įmonės kodas</Label>
            <Input id="buyerCode" value={buyer.companyCode ?? ''}
              onChange={(e) => setBuyer({ ...buyer, companyCode: e.target.value })} placeholder="123456789" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buyerVat">PVM kodas</Label>
            <Input id="buyerVat" value={buyer.vatCode ?? ''}
              onChange={(e) => setBuyer({ ...buyer, vatCode: e.target.value })} placeholder="LT123456789" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="buyerAddress">Adresas *</Label>
            <Input id="buyerAddress" value={buyer.address}
              onChange={(e) => setBuyer({ ...buyer, address: e.target.value })} placeholder="Gatvė 15, Miestas" />
          </div>
        </div>
      </Section>

      <Section title="Sąskaitos informacija">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="issueDate">Išrašymo data</Label>
            <Input id="issueDate" type="date" value={meta.issueDate}
              onChange={(e) => setMeta({ ...meta, issueDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Apmokėti iki</Label>
            <Input id="dueDate" type="date" value={meta.dueDate}
              onChange={(e) => setMeta({ ...meta, dueDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vatRate">PVM tarifas, %</Label>
            <Input id="vatRate" inputMode="decimal" value={meta.vatRate}
              onChange={(e) => setMeta({ ...meta, vatRate: e.target.value })} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Switch id="isAdvance" checked={meta.isAdvance} onCheckedChange={(v) => setMeta({ ...meta, isAdvance: v })} />
          <Label htmlFor="isAdvance" className="cursor-pointer">Išankstinė sąskaita faktūra</Label>
        </div>
      </Section>

      <Section title="Prekės / paslaugos">
        <div className="space-y-4">
          <div className="hidden sm:grid sm:grid-cols-12 gap-4 text-sm font-medium text-muted-foreground px-1">
            <div className="col-span-4">Pavadinimas</div>
            <div className="col-span-2">Matas</div>
            <div className="col-span-1">Kiekis</div>
            <div className="col-span-2">Kaina, €</div>
            <div className="col-span-2">Suma</div>
            <div className="col-span-1" />
          </div>
          {lines.map((line) => (
            <div key={line.key} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              <Input className="sm:col-span-4" value={line.description} placeholder="Paslaugos aprašymas"
                onChange={(e) => updateLine(line.key, { description: e.target.value })} />
              <div className="sm:col-span-2">
                <Select value={line.unit} onValueChange={(unit: UnitOfMeasure) => updateLine(line.key, { unit })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(UNIT_LABELS) as UnitOfMeasure[]).map((unit) => (
                      <SelectItem key={unit} value={unit}>{UNIT_LABELS[unit]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input className="sm:col-span-1" inputMode="decimal" value={line.quantity} aria-label="Kiekis"
                onChange={(e) => updateLine(line.key, { quantity: e.target.value })} />
              <Input className="sm:col-span-2" inputMode="decimal" value={line.unitPrice} placeholder="0,00" aria-label="Kaina"
                onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })} />
              <Input className="sm:col-span-2 bg-muted" value={formatCurrency(lineTotal(line))} disabled aria-label="Suma" />
              <div className="sm:col-span-1 flex justify-end">
                <Button variant="ghost" size="icon" aria-label="Pašalinti eilutę" disabled={lines.length === 1}
                  onClick={() => setLines(lines.filter((l) => l.key !== line.key))}
                  className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={() => setLines([...lines, newLine()])} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Pridėti eilutę
          </Button>
        </div>

        <div className="mt-6 border-t border-border pt-6 flex flex-col items-end space-y-1">
          {vat > 0 && (
            <>
              <p className="text-sm text-muted-foreground">Suma be PVM: {formatCurrency(subtotal)}</p>
              <p className="text-sm text-muted-foreground">PVM: {formatCurrency(vat)}</p>
            </>
          )}
          <p className="text-lg">
            <span className="font-semibold">Iš viso: </span>
            <span className="font-bold text-primary">{formatCurrency(total)}</span>
          </p>
        </div>
      </Section>

      <Section title="Kita informacija">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="issuedBy">Išrašė</Label>
            <Input id="issuedBy" value={meta.issuedBy} placeholder="Vardas Pavardė"
              onChange={(e) => setMeta({ ...meta, issuedBy: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receivedBy">Gavo</Label>
            <Input id="receivedBy" value={meta.receivedBy} placeholder="Pareigos, vardas, pavardė"
              onChange={(e) => setMeta({ ...meta, receivedBy: e.target.value })} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Pastabos</Label>
            <Textarea id="notes" value={meta.notes} rows={3} placeholder="Papildomos pastabos..."
              onChange={(e) => setMeta({ ...meta, notes: e.target.value })} />
          </div>
        </div>
      </Section>

      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
        <Button variant="outline" onClick={() => navigate(-1)} disabled={submitting}>
          Atšaukti
        </Button>
        <Button variant="secondary" onClick={() => handleSubmit(false)} disabled={submitting}>
          <Save className="h-4 w-4 mr-2" />
          Išsaugoti juodraštį
        </Button>
        {canIssue && (
          <Button onClick={() => handleSubmit(true)} disabled={submitting}>
            <Send className="h-4 w-4 mr-2" />
            Išsaugoti ir išrašyti
          </Button>
        )}
      </div>
    </div>
  );
}
