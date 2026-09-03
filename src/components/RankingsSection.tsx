import React, { useState } from "react";
import type { Unit } from "../types";
import { Building2, Layers, Trophy, AlertTriangle } from "lucide-react";

interface RankingsSectionProps {
  units: Unit[];
}

export const RankingsSection: React.FC<RankingsSectionProps> = ({ units }) => {
  const [targetType, setTargetType] = useState<"projects" | "builders">("projects");
  const [rankingMetric, setRankingMetric] = useState<"co2" | "energy" | "both" | "area">("both");

  const validUnits = units.filter((u) => u.co2[0] !== null && u.en[0] !== null);

  const allCo2s = validUnits.map((u) => u.co2[0]!).sort((a, b) => a - b);
  const allEns = validUnits.map((u) => u.en[0]!).sort((a, b) => a - b);
  const medianCo2 = allCo2s.length ? allCo2s[Math.floor(allCo2s.length * 0.5)] : 120;
  const medianEn = allEns.length ? allEns[Math.floor(allEns.length * 0.5)] : 750;

  const scoredUnits = validUnits.map((u) => {
    const co2 = u.co2[0]!;
    const en = u.en[0]!;
    const co2Ratio = co2 / medianCo2;
    const enRatio = en / medianEn;
    const combinedScore = parseFloat((0.5 * co2Ratio + 0.5 * enRatio).toFixed(2));
    const carbonFactor = en > 0 ? parseFloat(((co2 / en) * 1000).toFixed(1)) : 0;

    return {
      ...u,
      co2Value: co2,
      enValue: en,
      combinedScore,
      carbonFactor,
    };
  });

  const getSortedUnits = (metric: "co2" | "energy" | "both" | "area", ascending = true) => {
    return [...scoredUnits].sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (metric === "co2") { valA = a.co2Value; valB = b.co2Value; }
      else if (metric === "energy") { valA = a.enValue; valB = b.enValue; }
      else if (metric === "both") { valA = a.combinedScore; valB = b.combinedScore; }
      else if (metric === "area") { valA = a.area || 0; valB = b.area || 0; }

      return ascending ? valA - valB : valB - valA;
    });
  };

  const builderAgg: Record<string, { count: number; totalArea: number; co2Sum: number; enSum: number; units: typeof scoredUnits }> = {};

  scoredUnits.forEach((u) => {
    const c = u.construtora || "Não Informada";
    if (!builderAgg[c]) builderAgg[c] = { count: 0, totalArea: 0, co2Sum: 0, enSum: 0, units: [] };
    builderAgg[c].count += 1;
    builderAgg[c].totalArea += u.area || 0;
    builderAgg[c].co2Sum += u.co2Value;
    builderAgg[c].enSum += u.enValue;
    builderAgg[c].units.push(u);
  });

  const builderRankings = Object.entries(builderAgg).map(([builder, d]) => {
    const avgCo2 = d.co2Sum / d.count;
    const avgEn = d.enSum / d.count;
    const co2Ratio = avgCo2 / medianCo2;
    const enRatio = avgEn / medianEn;
    const combinedScore = parseFloat((0.5 * co2Ratio + 0.5 * enRatio).toFixed(2));
    const carbonFactor = avgEn > 0 ? parseFloat(((avgCo2 / avgEn) * 1000).toFixed(1)) : 0;

    return {
      construtora: builder,
      unidades: d.count,
      totalArea: Math.round(d.totalArea),
      avgCo2: Math.round(avgCo2),
      avgEn: Math.round(avgEn),
      combinedScore,
      carbonFactor,
    };
  });

  const getSortedBuilders = (metric: "co2" | "energy" | "both" | "area", ascending = true) => {
    return [...builderRankings].sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (metric === "co2") { valA = a.avgCo2; valB = b.avgCo2; }
      else if (metric === "energy") { valA = a.avgEn; valB = b.avgEn; }
      else if (metric === "both") { valA = a.combinedScore; valB = b.combinedScore; }
      else if (metric === "area") { valA = a.totalArea; valB = b.totalArea; }

      return ascending ? valA - valB : valB - valA;
    });
  };

  const bestProjects = getSortedUnits(rankingMetric, true).slice(0, 10);
  const worstProjects = getSortedUnits(rankingMetric, false).slice(0, 10);

  const bestBuilders = getSortedBuilders(rankingMetric, rankingMetric === "area" ? false : true).slice(0, 10);
  const worstBuilders = getSortedBuilders(rankingMetric, rankingMetric === "area" ? true : false).slice(0, 10);

  const buildersByArea = getSortedBuilders("area", false).slice(0, 15);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="card" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderColor: "var(--accent-amber)" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <Trophy color="var(--accent-amber)" size={24} style={{ marginTop: "3px" }} />
          <div>
            <h3 style={{ fontSize: "1.2rem", color: "var(--accent-amber)" }}>
              Rankings Setoriais: Destaques de Desempenho &amp; Portfólio
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              Classificação dos <strong>Melhores e Piores Empreendimentos</strong> e <strong>Construtoras</strong> considerando Carbono ($kg\ CO_2/m^2$), Energia Incorporada ($MJ/m^2$), Desempenho Combinado (Eco-Score) e Maior Área Construída ($m^2$).
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className={`btn ${targetType === "projects" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTargetType("projects")}
          >
            <Layers size={16} /> Ranking por Projetos / Unidades
          </button>
          <button
            className={`btn ${targetType === "builders" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTargetType("builders")}
          >
            <Building2 size={16} /> Ranking por Construtoras
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Métrica de Classificação:</span>
          <select
            className="select-input"
            value={rankingMetric}
            onChange={(e) => setRankingMetric(e.target.value as any)}
          >
            <option value="both">Ambos (Eco-Score Combinado)</option>
            <option value="co2">Carbono Incorporado (kg CO₂/m²)</option>
            <option value="energy">Energia Incorporada (MJ/m²)</option>
            <option value="area">Maior Área Construída (m²)</option>
          </select>
        </div>
      </div>

      {targetType === "projects" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div className="card" style={{ borderColor: "rgba(16,185,129,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h4 className="card-title" style={{ color: "#34d399", margin: 0 }}>
                <Trophy size={18} style={{ marginRight: "6px" }} /> Top 10 Melhores Projetos
              </h4>
              <span className="badge badge-green">Líderes de Desempenho</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {bestProjects.map((u, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.6rem 0.8rem",
                    borderRadius: "6px",
                    background: "rgba(15,23,42,0.6)",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "0.85rem"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{
                      fontWeight: "bold",
                      color: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "var(--text-dim)",
                      width: "20px",
                      textAlign: "center"
                    }}>
                      #{i + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: "600", color: "#fff" }}>{u.projeto} - {u.unidade}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {u.sistema} · {u.estado} ({u.construtora})
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: "700", color: "#34d399" }}>
                      {rankingMetric === "co2" ? `${u.co2Value} kg/m²` : rankingMetric === "energy" ? `${u.enValue} MJ/m²` : rankingMetric === "area" ? `${u.area?.toLocaleString()} m²` : `Eco-Score: ${u.combinedScore}`}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
                      {u.co2Value} kg/m² | {u.enValue} MJ/m²
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ borderColor: "rgba(244,63,94,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h4 className="card-title" style={{ color: "#f87171", margin: 0 }}>
                <AlertTriangle size={18} style={{ marginRight: "6px" }} /> Top 10 Projetos Ofensores
              </h4>
              <span className="badge badge-rose">Maior Intensidade</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {worstProjects.map((u, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.6rem 0.8rem",
                    borderRadius: "6px",
                    background: "rgba(15,23,42,0.6)",
                    border: "1px solid rgba(244,63,94,0.2)",
                    fontSize: "0.85rem"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontWeight: "bold", color: "#f87171", width: "20px", textAlign: "center" }}>
                      #{i + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: "600", color: "#fff" }}>{u.projeto} - {u.unidade}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {u.sistema} · {u.estado} ({u.construtora})
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: "700", color: "#f87171" }}>
                      {rankingMetric === "co2" ? `${u.co2Value} kg/m²` : rankingMetric === "energy" ? `${u.enValue} MJ/m²` : rankingMetric === "area" ? `${u.area?.toLocaleString()} m²` : `Eco-Score: ${u.combinedScore}`}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
                      {u.co2Value} kg/m² | {u.enValue} MJ/m²
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div className="card" style={{ borderColor: "rgba(16,185,129,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h4 className="card-title" style={{ color: "#34d399", margin: 0 }}>
                <Trophy size={18} style={{ marginRight: "6px" }} /> Top 10 Construtoras Líderes
              </h4>
              <span className="badge badge-green">Melhor Média</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {bestBuilders.map((b, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.6rem 0.8rem",
                    borderRadius: "6px",
                    background: "rgba(15,23,42,0.6)",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "0.85rem"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{
                      fontWeight: "bold",
                      color: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "var(--text-dim)",
                      width: "20px",
                      textAlign: "center"
                    }}>
                      #{i + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: "600", color: "#fff" }}>{b.construtora}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {b.unidades} unidades · {b.totalArea.toLocaleString()} m² acumulados
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: "700", color: "#34d399" }}>
                      {rankingMetric === "co2" ? `${b.avgCo2} kg/m²` : rankingMetric === "energy" ? `${b.avgEn} MJ/m²` : rankingMetric === "area" ? `${b.totalArea.toLocaleString()} m²` : `Eco-Score: ${b.combinedScore}`}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
                      Fator Carbônico: {b.carbonFactor} g/MJ
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ borderColor: "rgba(244,63,94,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h4 className="card-title" style={{ color: "#f87171", margin: 0 }}>
                <AlertTriangle size={18} style={{ marginRight: "6px" }} /> Top 10 Construtoras Ofensoras
              </h4>
              <span className="badge badge-rose">Maior Média de Emissão</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {worstBuilders.map((b, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.6rem 0.8rem",
                    borderRadius: "6px",
                    background: "rgba(15,23,42,0.6)",
                    border: "1px solid rgba(244,63,94,0.2)",
                    fontSize: "0.85rem"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontWeight: "bold", color: "#f87171", width: "20px", textAlign: "center" }}>
                      #{i + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: "600", color: "#fff" }}>{b.construtora}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {b.unidades} unidades · {b.totalArea.toLocaleString()} m² acumulados
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: "700", color: "#f87171" }}>
                      {rankingMetric === "co2" ? `${b.avgCo2} kg/m²` : rankingMetric === "energy" ? `${b.avgEn} MJ/m²` : rankingMetric === "area" ? `${b.totalArea.toLocaleString()} m²` : `Eco-Score: ${b.combinedScore}`}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>
                      Fator Carbônico: {b.carbonFactor} g/MJ
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h4 className="card-title">Ranking de Construtoras por Maior Volume de Área Construída (m²)</h4>
            <p className="card-subtitle">Classificação por escala de portfólio de unidades inventariadas no BIPc</p>
          </div>
          <span className="badge badge-purple">Escala &amp; Volume</span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                <th style={{ padding: "0.75rem" }}># Pos.</th>
                <th style={{ padding: "0.75rem" }}>Construtora</th>
                <th style={{ padding: "0.75rem" }}>Área Acumulada (m²)</th>
                <th style={{ padding: "0.75rem" }}>Nº Unidades</th>
                <th style={{ padding: "0.75rem" }}>CO₂ Média (kg/m²)</th>
                <th style={{ padding: "0.75rem" }}>Energia Média (MJ/m²)</th>
                <th style={{ padding: "0.75rem" }}>Eco-Score Combinado</th>
              </tr>
            </thead>
            <tbody>
              {buildersByArea.map((b, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "0.75rem", fontWeight: "bold", color: "var(--primary)" }}>#{idx + 1}</td>
                  <td style={{ padding: "0.75rem", fontWeight: "600", color: "#fff" }}>{b.construtora}</td>
                  <td style={{ padding: "0.75rem", fontWeight: "700", color: "var(--accent-purple)" }}>
                    {b.totalArea.toLocaleString()} m²
                  </td>
                  <td style={{ padding: "0.75rem" }}>{b.unidades}</td>
                  <td style={{ padding: "0.75rem" }}>{b.avgCo2} kg/m²</td>
                  <td style={{ padding: "0.75rem", color: "var(--accent-amber)" }}>{b.avgEn} MJ/m²</td>
                  <td style={{ padding: "0.75rem" }}>
                    <span className={`badge ${b.combinedScore <= 0.9 ? "badge-green" : b.combinedScore >= 1.1 ? "badge-rose" : "badge-blue"}`}>
                      {b.combinedScore}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
