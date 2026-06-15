import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-6 text-8xl font-bold text-slate-200">404</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          P&aacute;gina no encontrada
        </h2>
        <p className="text-slate-500 mb-6">
          La p&aacute;gina que buscas no existe o ha sido movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
