import { useState, useMemo } from "react";
import data from "./data/data.json";
import type { Dataset, FilterState, Unit } from "./types";
import { Header } from "./components/Header";
import { OverviewSection } from "./components/OverviewSection";
import { ComparisonSection } from "./components/ComparisonSection";
import { EvolutionSection } from "./components/EvolutionSection";
import { ValidationSection } from "./components/ValidationSection";
import { RankingsSection } from "./components/RankingsSection";
import { GrafReq1Section } from "./components/GrafReq1Section";
import { GrafReq2Section } from "./components/GrafReq2Section";
import { ProjectListDrawer } from "./components/ProjectListDrawer";

const ds = data as unknown as Dataset;

export default function App() {
  const [filters, setFilters] = useState<FilterState>({
    estado: "Todos",
    sistema: "Todos",
    status: "Todos",
    construtora: "Todos",
    anoStart: "Todos",
    anoEnd: "Todos",
    areaRange: [0, 100000],
    limiarDivergencia: 2.0,
  });

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const filteredUnits = useMemo<Unit[]>(() => {
    return ds.units.filter((u) => {
      if (filters.estado !== "Todos" && u.estado !== filters.estado) return false;
      if (filters.sistema !== "Todos" && u.sistema !== filters.sistema) return false;
      if (filters.status !== "Todos" && u.status !== filters.status) return false;
      if (filters.construtora !== "Todos" && u.construtora !== filters.construtora) return false;
      return true;
    });
  }, [filters]);

  const filteredProjectsCount = useMemo(() => {
    return new Set(filteredUnits.map((u) => u.projeto)).size;
  }, [filteredUnits]);

  return (
    <div className="app-container">
      <Header
        ds={ds}
        filters={filters}
        setFilters={setFilters}
        filteredCount={filteredUnits.length}
        filteredProjectsCount={filteredProjectsCount}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="main-content">
        {activeTab === "overview" && (
          <OverviewSection units={filteredUnits} />
        )}
        {activeTab === "comparison" && (
          <ComparisonSection units={filteredUnits} />
        )}
        {activeTab === "evolution" && (
          <EvolutionSection units={filteredUnits} />
        )}
        {activeTab === "rankings" && (
          <RankingsSection units={filteredUnits} />
        )}
        {activeTab === "validation" && (
          <ValidationSection units={filteredUnits} limiarDivergencia={filters.limiarDivergencia} />
        )}
        {activeTab === "grafreq1" && (
          <GrafReq1Section units={filteredUnits} />
        )}
        {activeTab === "grafreq2" && (
          <GrafReq2Section units={filteredUnits} />
        )}
      </main>

      <ProjectListDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        units={filteredUnits}
        limiarDivergencia={filters.limiarDivergencia}
      />

      <footer style={{
        textAlign: "center",
        padding: "1.5rem",
        borderTop: "1px solid var(--border-color)",
        color: "var(--text-dim)",
        fontSize: "0.8rem",
        background: "var(--bg-panel)"
      }}>
        BIPc — Banco de Inventários de Projetos de Construção · Convênio CAIXA / FAU-USP · 287 Unidades (249 Projetos) · Protótipo Wireframe Interativo
      </footer>
    </div>
  );
}
