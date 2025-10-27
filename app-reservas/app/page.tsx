// app/page.tsx  (Server Component)
import Search from "@/features/search/components/Search";
import ResultsSection from "@/features/catalog/components/ResultsSection";
import MapView from "@/features/map/MapView";
import AppDome from "@/components/AppDome"; // o "@/components/ui/AppDome" si no hiciste el re-export

export default function Home() {
  return (
    <div className="space-y-8 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agencia de Viajes</h1>
        <p className="text-sm text-zinc-500">MVP</p>
      </header>

      <section
  className="
    relative left-1/2 right-1/2 -mx-[50vw]   /* rompe el contenedor */
    w-screen h-[100svh]                      /* ocupa ancho/alto de la ventana */
    grid place-items-center                  /* centra el contenido */
  "
>
  <AppDome />
</section>

      {/* Buscador */}
      <Search />

      {/* Resultados + Mapa */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <ResultsSection className="md:col-span-2" />
        <aside>
          <MapView />
        </aside>
      </div>
    </div>
  );
}