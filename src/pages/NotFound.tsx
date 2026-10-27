import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Puslapis nerastas</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          Grįžti į pradžią
        </Link>
      </div>
    </div>
  );
}
