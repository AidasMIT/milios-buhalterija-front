import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { InvoiceListItem } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/format';
import { displayStatus, invoiceTitle, STATUS_BADGES, STATUS_LABELS } from '@/lib/invoice';

export function RecentInvoices({ invoices }: { invoices: InvoiceListItem[] }) {
  return (
    <div className="rounded-xl bg-card shadow-card animate-slide-up">
      <div className="flex items-center justify-between border-b border-border p-6">
        <h2 className="text-lg font-semibold text-foreground">Naujausios sąskaitos</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/invoices" className="gap-1">
            Visos sąskaitos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      {invoices.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">Sąskaitų dar nėra.</p>
      ) : (
        <div className="divide-y divide-border">
          {invoices.map((invoice) => {
            const status = displayStatus(invoice);
            return (
              <Link
                key={invoice.id}
                to={`/invoices/${invoice.id}`}
                className="flex items-center justify-between p-4 transition-colors hover:bg-secondary/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                    {invoice.buyerName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{invoice.buyerName}</p>
                    <p className="text-sm text-muted-foreground">{invoiceTitle(invoice)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(invoice.total)}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(invoice.dueDate)}</p>
                  </div>
                  <Badge variant={STATUS_BADGES[status]}>{STATUS_LABELS[status]}</Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
