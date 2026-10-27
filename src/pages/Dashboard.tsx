import { FileText, Euro, Clock, CheckCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentInvoices } from '@/components/dashboard/RecentInvoices';
import { useActiveProfile } from '@/context/ActiveProfile';
import { useInvoices, useInvoiceSummary } from '@/hooks/use-invoices';
import { formatCurrency } from '@/lib/format';

export default function Dashboard() {
  const { activeProfile } = useActiveProfile();
  const year = new Date().getFullYear();
  const { data: summary } = useInvoiceSummary(year, activeProfile?.id);
  const { data: recent } = useInvoices({ profileId: activeProfile?.id, pageSize: 5 }, !!activeProfile);
  const { data: overdue } = useInvoices({ profileId: activeProfile?.id, overdue: true, pageSize: 1 }, !!activeProfile);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sveiki atvykę!</h1>
          <p className="text-muted-foreground mt-1">
            {activeProfile ? `${activeProfile.name} – ${year} m. apžvalga` : 'Pirmiausia sukurkite verslo profilį nustatymuose.'}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Išrašyta"
            value={formatCurrency(summary?.issuedTotal ?? 0)}
            description={`${summary?.issuedCount ?? 0} sąskaitos šiais metais`}
            icon={<Euro className="h-6 w-6" />}
          />
          <StatCard
            title="Apmokėta"
            value={formatCurrency(summary?.paidTotal ?? 0)}
            description="Šiais metais"
            icon={<CheckCircle className="h-6 w-6" />}
          />
          <StatCard
            title="Laukiama apmokėjimo"
            value={formatCurrency(summary?.unpaidTotal ?? 0)}
            description="Išsiųstos, dar neapmokėtos"
            icon={<Clock className="h-6 w-6" />}
          />
          <StatCard
            title="Vėluojančios"
            value={String(overdue?.totalCount ?? 0)}
            description={`Suma ${formatCurrency(summary?.overdueTotal ?? 0)}`}
            icon={<FileText className="h-6 w-6" />}
            className={overdue?.totalCount ? 'border-l-4 border-l-destructive' : ''}
          />
        </div>

        <RecentInvoices invoices={recent?.items ?? []} />
      </div>
    </MainLayout>
  );
}
