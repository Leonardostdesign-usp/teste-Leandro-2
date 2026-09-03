import React, { useState } from "react";
import type { Unit } from "../types";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  BarChart,
  Bar,
  Legend,
  Cell,
} from "recharts";
import { Sliders, Award, Sparkles, Scale, Filter } from "lucide-react";

interface ComparisonSectionProps {
  units: Unit[];
}

export const ComparisonSection: React.FC<ComparisonSectionProps> = ({ units }) => {
  const [selectedCohort, setSelectedCohort] = useState<string>("sistema");
  const [selectedSystem, setSelectedSystem] = useState<string>("Todos");

  const validUnits = units.filter((u) => u.area && u.co2[0] !== null && u.en[0] !== null);

  const activeCohortUnits = validUnits.filter((u) => {
    if (selectedSystem !== "Todos" && u.sistema !== selectedSystem) return false;
    return true;
  });

  const allCo2s = activeCohortUnits.map((u) => u.co2[0]!).sort((a, b) => a - b);
  const allEns = activeCohortUnits.map((u) => u.en[0]!).sort((a, b) => a - b);

  const C_baselineCo2 = allCo2s.length ? allCo2s[Math.floor(allCo2s.length * 0.5)] : 120;
  const P25_classACo2 = allCo2s.length ? allCo2s[Math.floor(allCo2s.length * 0.25)] : 95;
  const Q3_classCCo2 = allCo2s.length ? allCo2s[Math.floor(allCo2s.length * 0.75)] : 140;
  const R_riskMaxCo2 = allCo2s.length ? allCo2s[Math.floor(allCo2s.length * 0.9)] : 165;
  const V_valueRefCo2 = Math.round((C_baselineCo2 + R_riskMaxCo2) / 2);

  const C_baselineEn = allEns.length ? allEns[Math.floor(allEns.length * 0.5)] : 750;

  const cohortSortedCo2 = activeCohortUnits.map((u) => u.co2[0]!).sort((a, b) => a - b);
  const co2Min = cohortSortedCo2.length ? cohortSortedCo2[0]! : 0;
  const co2Max = cohortSortedCo2.length ? cohortSortedCo2[cohortSortedCo2.length - 1]! : 160;
  const curveXMin = Math.max(0, Math.floor((co2Min - 10) / 5) * 5);
  const curveXMax = Math.ceil((co2Max + 10) / 5) * 5;

  const fracBetter = (x: number): number => {
    const n = cohortSortedCo2.length;
    if (!n) return 0;
    let idx = 0;
    while (idx < n && cohortSortedCo2[idx] <= x) idx += 1;
    return parseFloat((idx / n).toFixed(4));
  };

  const benchmarkCurve = (() => {
    const pts: { co2: number; frac: number }[] = [];
    const step = (curveXMax - curveXMin) / 120;
    for (let x = curveXMin; x <= curveXMax; x += step) {
      pts.push({ co2: x, frac: fracBetter(x) });
    }
    return pts;
  })();

  const scenarioPoints = [
    {
      id: "P",
      nome: "P — Potencial de Mitigação (25% Melhores)",
      co2: P25_classACo2,
      frac: fracBetter(P25_classACo2),
      cor: "#10b981",
      descricao: "Limite dos 25% melhores projetos. Onde o projeto poderia chegar com os melhores fornecedores.",
    },
    {
      id: "C",
      nome: "C — Melhor Cenário / Linha de Base (50% Melhores)",
      co2: C_baselineCo2,
      frac: fracBetter(C_baselineCo2),
      cor: "#3b82f6",
      descricao: "Mediana dos 50% melhores projetos. Referência contra a qual o projeto é classificado.",
    },
    {
      id: "V",
      nome: "V — Valor de Referência V = (C + R)/2",
      co2: V_valueRefCo2,
      frac: fracBetter(V_valueRefCo2),
      cor: "#f59e0b",
      descricao: "Valor provável de emissão, média entre C e R.",
    },
    {
      id: "R",
      nome: "R — Pior Cenário / Teto de Risco",
      co2: R_riskMaxCo2,
      frac: fracBetter(R_riskMaxCo2),
      cor: "#f43f5e",
      descricao: "Teto de risco com o pior fornecedor registrado.",
    },
  ];

  const ecoMatrixData = activeCohortUnits.map((u) => {
    const co2 = u.co2[0]!;
    const en = u.en[0]!;
    const carbonFactor = en > 0 ? ((co2 / en) * 1000).toFixed(1) : "0";

    let quadrant = "Líder Eco-Eficiente (Baixo CO₂, Baixa Energia)";
    let quadrantColor = "#10b981";

    if (co2 > C_baselineCo2 && en > C_baselineEn) {
      quadrant = "Crítico / Ofensor Duplo (Alto CO₂, Alta Energia)";
      quadrantColor = "#f43f5e";
    } else if (co2 > C_baselineCo2 && en <= C_baselineEn) {
      quadrant = "Carbono-Intensivo (Alto CO₂, Baixa Energia)";
      quadrantColor = "#f59e0b";
    } else if (co2 <= C_baselineCo2 && en > C_baselineEn) {
      quadrant = "Energia-Intensivo Descarbonizado (Baixo CO₂, Alta Energia)";
      quadrantColor = "#3b82f6";
    }

    return {
      x: en,
      y: co2,
      carbonFactor: parseFloat(carbonFactor),
      name: `${u.projeto} - ${u.unidade}`,
      sistema: u.sistema,
      estado: u.estado,
      construtora: u.construtora,
      area: u.area,
      quadrant,
      quadrantColor,
    };
  });

  const groupedData: Record<string, { count: number; co2s: number[]; ens: number[] }> = {};

  activeCohortUnits.forEach((u) => {
    let key = u.sistema;
    if (selectedCohort === "estado") key = u.estado;
    if (selectedCohort === "porte") {
      const area = u.area || 0;
      if (area < 5000) key = "Pequeno Porte (<5k m²)";
      else if (area < 20000) key = "Médio Porte (5k-20k m²)";
      else key = "Grande Porte (>20k m²)";
    }

    if (!groupedData[key]) groupedData[key] = { count: 0, co2s: [], ens: [] };
    groupedData[key].count += 1;
    groupedData[key].co2s.push(u.co2[0]!);
    groupedData[key].ens.push(u.en[0]!);
  });

  const cohortChartData = Object.entries(groupedData).map(([key, d]) => {
    const avgCo2 = d.co2s.reduce((a, b) => a + b, 0) / d.co2s.length;
    const avgEn = d.ens.reduce((a, b) => a + b, 0) / d.ens.length;
    const carbonFactor = avgEn > 0 ? (avgCo2 / avgEn) * 1000 : 0;

    return {
      grupo: key,
      qtd: d.count,
      co2Medio: Math.round(avgCo2),
      enMedio: Math.round(avgEn),
      fatorCarbonico: parseFloat(carbonFactor.toFixed(1)),
    };
  });

  let totalSavedTonnes = 0;
  activeCohortUnits.forEach((u) => {
    const co2 = u.co2[0] || 0;
    const area = u.area || 0;
    if (co2 > C_baselineCo2) {
      const deltaCo2KgPerM2 = co2 - C_baselineCo2;
      const savedKg = deltaCo2KgPerM2 * area;
      totalSavedTonnes += savedKg / 1000;
    }
  });

  const sistemasDisponiveis = Array.from(new Set(validUnits.map((u) => u.sistema))).sort();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="card" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderColor: "var(--accent-blue)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <Sliders color="var(--accent-blue)" size={24} style={{ marginTop: "3px" }} />
            <div>
              <h3 style={{ fontSize: "1.2rem", color: "var(--accent-blue)" }}>
                Metodologia Oficial BIPc (P, C, R, V) Ancorada na Linha de Base
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                Classificação em **Classes A, B, C, D** calculada em relação à **Linha de Base C** específica da coorte selecionada.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--bg-panel)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <Filter size={14} color="var(--primary)" />
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Ancorar Linha de Base por:</span>
            <select
              className="select-input"
              value={selectedSystem}
              onChange={(e) => setSelectedSystem(e.target.value)}
            >
              <option value="Todos">Todas as Coortes (Nacional)</option>
              {sistemasDisponiveis.map((sys) => (
                <option key={sys} value={sys}>{sys}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <div className="card" style={{ borderColor: "rgba(16, 185, 129, 0.4)", background: "rgba(16, 185, 129, 0.05)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--primary)", fontWeight: "600", textTransform: "uppercase" }}>Meta Classe A (25% Melhores)</div>
          <div style={{ fontSize: "1.6rem", fontWeight: "700", color: "#34d399", margin: "0.2rem 0" }}>
            {P25_classACo2} <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>kg/m²</span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>Limite para etiqueta Classe A</div>
        </div>

        <div className="card" style={{ borderColor: "rgba(59, 130, 246, 0.5)", background: "rgba(59, 130, 246, 0.08)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--accent-blue)", fontWeight: "700", textTransform: "uppercase" }}>C — LINHA DE BASE (MEDIANA ATIVA)</div>
          <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--accent-blue)", margin: "0.2rem 0" }}>
            {C_baselineCo2} <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>kg/m²</span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
            Referência de corte para a amostra {selectedSystem !== "Todos" ? `(${selectedSystem})` : "Nacional"}
          </div>
        </div>

        <div className="card" style={{ borderColor: "rgba(245, 158, 11, 0.4)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--accent-amber)", fontWeight: "600", textTransform: "uppercase" }}>V — Alerta V = (C + R)/2</div>
          <div style={{ fontSize: "1.6rem", fontWeight: "700", color: "var(--accent-amber)", margin: "0.2rem 0" }}>
            {V_valueRefCo2} <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>kg/m²</span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>Ponto médio da faixa de risco</div>
        </div>

        <div className="card" style={{ borderColor: "rgba(244, 63, 94, 0.4)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--accent-rose)", fontWeight: "600", textTransform: "uppercase" }}>R — Teto de Risco (Pior Cenário)</div>
          <div style={{ fontSize: "1.6rem", fontWeight: "700", color: "var(--accent-rose)", margin: "0.2rem 0" }}>
            {R_riskMaxCo2} <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>kg/m²</span>
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)" }}>Pior fornecedor no inventário</div>
        </div>
      </div>

      <div className="card" style={{ borderColor: "rgba(59, 130, 246, 0.4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <div>
              <span className="badge badge-blue">
                <Scale size={12} style={{ marginRight: "4px" }} /> Âncoras posicionadas sobre a Curva
              </span>
              <h4 className="card-title" style={{ marginTop: "0.4rem" }}>
                Cenários P, C, V e R sobre a Curva de Benchmark
              </h4>
            </div>
          </div>
          <p className="card-subtitle">
            Cada cenário é um ponto na curva: mostra **que fração de projetos é melhor** que aquela intensidade. Linha de Base C = {C_baselineCo2} kg/m² | V = {V_valueRefCo2} | R = {R_riskMaxCo2} | P = {P25_classACo2}.
          </p>

          <div style={{ width: "100%", height: "270px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={benchmarkCurve} margin={{ top: 12, right: 12, left: -8, bottom: 0 }}>
                <XAxis type="number" dataKey="co2" name="CO₂" unit=" kg/m²" domain={[curveXMin, curveXMax]} stroke="var(--text-dim)" fontSize={10} />
                <YAxis type="number" dataKey="frac" name="Fração de projetos melhores" domain={[0, 1]} tickFormatter={(v: number) => (v * 100).toFixed(0) + "%"} stroke="var(--text-dim)" fontSize={10} />

                {scenarioPoints.map((s) => (
                  <ReferenceLine key={`ref-${s.id}`} x={s.co2} stroke={s.cor} strokeDasharray="5 3" label={{ value: `${s.id} ${s.co2}`, position: "top", fill: s.cor, fontSize: 10, fontWeight: 700 }} />
                ))}

                <ReferenceArea x1={curveXMin} x2={P25_classACo2} fill="#10b981" fillOpacity={0.08} ifOverflow="extendDomain" />
                <ReferenceArea x1={Q3_classCCo2} x2={curveXMax} fill="#f43f5e" fillOpacity={0.08} ifOverflow="extendDomain" />

                <ReferenceArea x1={curveXMin} x2={curveXMax} y1={0.45} y2={0.55} fill="#94a3b8" fillOpacity={0.08} ifOverflow="extendDomain" />
                <ReferenceLine y={0.5} stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 3" label={{ value: "LINHA DE BASE (50% MELHORES = MEDIANA)", position: "insideTopRight", fill: "#cbd5e1", fontSize: 10, fontWeight: 700 }} />

                <Tooltip
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const d = payload[0].payload;
                      if (d.id) {
                        return (
                          <div style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border-color)", padding: "0.6rem 0.75rem", borderRadius: "8px", maxWidth: "260px" }}>
                            <div style={{ fontWeight: "bold", color: d.cor, fontSize: "0.85rem" }}>{d.nome}</div>
                            <div style={{ fontSize: "0.8rem", color: "#fff", marginTop: "0.2rem" }}>
                              <strong>{d.co2} kg/m²</strong> — fração de projetos melhores: <strong>{(d.frac * 100).toFixed(0)}%</strong>
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>{d.descricao}</div>
                          </div>
                        );
                      }
                      return (
                        <div style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border-color)", padding: "0.5rem 0.75rem", borderRadius: "8px" }}>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{d.co2} kg/m² — {((d.frac || 0) * 100).toFixed(0)}% melhores</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Area type="monotone" dataKey="frac" stroke="#06b6d4" strokeWidth={2} fill="#06b6d4" fillOpacity={0.06} isAnimationActive={false} />

                <Scatter name="Cenários" data={scenarioPoints} isAnimationActive={false}>
                  {scenarioPoints.map((s, i) => (
                    <Cell key={`sc-${i}`} fill={s.cor} />
                  ))}
                </Scatter>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

      <div className="card" style={{ background: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span className="badge badge-green">
              <Award size={12} style={{ marginRight: "4px" }} /> Potencial de Mitigação Setorial (Projetos P &gt; Linha de Base C)
            </span>
            <h3 style={{ fontSize: "1.5rem", color: "#34d399", marginTop: "0.4rem" }}>
              {Math.round(totalSavedTonnes).toLocaleString()} Toneladas de CO₂
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Estimativa de redução acumulada se os projetos acima da **Linha de Base C ({C_baselineCo2} kg/m²)** migrassem para a mediana da coorte.
            </p>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", borderLeft: "1px solid var(--border-color)", paddingLeft: "1.5rem" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>C — Linha de Base</div>
              <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--accent-blue)" }}>{C_baselineCo2} kg/m²</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>V — Valor Ref. (C+R)/2</div>
              <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--accent-amber)" }}>{V_valueRefCo2} kg/m²</div>
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>R — Teto de Risco</div>
              <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--accent-rose)" }}>{R_riskMaxCo2} kg/m²</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ borderColor: "rgba(6, 182, 212, 0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <div>
            <span className="badge badge-blue" style={{ background: "rgba(6, 182, 212, 0.15)", color: "#06b6d4" }}>
              <Sparkles size={12} style={{ marginRight: "4px" }} /> Visão Inovadora / Insight Fora do Padrão
            </span>
            <h4 className="card-title" style={{ marginTop: "0.4rem" }}>
              Matriz de Eficiência Eco-Energética Ancorada na Linha de Base C
            </h4>
            <p className="card-subtitle">
              Eixo Y partido pela **Linha de Base C ({C_baselineCo2} kg CO₂/m²)** | Eixo X partido pela **Energia Mediana ({C_baselineEn} MJ/m²)**
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.5rem", marginBottom: "1rem", fontSize: "0.75rem" }}>
          <div style={{ padding: "0.5rem", borderRadius: "6px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#34d399" }}>
            <strong>Q1 — Líder Eco-Eficiente:</strong> P ≤ C &amp; Baixa Energia
          </div>
          <div style={{ padding: "0.5rem", borderRadius: "6px", background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", color: "#fbbf24" }}>
            <strong>Q2 — Carbono-Intensivo:</strong> P &gt; C &amp; Baixa Energia
          </div>
          <div style={{ padding: "0.5rem", borderRadius: "6px", background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", color: "#60a5fa" }}>
            <strong>Q3 — Energia-Intensivo:</strong> P ≤ C &amp; Alta Energia
          </div>
          <div style={{ padding: "0.5rem", borderRadius: "6px", background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#f87171" }}>
            <strong>Q4 — Crítico / Ofensor Duplo:</strong> P &gt; C &amp; Alta Energia
          </div>
        </div>

        <div style={{ width: "100%", height: "380px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <XAxis
                type="number"
                dataKey="x"
                name="Energia Incorporada"
                unit=" MJ/m²"
                stroke="var(--text-muted)"
                fontSize={12}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Intensidade CO₂"
                unit=" kg/m²"
                stroke="var(--text-muted)"
                fontSize={12}
              />
              <ZAxis range={[60, 60]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ payload }) => {
                  if (payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "8px", maxWidth: "280px" }}>
                        <div style={{ fontWeight: "bold", color: "#fff" }}>{data.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                          CO₂ (P): <strong>{data.y} kg/m²</strong> | Energia: <strong>{data.x} MJ/m²</strong>
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", fontWeight: "bold" }}>
                          Fator Carbônico: {data.carbonFactor} g CO₂/MJ
                        </div>
                        <div style={{ fontSize: "0.75rem", color: data.quadrantColor, marginTop: "0.3rem", fontWeight: "600" }}>
                          {data.quadrant}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine x={C_baselineEn} stroke="var(--accent-amber)" strokeDasharray="5 5" label={{ value: `Mediana Energia (${C_baselineEn} MJ)`, fill: "var(--accent-amber)", fontSize: 10, position: "top" }} />
              <ReferenceLine y={C_baselineCo2} stroke="var(--accent-blue)" strokeDasharray="5 5" label={{ value: `C — Linha de Base (${C_baselineCo2} kg)`, fill: "var(--accent-blue)", fontSize: 10, position: "right" }} />
              <Scatter name="Unidades" data={ecoMatrixData}>
                {ecoMatrixData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.quadrantColor} opacity={0.8} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h4 className="card-title">Fator Carbônico da Energia por Coorte (g CO₂ / MJ)</h4>
            <p className="card-subtitle">Mede a "sujeira" da energia incorporada por sistema, estado ou porte</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Segmentar Por:</span>
            <select
              className="select-input"
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
            >
              <option value="sistema">Sistema Estrutural</option>
              <option value="estado">Estado / Região (UF)</option>
              <option value="porte">Porte do Empreendimento (m²)</option>
            </select>
          </div>
        </div>

        <div style={{ width: "100%", height: "300px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cohortChartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <XAxis dataKey="grupo" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={12} label={{ value: "g CO₂/MJ", angle: -90, position: "insideLeft", fill: "var(--text-dim)" }} />
              <Tooltip contentStyle={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-color)" }} />
              <Legend />
              <Bar dataKey="fatorCarbonico" name="Fator Carbônico da Energia (g CO₂/MJ)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="co2Medio" name="CO₂ Médio (kg/m²)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
