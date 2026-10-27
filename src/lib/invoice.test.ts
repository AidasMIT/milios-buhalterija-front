import { describe, expect, it } from 'vitest';
import { displayStatus, invoiceTitle } from './invoice';

describe('displayStatus', () => {
  it('shows overdue for a sent invoice past its due date', () => {
    expect(displayStatus({ status: 'Sent', isOverdue: true })).toBe('overdue');
    expect(displayStatus({ status: 'Sent', isOverdue: false })).toBe('sent');
    expect(displayStatus({ status: 'Draft', isOverdue: false })).toBe('draft');
    expect(displayStatus({ status: 'Paid', isOverdue: false })).toBe('paid');
  });
});

describe('invoiceTitle', () => {
  it('uses the number once issued and marks drafts', () => {
    expect(invoiceTitle({ series: 'AM', number: '26/07' })).toBe('AM 26/07');
    expect(invoiceTitle({ series: 'AM', number: null })).toBe('Juodraštis (AM)');
  });
});
