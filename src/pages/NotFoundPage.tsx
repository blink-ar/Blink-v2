import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-blink-bg px-6 py-24 text-center">
      <h1 className="text-3xl font-bold">Página no encontrada</h1>
      <p className="my-6">La dirección que buscaste no existe.</p>
      <Link to="/search" className="underline">Buscar descuentos</Link>
    </main>
  );
}
