import { lazy, Suspense } from 'react';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ApiError } from '@/api/client';
import { meKey } from '@/hooks/use-auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InvoiceList from './pages/InvoiceList';
import NewInvoice from './pages/NewInvoice';
import EditInvoice from './pages/EditInvoice';
import InvoiceDetail from './pages/InvoiceDetail';
import Companies from './pages/Companies';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Charts (recharts) are the heaviest dependency; load them only when the page is opened.
const Statistics = lazy(() => import('./pages/Statistics'));

/** A 401 anywhere means the session has expired: forget the user, ProtectedRoute then shows the login page. */
function onApiError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) queryClient.setQueryData(meKey, null);
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onApiError }),
  mutationCache: new MutationCache({ onError: onApiError }),
  defaultOptions: {
    queries: {
      // 4xx answers are final (not found, forbidden, invalid); only network/server failures are retried.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/invoices/new" element={<NewInvoice />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/invoices/:id/edit" element={<EditInvoice />} />
            <Route path="/companies" element={<Companies />} />
            <Route
              path="/statistics"
              element={<Suspense fallback={<p className="p-8 text-muted-foreground">Kraunama…</p>}><Statistics /></Suspense>}
            />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
