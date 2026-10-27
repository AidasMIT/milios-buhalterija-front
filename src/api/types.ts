/** Contracts of the .NET API (PaymentPal.Application DTOs). Enums travel as their names. */

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

// ---- Auth ----

export interface PermissionGrant {
  permission: string;
  allProfiles: boolean;
  profileIds: string[];
}

export interface MyAccess {
  userId: string;
  email: string | null;
  permissions: PermissionGrant[];
}

// ---- Profiles ----

export type BusinessType = 'Individual' | 'Company';

export interface ProfileData {
  type: BusinessType;
  name: string;
  code: string;
  vatCode?: string | null;
  address: string;
  bankAccount?: string | null;
  bankName?: string | null;
  email?: string | null;
  phone?: string | null;
  invoiceSeries: string;
}

export interface ProfileListItem {
  id: string;
  type: BusinessType;
  name: string;
  code: string;
  invoiceSeries: string;
  version: number;
}

export interface ProfileDetails extends ProfileData {
  id: string;
  lastInvoiceSequence: number;
  createdAt: string;
  version: number;
}

// ---- Companies ----

export interface CompanyData {
  name: string;
  code: string;
  vatCode?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface CompanyListItem {
  id: string;
  name: string;
  code: string;
  vatCode: string | null;
  email: string | null;
  version: number;
}

export interface CompanyDetails extends CompanyData {
  id: string;
  createdAt: string;
  version: number;
}

// ---- Invoices ----

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid';
export type UnitOfMeasure = 'Piece' | 'Month' | 'Hour' | 'Page' | 'Set';

export interface Buyer {
  name: string;
  companyCode?: string | null;
  vatCode?: string | null;
  address: string;
}

export interface Seller {
  name: string;
  activityNumber: string | null;
  companyCode: string | null;
  vatCode: string | null;
  address: string;
  bankAccount: string | null;
  bankName: string | null;
}

export interface InvoiceLineInput {
  description: string;
  unit: UnitOfMeasure;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceLine extends InvoiceLineInput {
  total: number;
}

/** What the user writes; seller, number and totals are decided by the server. */
export interface InvoiceContent {
  isAdvance: boolean;
  issueDate: string; // yyyy-MM-dd
  dueDate: string;
  buyer: Buyer;
  lines: InvoiceLineInput[];
  vatRate: number;
  notes?: string | null;
  issuedBy?: string | null;
  receivedBy?: string | null;
}

export interface InvoiceListItem {
  id: string;
  profileId: string;
  series: string;
  number: string | null;
  status: InvoiceStatus;
  isOverdue: boolean;
  isAdvance: boolean;
  issueDate: string;
  dueDate: string;
  buyerName: string;
  total: number;
  version: number;
}

export interface InvoiceDetails {
  id: string;
  profileId: string;
  series: string;
  number: string | null;
  fullNumber: string | null;
  status: InvoiceStatus;
  isOverdue: boolean;
  isAdvance: boolean;
  issueDate: string;
  dueDate: string;
  seller: Seller;
  buyer: Buyer;
  lines: InvoiceLine[];
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
  totalInWords: string;
  notes: string | null;
  issuedBy: string | null;
  receivedBy: string | null;
  issuedAt: string | null;
  paidOn: string | null;
  createdAt: string;
  version: number;
}

export interface InvoiceQuery {
  profileId?: string;
  status?: InvoiceStatus;
  overdue?: boolean;
  search?: string;
  issuedFrom?: string;
  issuedTo?: string;
  page?: number;
  pageSize?: number;
}

export interface MonthSummary {
  month: number;
  count: number;
  issued: number;
  paid: number;
  overdue: number;
}

export interface InvoiceSummary {
  year: number;
  issuedCount: number;
  issuedTotal: number;
  paidTotal: number;
  unpaidTotal: number;
  overdueTotal: number;
  months: MonthSummary[];
}
