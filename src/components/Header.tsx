import React from "react";
import type { Dataset, FilterState } from "../types";
import { Filter, RefreshCw, ListFilter, ShieldAlert, Building2, Layers, MapPin, SlidersHorizontal, Eye, Trophy } from "lucide-react";

interface HeaderProps {
  ds: Dataset;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  filteredCount: number;
  filteredProjectsCount: number;
  onOpenDrawer: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  ds,
  filters,
  setFilters,
  filteredCount,
  filteredProjectsCount,
  onOpenDrawer,
  activeTab,
  setActiveTab,
}) => {
  const resetFilters = () => {
    setFilters({
      estado: "Todos",
      sistema: "Todos",
      status: "Todos",
      construtora: "Todos",
      anoStart: "Todos",
      anoEnd: "Todos",
      areaRange: [0, 100000],
      limiarDivergencia: 2.0,
    });
  };

  const estadosList = Object.keys(ds.meta.estados).sort();
  const sistemasList = Object.keys(ds.meta.sistemas).sort();
  const construtorasList = Object.keys(ds.meta.construtoras).sort();

  return (
    <header className="header-banner">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.75rem",
            color: "#000",
            fontWeight: "bold",
            boxShadow: "0 0 15px rgba(16, 185, 129, 0.4)"
          }}>
            ⬡
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <h1 style={{ fontSize: "1.5rem", color: "var(--text-main)", margin: 0 }}>
                BIPc — Wireframe Dashboard Geral
              </h1>
              <span className="badge badge-green">v2.5 Inventário Nacional</span>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              Banco de Inventários de Projetos de Construção de Baixo Carbono · Plataforma de Benchmarking
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{
            background: "rgba(15, 23, 42, 0.8)",
            border: "1px solid var(--border-color)",
            padding: "0.5rem 1rem",
            borderRadius: "var(--radius-md)",
            textAlign: "right"
          }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Amostra Filtrada
            </div>
            <div style={{ fontSize: "1rem", fontWeight: "700", color: "var(--primary)" }}>
              {filteredCount} <span style={{ fontSize: "0.85rem", fontWeight: "normal", color: "var(--text-muted)" }}>unidades</span> · {filteredProjectsCount} <span style={{ fontSize: "0.85rem", fontWeight: "normal", color: "var(--text-muted)" }}>projetos</span>
            </div>
          </div>

          <button className="btn btn-secondary" onClick={onOpenDrawer}>
            <ListFilter size={16} /> Explorar Projetos
          </button>
        </div>
      </div>

      <div style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-lg)",
        padding: "1rem 1.25rem",
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.875rem", fontWeight: "600" }}>
            <Filter size={16} color="var(--primary)" /> Contexto:
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
              <MapPin size={12} style={{ display: "inline", marginRight: "2px" }} /> Estado (UF)
            </label>
            <select
              className="select-input"
              value={filters.estado}
              onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
            >
              <option value="Todos">Todos ({Object.keys(ds.meta.estados).length} UFs)</option>
              {estadosList.map((uf) => (
                <option key={uf} value={uf}>{uf} ({ds.meta.estados[uf]})</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
              <Layers size={12} style={{ display: "inline", marginRight: "2px" }} /> Sistema Estrutural
            </label>
            <select
              className="select-input"
              value={filters.sistema}
              onChange={(e) => setFilters({ ...filters, sistema: e.target.value })}
            >
              <option value="Todos">Todos os Sistemas</option>
              {sistemasList.map((sis) => (
                <option key={sis} value={sis}>{sis} ({ds.meta.sistemas[sis]})</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
              <Building2 size={12} style={{ display: "inline", marginRight: "2px" }} /> Construtora
            </label>
            <select
              className="select-input"
              value={filters.construtora}
              onChange={(e) => setFilters({ ...filters, construtora: e.target.value })}
              style={{ maxWidth: "180px" }}
            >
              <option value="Todos">Todas ({Object.keys(ds.meta.construtoras).length})</option>
              {construtorasList.map((c) => (
                <option key={c} value={c}>{c} ({ds.meta.construtoras[c]})</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Status</label>
            <select
              className="select-input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="Todos">Todos os Status</option>
              {Object.keys(ds.meta.status).map((st) => (
                <option key={st} value={st}>{st} ({ds.meta.status[st]})</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
              <ShieldAlert size={12} style={{ display: "inline", marginRight: "2px" }} /> Limiar Divergência
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.5"
                value={filters.limiarDivergencia}
                onChange={(e) => setFilters({ ...filters, limiarDivergencia: parseFloat(e.target.value) })}
                style={{ width: "80px", accentColor: "var(--primary)" }}
              />
              <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: "bold" }}>
                {filters.limiarDivergencia} kg/m²
              </span>
            </div>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={resetFilters} title="Limpar todos os filtros">
          <RefreshCw size={14} /> Resetar
        </button>
      </div>

      <nav style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", flexWrap: "wrap" }}>
        <button
          className={`btn ${activeTab === "overview" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("overview")}
          style={{ padding: "0.6rem 1.2rem", fontSize: "0.9rem" }}
        >
          <Eye size={16} /> 1. Visão Macro (Estado Atual)
        </button>

        <button
          className={`btn ${activeTab === "comparison" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("comparison")}
          style={{ padding: "0.6rem 1.2rem", fontSize: "0.9rem" }}
        >
          <SlidersHorizontal size={16} /> 2. Comparação Contextualizada
        </button>

        <button
          className={`btn ${activeTab === "evolution" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("evolution")}
          style={{ padding: "0.6rem 1.2rem", fontSize: "0.9rem" }}
        >
          <RefreshCw size={16} /> 3. Evolução &amp; Trajetórias Futuras
        </button>

        <button
          className={`btn ${activeTab === "rankings" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("rankings")}
          style={{ padding: "0.6rem 1.2rem", fontSize: "0.9rem" }}
        >
          <Trophy size={16} /> Rankings &amp; Destaques
        </button>

        <button
          className={`btn ${activeTab === "validation" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("validation")}
          style={{ padding: "0.6rem 1.2rem", fontSize: "0.9rem" }}
        >
          <ShieldAlert size={16} /> Auditoria &amp; Linha Cássio
        </button>
      </nav>
    </header>
  );
};
