import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { InvoiceContent } from '@/api/types';
import { MainLayout } from '@/components/layout/MainLayout';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { useActiveProfile } from '@/context/ActiveProfile';
import { useCan } from '@/hooks/use-auth';
import { useCreateInvoice, useIssueInvoice } from '@/hooks/use-invoices';
import { useProfile } from '@/hooks/use-profiles';
import { errorMessage, toastError } from '@/lib/errors';

export default function NewInvoice() {
  const navigate = useNavigate();
  const can = useCan();
  const { activeProfile } = useActiveProfile();
  const { data: profile } = useProfile(activeProfile?.id);
  const create = useCreateInvoice();
  const issue = useIssueInvoice();

  const handleSubmit = (invoice: InvoiceContent, issueNow: boolean) => {
    if (!profile) return;
    create.mutate({ profileId: profile.id, invoice }, {
      onError: toastError,
      onSuccess: (id) => {
        if (!issueNow) {
          toast.success('Juodraštis išsaugotas');
          navigate(`/invoices/${id}`);
          return;
        }
        issue.mutate(id, {
          onSuccess: () => toast.success('Sąskaita išrašyta'),
          onError: (error) => toast.error(`Juodraštis išsaugotas, bet neišrašytas: ${errorMessage(error)}`),
          onSettled: () => navigate(`/invoices/${id}`),
        });
      },
    });
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Nauja sąskaita</h1>
          <p className="text-muted-foreground mt-1">{activeProfile?.name}</p>
        </div>
        {!activeProfile ? (
          <p className="text-muted-foreground">Pirmiausia sukurkite verslo profilį nustatymuose.</p>
        ) : !can('invoices.manage', activeProfile.id) ? (
          <p className="text-muted-foreground">Neturite teisės kurti sąskaitų šiame profilyje.</p>
        ) : profile ? (
          <InvoiceForm
            profile={profile}
            canIssue={can('invoices.issue', profile.id)}
            submitting={create.isPending || issue.isPending}
            onSubmit={handleSubmit}
          />
        ) : (
          <p className="text-muted-foreground">Kraunama…</p>
        )}
      </div>
    </MainLayout>
  );
}
