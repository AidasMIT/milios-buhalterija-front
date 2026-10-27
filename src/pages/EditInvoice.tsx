import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { InvoiceContent } from '@/api/types';
import { MainLayout } from '@/components/layout/MainLayout';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks/use-auth';
import { useInvoice, useIssueInvoice, useUpdateInvoice } from '@/hooks/use-invoices';
import { useProfile } from '@/hooks/use-profiles';
import { errorMessage, toastError } from '@/lib/errors';

/** Only drafts are editable; an issued invoice is a final document (the API enforces it as well). */
export default function EditInvoice() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const can = useCan();
  const { data: invoice, isLoading, error } = useInvoice(id);
  const { data: profile } = useProfile(invoice?.profileId);
  const update = useUpdateInvoice();
  const issue = useIssueInvoice();

  const handleSubmit = (content: InvoiceContent, issueNow: boolean) => {
    if (!invoice) return;
    update.mutate({ id: invoice.id, invoice: content, version: invoice.version }, {
      onError: toastError,
      onSuccess: () => {
        if (!issueNow) {
          toast.success('Juodraštis atnaujintas');
          navigate(`/invoices/${invoice.id}`);
          return;
        }
        issue.mutate(invoice.id, {
          onSuccess: () => toast.success('Sąskaita išrašyta'),
          onError: (e) => toast.error(`Pakeitimai išsaugoti, bet sąskaita neišrašyta: ${errorMessage(e)}`),
          onSettled: () => navigate(`/invoices/${invoice.id}`),
        });
      },
    });
  };

  let body;
  if (isLoading) body = <p className="text-muted-foreground">Kraunama…</p>;
  else if (!invoice) body = <p className="text-muted-foreground">{error ? errorMessage(error) : 'Sąskaita nerasta.'}</p>;
  else if (invoice.status !== 'Draft') body = <p className="text-muted-foreground">Išrašytos sąskaitos redaguoti negalima.</p>;
  else if (!can('invoices.manage', invoice.profileId)) body = <p className="text-muted-foreground">Neturite teisės redaguoti.</p>;
  else if (!profile) body = <p className="text-muted-foreground">Kraunama…</p>;
  else
    body = (
      <InvoiceForm
        key={invoice.id}
        profile={profile}
        invoice={invoice}
        canIssue={can('invoices.issue', invoice.profileId)}
        submitting={update.isPending || issue.isPending}
        onSubmit={handleSubmit}
      />
    );

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild aria-label="Atgal">
            <Link to={id ? `/invoices/${id}` : '/invoices'}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Redaguoti juodraštį</h1>
        </div>
        {body}
      </div>
    </MainLayout>
  );
}
