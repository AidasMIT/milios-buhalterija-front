/**
 * Thin fetch wrapper for the .NET API.
 *
 * The session lives in an HttpOnly cookie set by POST /api/auth/login, so requests only need
 * `credentials: 'include'`; no token is ever handled by JavaScript. Every failure is RFC 9457
 * ProblemDetails with a stable `code` (e.g. "invoice.not_editable") that the UI can switch on.
 */

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export interface ProblemDetails {
  status?: number;
  title?: string;
  detail?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly errors?: Record<string, string[]>;

  constructor(status: number, problem: ProblemDetails) {
    super(problem.detail ?? problem.title ?? `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.code = problem.code;
    this.errors = problem.errors;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

function buildUrl(path: string, query?: Query): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  const search = params.toString();
  return `${API_URL}${path}${search ? `?${search}` : ''}`;
}

async function send(method: string, path: string, body?: unknown, query?: Query): Promise<Response> {
  const response = await fetch(buildUrl(path, query), {
    method,
    credentials: 'include',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const problem: ProblemDetails = await response.json().catch(() => ({}));
    throw new ApiError(response.status, problem);
  }
  return response;
}

async function json<T>(response: Response): Promise<T> {
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

export const api = {
  get: async <T>(path: string, query?: Query) => json<T>(await send('GET', path, undefined, query)),
  post: async <T = void>(path: string, body?: unknown) => json<T>(await send('POST', path, body ?? {})),
  put: async <T = void>(path: string, body: unknown) => json<T>(await send('PUT', path, body)),
  delete: async (path: string, query?: Query) => {
    await send('DELETE', path, undefined, query);
  },
  /** Binary download (PDF). Returns the blob and the server-suggested file name. */
  file: async (path: string) => {
    const response = await send('GET', path);
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    return { blob: await response.blob(), fileName: match ? decodeURIComponent(match[1]) : 'file' };
  },
};
