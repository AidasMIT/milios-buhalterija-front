import { api } from './client';
import type {
  CompanyData,
  CompanyDetails,
  CompanyListItem,
  InvoiceContent,
  InvoiceDetails,
  InvoiceListItem,
  InvoiceQuery,
  InvoiceSummary,
  MyAccess,
  PagedResult,
  ProfileData,
  ProfileDetails,
  ProfileListItem,
} from './types';

type Created = { id: string };

/** One function per API endpoint; components use them through the hooks in src/hooks. */
export const authApi = {
  login: (email: string, password: string, rememberMe: boolean) =>
    api.post('/api/auth/login', { email, password, rememberMe }),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get<MyAccess>('/api/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/api/auth/change-password', { currentPassword, newPassword }),
};

export const profilesApi = {
  list: () => api.get<PagedResult<ProfileListItem>>('/api/profiles', { pageSize: 100 }),
  get: (id: string) => api.get<ProfileDetails>(`/api/profiles/${id}`),
  create: (details: ProfileData, lastInvoiceSequence: number) =>
    api.post<Created>('/api/profiles', { details, lastInvoiceSequence }),
  update: (id: string, details: ProfileData, version: number) =>
    api.put(`/api/profiles/${id}`, { details, version }),
  archive: (id: string) => api.post(`/api/profiles/${id}/archive`),
};

export const companiesApi = {
  list: (search?: string) =>
    api.get<PagedResult<CompanyListItem>>('/api/companies', { search, pageSize: 100 }),
  get: (id: string) => api.get<CompanyDetails>(`/api/companies/${id}`),
  create: (company: CompanyData) => api.post<Created>('/api/companies', { company }),
  update: (id: string, company: CompanyData, version: number) =>
    api.put(`/api/companies/${id}`, { company, version }),
  archive: (id: string) => api.delete(`/api/companies/${id}`),
};

export const invoicesApi = {
  list: (query: InvoiceQuery) =>
    api.get<PagedResult<InvoiceListItem>>('/api/invoices', { ...query }),
  get: (id: string) => api.get<InvoiceDetails>(`/api/invoices/${id}`),
  summary: (year: number, profileId?: string) =>
    api.get<InvoiceSummary>('/api/invoices/summary', { year, profileId }),
  create: (profileId: string, invoice: InvoiceContent) =>
    api.post<Created>('/api/invoices', { profileId, invoice }),
  update: (id: string, invoice: InvoiceContent, version: number) =>
    api.put(`/api/invoices/${id}`, { invoice, version }),
  delete: (id: string) => api.delete(`/api/invoices/${id}`),
  issue: (id: string, version: number) => api.post(`/api/invoices/${id}/issue`, { version }),
  markPaid: (id: string, version: number, paidOn?: string) =>
    api.put(`/api/invoices/${id}/payment`, { paidOn: paidOn ?? null, version }),
  markUnpaid: (id: string, version: number) => api.delete(`/api/invoices/${id}/payment`, { version }),
  pdf: (id: string) => api.file(`/api/invoices/${id}/pdf`),
};
