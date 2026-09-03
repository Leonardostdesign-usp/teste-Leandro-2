import React, { useState } from "react";
import type { Unit } from "../types";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
} from "recharts";
import { Compass, Sparkles } from "lucide-react";

interface EvolutionSectionProps {
  units: Unit[];
}

export const EvolutionSection: React.FC<EvolutionSectionProps> = ({ units }) => {
  const [targetReductionPercent, setTargetReductionPercent] = useState<number>(20);

  const yearGroups: Record<number, { count: number; co2Sum: number; enSum: number; pareddCount: number; alvCount: number; vpCount: number }> = {};

  units.forEach((u) => {
    if (!u.ano) return;
    const yr = u.ano;
    if (!yearGroups[yr]) yearGroups[yr] = { count: 0, co2Sum: 0, enSum: 0, pareddCount: 0, alvCount: 0, vpCount: 0 };
    yearGroups[yr].count += 1;
    yearGroups[yr].co2Sum += u.co2[0] || 0;
    yearGroups[yr].enSum += u.en[0] || 0;

    if (u.sistema === "Parede de Concreto") yearGroups[yr].pareddCount += 1;
    else if (u.sistema === "Alvenaria Estrutural") yearGroups[yr].alvCount += 1;
    else if (u.sistema === "Viga-Pilar") yearGroups[yr].vpCount += 1;
  });

  const sortedYears = Object.keys(yearGroups)
    .map(Number)
    .sort((a, b) => a - b);

  const timeSeriesData = sortedYears.map((yr) => {
    const d = yearGroups[yr];
    const avgCo2 = Math.round(d.co2Sum / (d.count || 1));
    const avgEn = Math.round(d.enSum / (d.count || 1));
    const carbonFactor = avgEn > 0 ? parseFloat(((avgCo2 / avgEn) * 1000).toFixed(1)) : 0;

    return {
      ano: yr,
      co2Medio: avgCo2,
      enMedio: avgEn,
      fatorCarbonico: carbonFactor,
      unidades: d.count,
      paredeConcretoPct: Math.round((d.pareddCount / d.count) * 100),
      alvenariaPct: Math.round((d.alvCount / d.count) * 100),
      vigaPilarPct: Math.round((d.vpCount / d.count) * 100),
    };
  });

  const lastHistoricalYear = sortedYears[sortedYears.length - 1] || 2024;
  const lastCo2 = timeSeriesData[timeSeriesData.length - 1]?.co2Medio || 150;
  const lastEn = timeSeriesData[timeSeriesData.length - 1]?.enMedio || 800;

  const targetCo2_2030 = Math.round(lastCo2 * (1 - targetReductionPercent / 100));
  const targetEn_2030 = Math.round(lastEn * (1 - targetReductionPercent / 100));

  const trajectoryData = [];
  timeSeriesData.forEach((d) => {
    trajectoryData.push({
      ano: d.ano.toString(),
      historicoCo2: d.co2Medio,
      historicoEn: d.enMedio,
      projetadoCo2: null,
      projetadoEn: null,
    });
  });

  const startYr = lastHistoricalYear;
  for (let yr = startYr + 1; yr <= 2030; yr++) {
    const progress = (yr - startYr) / (2030 - startYr);
    const projCo2 = Math.round(lastCo2 - progress * (lastCo2 - targetCo2_2030));
    const projEn = Math.round(lastEn - progress * (lastEn - targetEn_2030));

    trajectoryData.push({
      ano: yr.toString(),
      historicoCo2: null,
      historicoEn: null,
      projetadoCo2: projCo2,
      projetadoEn: projEn,
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="card" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderColor: "var(--accent-purple)" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <Compass color="var(--accent-purple)" size={24} style={{ marginTop: "3px" }} />
          <div>
            <h3 style={{ fontSize: "1.2rem", color: "var(--accent-purple)" }}>
              Eixo 3 — Evolução Temporal de CO₂ &amp; Energia e Trajetórias Futuras
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              Acompanha o acoplamento/desacoplamento histórico entre consumo de energia primária ($MJ/m^2$) e emissões de carbono ($kg\ CO_2/m^2$) de 2018 a 2024.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h4 className="card-title">Série Histórica Dupla: Intensidade CO₂ (kg/m²) vs. Energia Incorporada (MJ/m²)</h4>
        <p className="card-subtitle">Permite verificar se a redução histórica ocorreu por eficientização de materiais ou descarbonização da matriz</p>

        <div style={{ width: "100%", height: "320px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="ano" stroke="var(--text-muted)" fontSize={12} />
              <YAxis yAxisId="left" stroke="var(--primary)" fontSize={12} label={{ value: "kg CO₂/m²", angle: -90, position: "insideLeft", fill: "var(--primary)" }} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--accent-amber)" fontSize={12} label={{ value: "MJ/m²", angle: 90, position: "insideRight", fill: "var(--accent-amber)" }} />
              <Tooltip contentStyle={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-color)" }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="co2Medio" name="Intensidade CO₂ Média (kg/m²)" stroke="var(--primary)" strokeWidth={3} dot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" dataKey="enMedio" name="Energia Média Incorporada (MJ/m²)" stroke="var(--accent-amber)" strokeWidth={3} strokeDasharray="4 4" dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h4 className="card-title">Evolução da Participação de Sistemas Construtivos (%)</h4>
        <p className="card-subtitle">Transição tecnológica e maturidade dos sistemas no inventário ao longo dos anos</p>

        <div style={{ width: "100%", height: "280px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="ano" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-color)" }} />
              <Legend />
              <Area type="monotone" dataKey="paredeConcretoPct" name="Parede de Concreto (%)" stackId="1" stroke="#10b981" fill="#10b981" />
              <Area type="monotone" dataKey="alvenariaPct" name="Alvenaria Estrutural (%)" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
              <Area type="monotone" dataKey="vigaPilarPct" name="Viga-Pilar (%)" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ borderColor: "rgba(139, 92, 246, 0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span className="badge badge-purple">
              <Sparkles size={12} style={{ marginRight: "4px" }} /> Simulador Duplo de Trajetória Futura (2025–2030)
            </span>
            <h4 className="card-title" style={{ marginTop: "0.4rem" }}>
              Projeção Integrada: Metas de CO₂ e Redução Energética (2025 – 2030)
            </h4>
            <p className="card-subtitle">Ajuste a meta percentual para visualizar a rampa de transição setorial em carbono e energia</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "var(--bg-panel)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Meta de Redução até 2030:</div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={targetReductionPercent}
              onChange={(e) => setTargetReductionPercent(parseInt(e.target.value))}
              style={{ accentColor: "var(--accent-purple)", width: "120px" }}
            />
            <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--accent-purple)" }}>
              -{targetReductionPercent}%
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "2rem", marginBottom: "1rem", fontSize: "0.85rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
          <div>CO₂ Partida ({lastHistoricalYear}): <strong style={{ color: "#fff" }}>{lastCo2} kg/m²</strong> → Meta 2030: <strong style={{ color: "var(--primary)" }}>{targetCo2_2030} kg/m²</strong></div>
          <div>Energia Partida ({lastHistoricalYear}): <strong style={{ color: "#fff" }}>{lastEn} MJ/m²</strong> → Meta 2030: <strong style={{ color: "var(--accent-amber)" }}>{targetEn_2030} MJ/m²</strong></div>
        </div>

        <div style={{ width: "100%", height: "300px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trajectoryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="ano" stroke="var(--text-muted)" fontSize={12} />
              <YAxis yAxisId="left" stroke="var(--primary)" fontSize={12} label={{ value: "kg CO₂/m²", angle: -90, position: "insideLeft", fill: "var(--primary)" }} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--accent-amber)" fontSize={12} label={{ value: "MJ/m²", angle: 90, position: "insideRight", fill: "var(--accent-amber)" }} />
              <Tooltip contentStyle={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-color)" }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="historicoCo2" name="CO₂ Real (2018-2024)" stroke="var(--primary)" strokeWidth={3} dot={{ r: 5 }} />
              <Line yAxisId="left" type="monotone" dataKey="projetadoCo2" name="CO₂ Projetado (2025-2030)" stroke="var(--primary)" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 5 }} />
              <Line yAxisId="right" type="monotone" dataKey="historicoEn" name="Energia Real (2018-2024)" stroke="var(--accent-amber)" strokeWidth={3} dot={{ r: 5 }} />
              <Line yAxisId="right" type="monotone" dataKey="projetadoEn" name="Energia Projetada (2025-2030)" stroke="var(--accent-amber)" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
