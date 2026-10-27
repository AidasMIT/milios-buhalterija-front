import { useState } from 'react';
import { Euro, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActiveProfile } from '@/context/ActiveProfile';
import { useInvoiceSummary } from '@/hooks/use-invoices';
import { formatCurrency } from '@/lib/format';

const MONTH_NAMES_LT = ['Sau', 'Vas', 'Kov', 'Bal', 'Geg', 'Bir', 'Lie', 'Rgp', 'Rgs', 'Spa', 'Lap', 'Gru'];
const tooltipStyle = { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 };

/** Issued invoices of one year, aggregated by the API (drafts are not income). */
export default function Statistics() {
  const { activeProfile } = useActiveProfile();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data: summary } = useInvoiceSummary(year, activeProfile?.id);

  const monthly = (summary?.months ?? []).map((m) => ({
    label: MONTH_NAMES_LT[m.month - 1],
    paid: m.paid,
    unpaid: m.issued - m.paid,
  }));
  const statusData = summary
    ? [
        { name: 'Apmokėta', value: summary.paidTotal, color: 'hsl(var(--success))' },
        { name: 'Laukiama', value: summary.unpaidTotal - summary.overdueTotal, color: 'hsl(var(--primary))' },
        { name: 'Vėluoja', value: summary.overdueTotal, color: 'hsl(var(--destructive))' },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Statistika</h1>
            <p className="text-muted-foreground mt-1">{activeProfile?.name ?? 'Nėra pasirinkto profilio'}</p>
          </div>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                <SelectItem key={y} value={String(y)}>{y} m.</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Išrašyta" value={formatCurrency(summary?.issuedTotal ?? 0)}
            description={`${summary?.issuedCount ?? 0} sąskaitos`} icon={<Euro className="h-6 w-6" />} />
          <StatCard title="Apmokėta" value={formatCurrency(summary?.paidTotal ?? 0)}
            description={summary?.issuedTotal ? `${Math.round((summary.paidTotal / summary.issuedTotal) * 100)}% išrašytos sumos` : '—'}
            icon={<CheckCircle className="h-6 w-6" />} />
          <StatCard title="Neapmokėta" value={formatCurrency(summary?.unpaidTotal ?? 0)}
            description="Įskaitant vėluojančias" icon={<Clock className="h-6 w-6" />} />
          <StatCard title="Vėluoja" value={formatCurrency(summary?.overdueTotal ?? 0)} description="Praėjęs terminas"
            icon={<AlertTriangle className="h-6 w-6" />}
            className={summary?.overdueTotal ? 'border-l-4 border-l-destructive' : ''} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Išrašyta pagal mėnesius</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${Math.round(v)} €`} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="paid" name="Apmokėta" stackId="a" fill="hsl(var(--primary))" />
                    <Bar dataKey="unpaid" name="Neapmokėta" stackId="a" fill="hsl(var(--muted-foreground))" fillOpacity={0.5}
                      radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Būsenų pasiskirstymas</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[340px] w-full">
                {statusData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-muted-foreground">Nėra duomenų</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        innerRadius={60} outerRadius={110} paddingAngle={3}>
                        {statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
