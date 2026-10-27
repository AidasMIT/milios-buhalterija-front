import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin, useMe } from '@/hooks/use-auth';
import { errorMessage } from '@/lib/errors';

/** Sign-in only: accounts are created by an administrator, there is no self-registration. */
export default function Login() {
  const { data: me } = useMe();
  const login = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';
  if (me) return <Navigate to={from} replace />;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password, rememberMe }, { onSuccess: () => navigate(from, { replace: true }) });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-3">
            <Receipt className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">Buhalterija</h1>
          <p className="text-sm text-muted-foreground">Prisijunkite, kad tęstumėte</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl bg-card p-6 shadow-card space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">El. paštas</Label>
            <Input id="email" type="email" autoComplete="username" required value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Slaptažodis</Label>
            <Input id="password" type="password" autoComplete="current-password" required value={password}
              onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="remember" checked={rememberMe} onCheckedChange={(v) => setRememberMe(v === true)} />
            <Label htmlFor="remember" className="cursor-pointer font-normal">Prisiminti mane</Label>
          </div>
          {login.isError && <p className="text-sm text-destructive" role="alert">{errorMessage(login.error)}</p>}
          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? 'Jungiamasi…' : 'Prisijungti'}
          </Button>
        </form>
      </div>
    </div>
  );
}
