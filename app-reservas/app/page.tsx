// app/page.tsx
import SearchNav from "@/components/ui/SearchNav";         // ⬅️ barra nueva (CardNav + panel)
import Search from "@/features/search/components/Search";   // ⬅️ tu buscador actual
import ResultsSection from "@/features/catalog/components/ResultsSection";
import MapView from "@/features/map/MapView";
import AppDome from "@/components/AppDome";

export default function Home() {
  return (
    <div className="space-y-8 py-10">
      {/* Barra tipo CardNav (despliega opciones y el formulario expandible) */}
      <SearchNav />

      {/* Dome: sin cambios */}
      <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen h-[100svh] grid place-items-center">
        <AppDome />
      </section>

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