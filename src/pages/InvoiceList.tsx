import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { InvoiceQuery } from '@/api/types';
import { MainLayout } from '@/components/layout/MainLayout';
import { InvoiceTable } from '@/components/invoices/InvoiceTable';
import { InvoiceFilters, type StatusFilter } from '@/components/invoices/InvoiceFilters';
import { Button } from '@/components/ui/button';
import { useActiveProfile } from '@/context/ActiveProfile';
import { useCan } from '@/hooks/use-auth';
import { useDebounced } from '@/hooks/use-debounced';
import { useDeleteInvoice, useInvoices, useIssueInvoice } from '@/hooks/use-invoices';
import { errorMessage, toastError } from '@/lib/errors';

const PAGE_SIZE = 25;

/** UI status filter → API query ("overdue" is a sent invoice past its due date). */
const STATUS_QUERY: Record<StatusFilter, Partial<InvoiceQuery>> = {
  all: {},
  draft: { status: 'Draft' },
  sent: { status: 'Sent', overdue: false },
  overdue: { overdue: true },
  paid: { status: 'Paid' },
};

export default function InvoiceList() {
  const { activeProfile } = useActiveProfile();
  const can = useCan();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounced(search.trim());

  const query: InvoiceQuery = {
    profileId: activeProfile?.id,
    search: debouncedSearch || undefined,
    ...STATUS_QUERY[statusFilter],
    page,
    pageSize: PAGE_SIZE,
  };
  const { data, isLoading } = useInvoices(query, !!activeProfile);
  const deleteInvoice = useDeleteInvoice();
  const issueInvoice = useIssueInvoice();

  const profileId = activeProfile?.id;
  const canManage = can('invoices.manage', profileId);
  const canIssue = can('invoices.issue', profileId);
  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  const handleDelete = async (ids: string[]) => {
    const results = await Promise.allSettled(ids.map((id) => deleteInvoice.mutateAsync(id)));
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failed.length === 0) toast.success(ids.length === 1 ? 'Juodraštis ištrintas' : `Ištrinta: ${ids.length}`);
    else toast.error(`Nepavyko ištrinti ${failed.length}: ${errorMessage(failed[0].reason)}`);
  };

  const handleIssue = (id: string) =>
    issueInvoice.mutate(id, { onSuccess: () => toast.success('Sąskaita išrašyta'), onError: toastError });

  const changeFilter = (update: () => void) => {
    update();
    setPage(1);
  };

  const filtered = !!debouncedSearch || statusFilter !== 'all';

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sąskaitos</h1>
            <p className="text-muted-foreground mt-1">
              {activeProfile ? `${activeProfile.name} (${data?.totalCount ?? 0})` : 'Nėra pasirinkto profilio'}
            </p>
          </div>
          {canManage && (
            <Button asChild>
              <Link to="/invoices/new">
                <Plus className="h-4 w-4 mr-2" />
                Nauja sąskaita
              </Link>
            </Button>
          )}
        </div>

        <InvoiceFilters
          searchQuery={search}
          onSearchChange={(value) => changeFilter(() => setSearch(value))}
          statusFilter={statusFilter}
          onStatusChange={(value) => changeFilter(() => setStatusFilter(value))}
        />

        {isLoading ? (
          <p className="text-muted-foreground">Kraunama…</p>
        ) : data && data.items.length > 0 ? (
          <>
            <InvoiceTable
              invoices={data.items}
              canManage={canManage}
              canIssue={canIssue}
              onDelete={handleDelete}
              onIssue={handleIssue}
            />
            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Ankstesnis
                </Button>
                <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Kitas
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl bg-card p-12 shadow-card text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Sąskaitų nerasta</h3>
            <p className="text-muted-foreground mb-4">
              {filtered ? 'Pabandykite pakeisti paieškos kriterijus' : 'Pradėkite kurdami pirmąją sąskaitą'}
            </p>
            {!filtered && canManage && (
              <Button asChild>
                <Link to="/invoices/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Kurti sąskaitą
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
