import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './client';
import { errorMessage } from '@/lib/errors';

function respond(status: number, body?: unknown, headers: Record<string, string> = {}) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), { status, headers }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('api client', () => {
  it('sends the session cookie and JSON, and skips empty query values', async () => {
    const fetchMock = respond(200, { items: [] });

    await api.get('/api/invoices', { profileId: 'p1', search: '', status: undefined, page: 2 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/invoices?profileId=p1&page=2');
    expect(init.credentials).toBe('include');
  });

  it('turns ProblemDetails into ApiError with the stable code', async () => {
    respond(422, { status: 422, detail: 'Only drafts...', code: 'invoice.not_editable' });

    const error = await api.put('/api/invoices/1', {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('invoice.not_editable');
    expect(errorMessage(error)).toMatch(/tik su juodraščiais/);
  });

  it('shows the first field error for validation failures', async () => {
    respond(400, { code: 'validation.failed', errors: { 'Invoice.Lines': ["'Lines' must not be empty."] } });

    const error = await api.post('/api/invoices', {}).catch((e: unknown) => e);

    expect(errorMessage(error)).toBe("'Lines' must not be empty.");
  });

  it('returns undefined for 204 and reads the PDF file name', async () => {
    respond(204);
    expect(await api.post('/api/invoices/1/issue', { version: 1 })).toBeUndefined();

    respond(200, 'x', { 'Content-Disposition': 'attachment; filename=Saskaita_AM_26-07.pdf' });
    expect((await api.file('/api/invoices/1/pdf')).fileName).toBe('Saskaita_AM_26-07.pdf');
  });
});
