import React, { useState } from "react";
import type { Unit } from "../types";
import { X, Search, Building2, MapPin, Layers, CheckCircle, AlertTriangle } from "lucide-react";

interface ProjectListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  units: Unit[];
  limiarDivergencia: number;
}

export const ProjectListDrawer: React.FC<ProjectListDrawerProps> = ({
  isOpen,
  onClose,
  units,
  limiarDivergencia,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"co2" | "area" | "desvio">("co2");

  if (!isOpen) return null;

  const filteredUnits = units.filter((u) => {
    const term = searchTerm.toLowerCase();
    return (
      u.projeto.toLowerCase().includes(term) ||
      u.unidade.toLowerCase().includes(term) ||
      u.construtora.toLowerCase().includes(term) ||
      u.estado.toLowerCase().includes(term) ||
      u.sistema.toLowerCase().includes(term)
    );
  }).sort((a, b) => {
    if (sortBy === "co2") {
      return (b.co2[0] || 0) - (a.co2[0] || 0);
    } else if (sortBy === "area") {
      return (b.area || 0) - (a.area || 0);
    } else {
      return Math.abs(b.desvio[0] || 0) - Math.abs(a.desvio[0] || 0);
    }
  });

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.65)",
      backdropFilter: "blur(4px)",
      zIndex: 9999,
      display: "flex",
      justifyContent: "flex-end",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "600px",
        height: "100%",
        backgroundColor: "var(--bg-panel)",
        borderLeft: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        boxShadow: "-10px 0 30px rgba(0,0,0,0.5)",
      }}>
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-card)",
        }}>
          <div>
            <h2 style={{ fontSize: "1.2rem", margin: 0, color: "var(--text-main)" }}>
              Lista de Unidades &amp; Empreendimentos
            </h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Exibindo {filteredUnits.length} de {units.length} unidades na amostra ativa
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "0.5rem",
              borderRadius: "50%",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--text-dim)" }} />
            <input
              type="text"
              placeholder="Buscar por projeto, construtora, UF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="select-input"
              style={{ width: "100%", paddingLeft: "32px" }}
            />
          </div>

          <select
            className="select-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="co2">Ordernar por CO₂ (kg/m²)</option>
            <option value="area">Ordenar por Área (m²)</option>
            <option value="desvio">Ordenar por Desvio Cássio</option>
          </select>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filteredUnits.map((u, idx) => {
            const isDivergent = Math.abs(u.desvio[0] || 0) > limiarDivergencia || u.divergencia === "Sim";
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: `1px solid ${isDivergent ? "rgba(244,63,94,0.4)" : "var(--border-color)"}`,
                  borderRadius: "var(--radius-md)",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  transition: "background-color 0.2s",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{u.projeto}</span>
                    <h4 style={{ fontSize: "1rem", color: "var(--text-main)" }}>{u.unidade}</h4>
                  </div>
                  {isDivergent ? (
                    <span className="badge badge-rose">
                      <AlertTriangle size={12} style={{ marginRight: "3px" }} /> Divergência
                    </span>
                  ) : (
                    <span className="badge badge-green">
                      <CheckCircle size={12} style={{ marginRight: "3px" }} /> Ok
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
                  <span><MapPin size={12} style={{ display: "inline" }} /> {u.estado} - {u.cidade}</span>
                  <span><Building2 size={12} style={{ display: "inline" }} /> {u.construtora}</span>
                  <span><Layers size={12} style={{ display: "inline" }} /> {u.sistema}</span>
                </div>

                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "0.5rem",
                  marginTop: "0.5rem",
                  paddingTop: "0.5rem",
                  borderTop: "1px dashed var(--border-color)",
                  fontSize: "0.8rem"
                }}>
                  <div>
                    <div style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}>Área Útil</div>
                    <div style={{ fontWeight: "600" }}>{u.area ? `${u.area.toLocaleString()} m²` : "N/A"}</div>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}>Intensidade CO₂</div>
                    <div style={{ fontWeight: "700", color: "var(--primary)" }}>
                      {u.co2[0] !== null ? `${u.co2[0]} - ${u.co2[1]} kg/m²` : "N/A"}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-dim)", fontSize: "0.7rem" }}>Desvio Cássio</div>
                    <div style={{ fontWeight: "600", color: isDivergent ? "var(--accent-rose)" : "var(--text-muted)" }}>
                      {u.desvio[0] !== null ? `${u.desvio[0]} kg/m²` : "0.0"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
