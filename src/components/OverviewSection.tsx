import React from "react";
import type { Unit } from "../types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { Activity, Zap, Info, TrendingDown, Flame, Scale } from "lucide-react";

interface OverviewSectionProps {
  units: Unit[];
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ units }) => {
  const validUnits = units.filter((u) => u.co2[0] !== null);
  const totalUnits = units.length;

  const co2Mins = validUnits.map((u) => u.co2[0]!).sort((a, b) => a - b);
  const co2Maxs = validUnits.map((u) => u.co2[1]!).sort((a, b) => a - b);
  const enMins = validUnits.map((u) => u.en[0]!).filter((v) => v !== null) as number[];
  enMins.sort((a, b) => a - b);

  const avgCo2Min = co2Mins.length ? (co2Mins.reduce((a, b) => a + b, 0) / co2Mins.length).toFixed(1) : "0";
  const avgCo2Max = co2Maxs.length ? (co2Maxs.reduce((a, b) => a + b, 0) / co2Maxs.length).toFixed(1) : "0";

  const avgEnMin = enMins.length ? (enMins.reduce((a, b) => a + b, 0) / enMins.length).toFixed(1) : "0";
  const medianEn = enMins.length ? enMins[Math.floor(enMins.length * 0.5)].toFixed(1) : "0";

  const medianCo2 = co2Mins.length ? co2Mins[Math.floor(co2Mins.length * 0.5)].toFixed(1) : "0";
  const top5Percentile = co2Mins.length ? co2Mins[Math.floor(co2Mins.length * 0.05)].toFixed(1) : "0";

  const totalTonMin = units.reduce((acc, u) => acc + (u.co2_total[0] || 0), 0);
  const totalGjMin = units.reduce((acc, u) => acc + (u.en_total[0] || 0), 0);

  const carbonFactorOfEnergy = (parseFloat(avgEnMin) > 0)
    ? ((parseFloat(avgCo2Min) / parseFloat(avgEnMin)) * 1000).toFixed(1)
    : "0";

  const sysCounts: Record<string, { count: number; co2Sum: number; enSum: number }> = {};
  units.forEach((u) => {
    const sys = u.sistema || "Outros";
    if (!sysCounts[sys]) sysCounts[sys] = { count: 0, co2Sum: 0, enSum: 0 };
    sysCounts[sys].count += 1;
    sysCounts[sys].co2Sum += u.co2[0] || 0;
    sysCounts[sys].enSum += u.en[0] || 0;
  });

  const sysChartData = Object.entries(sysCounts).map(([sys, d]) => ({
    sistema: sys,
    unidades: d.count,
    co2Medio: Math.round(d.co2Sum / (d.count || 1)),
    enMedio: Math.round(d.enSum / (d.count || 1)),
  }));

  const matSum: Record<string, { co2Min: number; enMin: number }> = {};
  units.forEach((u) => {
    u.mats?.forEach((m) => {
      if (!matSum[m.material]) matSum[m.material] = { co2Min: 0, enMin: 0 };
      matSum[m.material].co2Min += m.co2_min || 0;
      matSum[m.material].enMin += m.en_min || 0;
    });
  });

  const matChartData = Object.entries(matSum).map(([mat, d]) => ({
    material: mat,
    co2Min: Math.round(d.co2Min / (totalUnits || 1)),
    enMin: Math.round(d.enMin / (totalUnits || 1)),
  }));

  const enBucketSize = 200;
  const enBuckets: Record<string, number> = {};
  enMins.forEach((v) => {
    const b = Math.floor(v / enBucketSize) * enBucketSize;
    const label = `${b}-${b + enBucketSize}`;
    enBuckets[label] = (enBuckets[label] || 0) + 1;
  });

  const enHistogramData = Object.entries(enBuckets).map(([range, count]) => ({
    faixa: range,
    unidades: count,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="card" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderColor: "var(--primary-glow)" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <Info color="var(--primary)" size={24} style={{ marginTop: "3px" }} />
          <div>
            <h3 style={{ fontSize: "1.2rem", color: "var(--primary)" }}>
              Eixo 1 — Visão Geral: Carbono Incorporado &amp; Energia Incorporada
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              Responde a: <strong>Quanto estamos emitindo e quanta energia os materiais incorporam?</strong> Analisa o desempenho duplo de carbono ($kg\ CO_2/m^2$) e energia primária ($MJ/m^2$).
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Intensidade Média CO₂</span>
            <Activity size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--text-main)", margin: "0.4rem 0" }}>
            {avgCo2Min} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "normal" }}>kg/m²</span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
            Faixa média: {avgCo2Min} – {avgCo2Max} kg/m²
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Energia Média Incorporada</span>
            <Zap size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--accent-amber)", margin: "0.4rem 0" }}>
            {avgEnMin} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "normal" }}>MJ/m²</span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
            Mediana: {medianEn} MJ/m²
          </div>
        </div>

        <div className="card" style={{ borderColor: "rgba(6,182,212,0.4)", background: "rgba(6,182,212,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", fontWeight: "600" }}>Fator Carbônico da Energia</span>
            <Flame size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--accent-cyan)", margin: "0.4rem 0" }}>
            {carbonFactorOfEnergy} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "normal" }}>g CO₂/MJ</span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
            Intensidade de emissão por unidade de energia
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Linha de Base CO₂</span>
            <TrendingDown size={18} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--accent-blue)", margin: "0.4rem 0" }}>
            {medianCo2} <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "normal" }}>kg/m²</span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
            Benchmark Top 5%: {top5Percentile} kg/m²
          </div>
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Totais Acumulados</span>
            <Scale size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "var(--text-main)", margin: "0.4rem 0" }}>
            {(totalTonMin / 1000).toFixed(1)}k <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "normal" }}>tCO₂</span>
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--accent-amber)", fontWeight: "bold" }}>
            {(totalGjMin / 1000).toFixed(1)}k <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", fontWeight: "normal" }}>GJ Energia</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div className="card">
          <h4 className="card-title">Distribuição por Faixa de Energia Incorporada (MJ/m²)</h4>
          <p className="card-subtitle">Frequência de unidades habitacionais por consumo energético primário</p>

          <div style={{ width: "100%", height: "280px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enHistogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="faixa" stroke="var(--text-dim)" fontSize={11} />
                <YAxis stroke="var(--text-dim)" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-color)", color: "#fff" }}
                  formatter={(val: any) => [`${val} unidades`, "Frequência"]}
                />
                <Bar dataKey="unidades" fill="var(--accent-amber)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h4 className="card-title">CO₂ e Energia Média por Sistema Estrutural</h4>
          <p className="card-subtitle">Comparativo de pegada de carbono (kg/m²) e demanda energética (MJ/m²)</p>

          <div style={{ width: "100%", height: "280px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sysChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="sistema" stroke="var(--text-muted)" fontSize={11} />
                <YAxis yAxisId="left" stroke="var(--primary)" fontSize={11} label={{ value: "kg CO₂/m²", angle: -90, position: "insideLeft", fill: "var(--primary)" }} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--accent-amber)" fontSize={11} label={{ value: "MJ/m²", angle: 90, position: "insideRight", fill: "var(--accent-amber)" }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-color)" }} />
                <Legend />
                <Bar yAxisId="left" dataKey="co2Medio" name="CO₂ Média (kg/m²)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="enMedio" name="Energia Média (MJ/m²)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <h4 className="card-title">Decomposição Dupla de Materiais: CO₂ Mínimo (kg/m²) vs. Energia (MJ/m²)</h4>
        <p className="card-subtitle">Massa de carbono e gasto energético por insumo estrutural</p>

        <div style={{ width: "100%", height: "260px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={matChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <XAxis dataKey="material" stroke="var(--text-muted)" fontSize={12} />
              <YAxis yAxisId="left" stroke="#10b981" fontSize={12} label={{ value: "kg CO₂/m²", angle: -90, position: "insideLeft", fill: "#10b981" }} />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={12} label={{ value: "MJ/m²", angle: 90, position: "insideRight", fill: "#f59e0b" }} />
              <Tooltip contentStyle={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-color)" }} />
              <Legend />
              <Bar yAxisId="left" dataKey="co2Min" name="Carbono Mínimo (kg CO₂/m²)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="enMin" name="Energia Mínima (MJ/m²)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
