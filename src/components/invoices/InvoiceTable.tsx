import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Send, MoreHorizontal, Trash2, Edit, Download, Archive } from 'lucide-react';
import { toast } from 'sonner';
import type { InvoiceListItem } from '@/api/types';
import { invoicesApi } from '@/api/endpoints';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { saveBlob } from '@/lib/download';
import { errorMessage } from '@/lib/errors';
import { formatCurrency, formatDate, todayIso } from '@/lib/format';
import { displayStatus, invoiceTitle, STATUS_BADGES, STATUS_LABELS } from '@/lib/invoice';

interface InvoiceTableProps {
  invoices: InvoiceListItem[];
  canManage: boolean;
  canIssue: boolean;
  onDelete: (ids: string[]) => Promise<void>;
  onIssue: (id: string) => void;
}

function pluralInvoices(count: number): string {
  if (count % 10 === 1 && count % 100 !== 11) return 'sąskaita';
  if (count % 10 === 0 || (count % 100 >= 11 && count % 100 <= 19)) return 'sąskaitų';
  return 'sąskaitos';
}

export function InvoiceTable({ invoices, canManage, canIssue, onDelete, onIssue }: InvoiceTableProps) {
  const [toDelete, setToDelete] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const selected = invoices.filter((inv) => selectedIds.includes(inv.id));
  const allSelected = invoices.length > 0 && selected.length === invoices.length;
  const selectedDrafts = selected.filter((inv) => inv.status === 'Draft');

  const toggleAll = (checked: boolean) => setSelectedIds(checked ? invoices.map((inv) => inv.id) : []);
  const toggleOne = (id: string, checked: boolean) =>
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((i) => i !== id)));

  /** PDFs come from the API one by one; failures are counted, not fatal. */
  const downloadPdfs = async (asZip: boolean) => {
    const { default: JSZip } = await import('jszip'); // only needed here, keeps it out of the main bundle
    const zip = new JSZip();
    let failed = 0;
    setProgress({ current: 0, total: selected.length });
    try {
      for (const [index, invoice] of selected.entries()) {
        setProgress({ current: index + 1, total: selected.length });
        try {
          const { blob, fileName } = await invoicesApi.pdf(invoice.id);
          if (asZip) zip.file(fileName, blob);
          else saveBlob(blob, fileName);
        } catch {
          failed++;
        }
      }
      if (asZip) saveBlob(await zip.generateAsync({ type: 'blob' }), `Saskaitos_${todayIso()}.zip`);
      if (failed > 0) toast.error(`Nepavyko atsisiųsti ${failed} iš ${selected.length}`);
      else toast.success(`Atsisiųsta ${selected.length} ${pluralInvoices(selected.length)}`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setProgress(null);
    }
  };

  const confirmDelete = async () => {
    await onDelete(toDelete);
    setSelectedIds((prev) => prev.filter((id) => !toDelete.includes(id)));
    setToDelete([]);
  };

  return (
    <>
      {selected.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-4 animate-fade-in">
          <span className="text-sm text-muted-foreground">
            {progress ? (
              <>Atsisiunčiama: <strong>{progress.current}/{progress.total}</strong></>
            ) : (
              <>Pasirinkta: <strong>{selected.length}</strong> {pluralInvoices(selected.length)}</>
            )}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedIds([])} disabled={!!progress}>
              Atšaukti
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={!!progress}>
                  <Download className="h-4 w-4 mr-2" />
                  Atsisiųsti PDF
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={() => downloadPdfs(true)} className="flex items-center gap-2">
                  <Archive className="h-4 w-4" />
                  Kaip ZIP archyvą
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadPdfs(false)} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Po vieną
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {canManage && (
              <Button
                variant="destructive"
                size="sm"
                disabled={!!progress || selectedDrafts.length === 0}
                title={selectedDrafts.length < selected.length ? 'Ištrinami tik juodraščiai' : undefined}
                onClick={() => setToDelete(selectedDrafts.map((inv) => inv.id))}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Ištrinti juodraščius ({selectedDrafts.length})
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-card shadow-card overflow-hidden animate-fade-in">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[50px]">
                <Checkbox checked={allSelected} onCheckedChange={(v) => toggleAll(v === true)} aria-label="Pasirinkti visas" />
              </TableHead>
              <TableHead className="font-semibold">Sąskaita</TableHead>
              <TableHead className="font-semibold">Pirkėjas</TableHead>
              <TableHead className="font-semibold">Data</TableHead>
              <TableHead className="font-semibold">Mokėti iki</TableHead>
              <TableHead className="font-semibold">Suma</TableHead>
              <TableHead className="font-semibold">Būsena</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const status = displayStatus(invoice);
              const isDraft = invoice.status === 'Draft';
              return (
                <TableRow key={invoice.id} className="group" data-state={selectedIds.includes(invoice.id) ? 'selected' : undefined}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(invoice.id)}
                      onCheckedChange={(v) => toggleOne(invoice.id, v === true)}
                      aria-label={`Pasirinkti ${invoiceTitle(invoice)}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link to={`/invoices/${invoice.id}`} className="hover:text-primary transition-colors">
                      {invoiceTitle(invoice)}
                    </Link>
                    {invoice.isAdvance && <p className="text-xs text-muted-foreground">Išankstinė</p>}
                  </TableCell>
                  <TableCell className="font-medium">{invoice.buyerName}</TableCell>
                  <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(invoice.total)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGES[status]}>{STATUS_LABELS[status]}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Veiksmai"
                          className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem asChild>
                          <Link to={`/invoices/${invoice.id}`} className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Peržiūrėti
                          </Link>
                        </DropdownMenuItem>
                        {isDraft && canManage && (
                          <DropdownMenuItem asChild>
                            <Link to={`/invoices/${invoice.id}/edit`} className="flex items-center gap-2">
                              <Edit className="h-4 w-4" />
                              Redaguoti
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {isDraft && canIssue && (
                          <DropdownMenuItem onClick={() => onIssue(invoice.id)} className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            Išrašyti
                          </DropdownMenuItem>
                        )}
                        {isDraft && canManage && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setToDelete([invoice.id])}
                              className="flex items-center gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Ištrinti
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={toDelete.length > 0}
        onOpenChange={(open) => !open && setToDelete([])}
        title={toDelete.length === 1 ? 'Ištrinti juodraštį?' : `Ištrinti ${toDelete.length} juodraščius?`}
        description="Ištrinti galima tik juodraščius. Šis veiksmas negrįžtamas."
        confirmLabel="Ištrinti"
        onConfirm={confirmDelete}
      />
    </>
  );
}
