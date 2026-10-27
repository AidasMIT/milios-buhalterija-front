import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Send, Download, Trash2, Undo2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { invoicesApi } from '@/api/endpoints';
import { MainLayout } from '@/components/layout/MainLayout';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCan } from '@/hooks/use-auth';
import { useDeleteInvoice, useInvoice, useIssueInvoice, useMarkPaid, useMarkUnpaid } from '@/hooks/use-invoices';
import { saveBlob } from '@/lib/download';
import { errorMessage, toastError } from '@/lib/errors';
import { formatCurrency, formatDateShort } from '@/lib/format';
import { displayStatus, invoiceTitle, STATUS_BADGES, STATUS_LABELS, UNIT_LABELS } from '@/lib/invoice';

function Line({ label, value }: { label: string; value?: string | null }) {
  return value ? <p className="text-muted-foreground">{label}: {value}</p> : null;
}

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const can = useCan();
  const { data: invoice, isLoading, error } = useInvoice(id);
  const issue = useIssueInvoice();
  const markPaid = useMarkPaid();
  const markUnpaid = useMarkUnpaid();
  const remove = useDeleteInvoice();
  const [downloading, setDownloading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!invoice) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          {isLoading ? (
            <p className="text-muted-foreground">Kraunama…</p>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2">Sąskaita nerasta</h2>
              <p className="text-muted-foreground mb-4">{error ? errorMessage(error) : 'Tokios sąskaitos nėra'}</p>
              <Button asChild><Link to="/invoices">Grįžti į sąrašą</Link></Button>
            </>
          )}
        </div>
      </MainLayout>
    );
  }

  const status = displayStatus(invoice);
  const isDraft = invoice.status === 'Draft';
  const canManage = can('invoices.manage', invoice.profileId);
  const canIssue = can('invoices.issue', invoice.profileId);
  const busy = issue.isPending || markPaid.isPending || markUnpaid.isPending || remove.isPending;

  const handlePdf = async () => {
    setDownloading(true);
    try {
      const { blob, fileName } = await invoicesApi.pdf(invoice.id);
      saveBlob(blob, fileName);
    } catch (e) {
      toastError(e);
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = () =>
    remove.mutate(invoice.id, {
      onSuccess: () => {
        toast.success('Juodraštis ištrintas');
        navigate('/invoices');
      },
      onError: toastError,
    });

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild aria-label="Atgal">
              <Link to="/invoices"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{invoiceTitle(invoice)}</h1>
                <Badge variant={STATUS_BADGES[status]}>{STATUS_LABELS[status]}</Badge>
              </div>
              <p className="text-muted-foreground">{invoice.buyer.name}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handlePdf} disabled={downloading}>
              <Download className="h-4 w-4 mr-2" />
              {downloading ? 'Generuojama…' : 'PDF'}
            </Button>
            {isDraft && canIssue && (
              <Button disabled={busy} onClick={() => issue.mutate(invoice.id, {
                onSuccess: () => toast.success('Sąskaita išrašyta'), onError: toastError })}>
                <Send className="h-4 w-4 mr-2" />
                Išrašyti
              </Button>
            )}
            {invoice.status === 'Sent' && canIssue && (
              <Button variant="success" disabled={busy} onClick={() => markPaid.mutate(
                { id: invoice.id, version: invoice.version },
                { onSuccess: () => toast.success('Pažymėta kaip apmokėta'), onError: toastError })}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Apmokėta
              </Button>
            )}
            {invoice.status === 'Paid' && canIssue && (
              <Button variant="outline" disabled={busy} onClick={() => markUnpaid.mutate(
                { id: invoice.id, version: invoice.version },
                { onSuccess: () => toast.success('Apmokėjimas atšauktas'), onError: toastError })}>
                <Undo2 className="h-4 w-4 mr-2" />
                Atšaukti apmokėjimą
              </Button>
            )}
            {isDraft && canManage && (
              <>
                <Button variant="outline" asChild>
                  <Link to={`/invoices/${invoice.id}/edit`}><Edit className="h-4 w-4 mr-2" />Redaguoti</Link>
                </Button>
                <Button variant="ghost" size="icon" aria-label="Ištrinti" disabled={busy} onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-card shadow-card p-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-center mb-2">
            {invoice.isAdvance ? 'Išankstinė sąskaita faktūra' : 'Sąskaita faktūra'}
          </h2>
          <p className="text-center text-muted-foreground mb-1">
            {invoice.fullNumber ?? 'Juodraštis – numeris bus suteiktas išrašant'}
          </p>
          <p className="text-center text-muted-foreground mb-8">Data: {formatDateShort(invoice.issueDate)}</p>

          <div className="grid gap-8 sm:grid-cols-2 mb-8 pb-8 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-muted-foreground mb-3">Pardavėjas</h3>
              <p className="font-semibold text-foreground">{invoice.seller.name}</p>
              <Line label="Įmonės kodas" value={invoice.seller.companyCode} />
              <Line label="Individualios veiklos nr." value={invoice.seller.activityNumber} />
              <Line label="PVM kodas" value={invoice.seller.vatCode} />
              <Line label="Adresas" value={invoice.seller.address} />
              <Line label="Banko sąskaita" value={invoice.seller.bankAccount} />
              <Line label="Bankas" value={invoice.seller.bankName} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-muted-foreground mb-3">Pirkėjas</h3>
              <p className="font-semibold text-foreground">{invoice.buyer.name}</p>
              <Line label="Įmonės kodas" value={invoice.buyer.companyCode} />
              <Line label="PVM kodas" value={invoice.buyer.vatCode} />
              <Line label="Adresas" value={invoice.buyer.address} />
            </div>
          </div>

          <table className="w-full mb-8">
            <thead>
              <tr className="border-b border-border text-sm text-muted-foreground">
                <th className="text-left py-3 font-medium">Nr.</th>
                <th className="text-left py-3 font-medium">Prekės / paslaugos pavadinimas</th>
                <th className="text-center py-3 font-medium">Matas</th>
                <th className="text-right py-3 font-medium">Kiekis</th>
                <th className="text-right py-3 font-medium">Kaina</th>
                <th className="text-right py-3 font-medium">Suma</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line, index) => (
                <tr key={index} className="border-b border-border">
                  <td className="py-4">{index + 1}.</td>
                  <td className="py-4">{line.description}</td>
                  <td className="py-4 text-center">{UNIT_LABELS[line.unit]}</td>
                  <td className="py-4 text-right">{line.quantity.toLocaleString('lt-LT')}</td>
                  <td className="py-4 text-right">{formatCurrency(line.unitPrice)}</td>
                  <td className="py-4 text-right font-medium">{formatCurrency(line.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-6">
            <div className="w-full max-w-sm space-y-2">
              {invoice.vatAmount > 0 && (
                <>
                  <div className="flex justify-between"><span>Suma be PVM:</span><span>{formatCurrency(invoice.subtotal)}</span></div>
                  <div className="flex justify-between"><span>PVM {invoice.vatRate} %:</span><span>{formatCurrency(invoice.vatAmount)}</span></div>
                </>
              )}
              <div className="flex justify-between text-lg pt-2 border-t border-border">
                <span className="font-semibold">Iš viso:</span>
                <span className="font-bold text-primary">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <span className="font-medium">Suma žodžiais: </span>
            {invoice.totalInWords}
          </div>

          <div className="space-y-1 text-muted-foreground mb-8">
            <p>Apmokėti iki: {formatDateShort(invoice.dueDate)}</p>
            {invoice.paidOn && <p>Apmokėta: {formatDateShort(invoice.paidOn)}</p>}
            {invoice.notes && <p>Pastabos: {invoice.notes}</p>}
          </div>

          <div className="grid gap-8 sm:grid-cols-2 pt-8 border-t border-border">
            <div>
              <p className="text-muted-foreground mb-2">Išrašė:</p>
              <p className="font-medium text-foreground">{invoice.issuedBy ?? '________________________'}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-2">Gavo:</p>
              <p className="font-medium text-foreground">{invoice.receivedBy ?? '________________________'}</p>
              <p className="text-xs text-muted-foreground mt-1">(pareigos, vardas, pavardė)</p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Ištrinti juodraštį?"
        description="Šis veiksmas negrįžtamas."
        confirmLabel="Ištrinti"
        onConfirm={handleDelete}
      />
    </MainLayout>
  );
}
