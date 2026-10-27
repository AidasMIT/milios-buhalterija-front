import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ActiveProfileProvider } from '@/context/ActiveProfile';
import { useMe } from '@/hooks/use-auth';

/** Everything behind it needs a session; the profiles are loaded only for signed-in users. */
export function ProtectedRoute() {
  const { data: me, isLoading, isError } = useMe();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Kraunama…</div>;
  }
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Nepavyko susisiekti su serveriu. Pabandykite vėliau.
      </div>
    );
  }
  if (!me) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return (
    <ActiveProfileProvider>
      <Outlet />
    </ActiveProfileProvider>
  );
}
