import { useState, useMemo } from "react";
import type { Unit } from "../types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ScatterChart,
  Scatter,
  ZAxis,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Activity,
} from "lucide-react";

interface ConstructorYearAgg {
  construtora: string;
  ano: number;
  co2Media: number;
  co2Total: number;
  numUnidades: number;
}

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
  "#14b8a6", "#e11d48", "#a855f7", "#0ea5e9", "#22c55e",
  "#eab308", "#ef4444", "#d946ef", "#0d9488", "#7c3aed",
  "#2563eb", "#16a34a", "#ca8a04", "#dc2626", "#9333ea",
  "#0891b2", "#65a30d", "#ea580c", "#4f46e5", "#059669",
  "#d97706", "#b91c1c", "#7e22ce", "#0284c7", "#15803d",
  "#a16207", "#be123c", "#6b21a8", "#0369a1", "#166534",
  "#854d0e", "#9f1239", "#581c87", "#075985", "#14532d",
  "#713f12", "#881337", "#3b0764", "#0c4a6e", "#064e3b",
];

export function PeriodSelector({
  value,
  min,
  max,
  onChange,
}: {
  value: [number, number];
  min: number;
  max: number;
  onChange: (next: [number, number]) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
      <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Periodo:</label>
      <input
        type="range"
        min={min}
        max={max}
        value={value[0]}
        onChange={(e) => {
          const v = parseInt(e.target.value);
          onChange([Math.min(v, value[1]), value[1]]);
        }}
        style={{ width: "110px", accentColor: "var(--primary)" }}
        title="Ano inicial do periodo"
      />
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)", minWidth: "96px", textAlign: "center" }}>
        {value[0]} – {value[1]}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value[1]}
        onChange={(e) => {
          const v = parseInt(e.target.value);
          onChange([value[0], Math.max(v, value[0])]);
        }}
        style={{ width: "110px", accentColor: "var(--primary)" }}
        title="Ano final do periodo"
      />
    </div>
  );
}

export function GrafReq1Section({ units }: { units: Unit[] }) {
  const [yearRange, setYearRange] = useState<[number, number]>([1995, 2025]);
  const [selectedConstructors, setSelectedConstructors] = useState<string[]>([]);
  const [selectedForLines, setSelectedForLines] = useState<string[]>([]);
  const [barCount, setBarCount] = useState<number>(15);
  const [compPeriod, setCompPeriod] = useState<[number, number]>([1995, 2025]);

  const updateYearRange = (next: [number, number]) => {
    setYearRange(next);
    setCompPeriod(next);
  };

  const filteredUnits = useMemo(
    () =>
      units.filter(
        (u) =>
          u.ano != null &&
          u.ano >= yearRange[0] &&
          u.ano <= yearRange[1] &&
          u.co2[0] != null &&
          u.co2[0] > 0
      ),
    [units, yearRange]
  );

  const allConstructors = useMemo(() => {
    const s = new Set<string>();
    filteredUnits.forEach((u) => s.add(u.construtora));
    return Array.from(s).sort();
  }, [filteredUnits]);

  const effectiveConstructors = useMemo(() => {
    if (selectedConstructors.length > 0) return selectedConstructors;
    return allConstructors;
  }, [selectedConstructors, allConstructors]);

  const allYears = useMemo(() => {
    const s = new Set<number>();
    filteredUnits.forEach((u) => { if (u.ano) s.add(u.ano); });
    return Array.from(s).sort((a, b) => a - b);
  }, [filteredUnits]);

  const aggData = useMemo<ConstructorYearAgg[]>(() => {
    const map: Record<string, { co2Sum: number; co2TotalSum: number; count: number }> = {};
    filteredUnits.forEach((u) => {
      const key = `${u.construtora}|${u.ano}`;
      if (!map[key]) map[key] = { co2Sum: 0, co2TotalSum: 0, count: 0 };
      map[key].co2Sum += u.co2[0]!;
      map[key].co2TotalSum += u.co2_total?.[0] ?? 0;
      map[key].count += 1;
    });
    return Object.entries(map).map(([key, d]) => {
      const [construtora, anoStr] = key.split("|");
      return {
        construtora,
        ano: parseInt(anoStr),
        co2Media: parseFloat((d.co2Sum / d.count).toFixed(2)),
        co2Total: parseFloat(d.co2TotalSum.toFixed(2)),
        numUnidades: d.count,
      };
    });
  }, [filteredUnits]);

  const filteredAgg = useMemo(
    () => aggData.filter((d) => effectiveConstructors.includes(d.construtora)),
    [aggData, effectiveConstructors]
  );

  const buildConstructorAvg = (rows: ConstructorYearAgg[]) => {
    const map: Record<string, { sum: number; count: number; minCo2: number; maxCo2: number }> = {};
    rows.forEach((d) => {
      if (!map[d.construtora]) map[d.construtora] = { sum: 0, count: 0, minCo2: d.co2Media, maxCo2: d.co2Media };
      map[d.construtora].sum += d.co2Media;
      map[d.construtora].count += 1;
      map[d.construtora].minCo2 = Math.min(map[d.construtora].minCo2, d.co2Media);
      map[d.construtora].maxCo2 = Math.max(map[d.construtora].maxCo2, d.co2Media);
    });
    return Object.entries(map)
      .map(([construtora, d]) => ({
        construtora,
        co2Media: parseFloat((d.sum / d.count).toFixed(2)),
        co2Min: d.minCo2,
        co2Max: d.maxCo2,
        numAnos: d.count,
      }))
      .sort((a, b) => b.co2Media - a.co2Media);
  };

  const compFilteredAgg = useMemo(
    () => filteredAgg.filter((d) => d.ano >= compPeriod[0] && d.ano <= compPeriod[1]),
    [filteredAgg, compPeriod]
  );
  const compConstructorAvg = useMemo(() => buildConstructorAvg(compFilteredAgg), [compFilteredAgg]);

  const sortedConstructorList = useMemo(
    () => [...effectiveConstructors].sort(),
    [effectiveConstructors]
  );

  const topBarData = useMemo(() => compConstructorAvg.slice(0, barCount), [compConstructorAvg, barCount]);
  const bestBarData = useMemo(
    () => [...compConstructorAvg].sort((a, b) => a.co2Media - b.co2Media).slice(0, barCount),
    [compConstructorAvg, barCount]
  );

  const globalStats = useMemo(() => {
    const vals = filteredAgg.map((d) => d.co2Media);
    if (!vals.length) return { mean: 0, std: 0, min: 0, max: 0 };
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
    const std = Math.sqrt(variance);
    return { mean, std, min: Math.min(...vals), max: Math.max(...vals) };
  }, [filteredAgg]);

  const lineDataByYear = useMemo(() => {
    return allYears.map((ano) => {
      const row: Record<string, number | string> = { ano };
      filteredAgg.forEach((d) => {
        if (d.ano === ano) row[d.construtora] = d.co2Media;
      });
      return row;
    });
  }, [allYears, filteredAgg]);

  const visibleLineConstructors = useMemo(() => {
    if (selectedForLines.length > 0) {
      return effectiveConstructors.filter((c) => selectedForLines.includes(c));
    }
    return effectiveConstructors;
  }, [effectiveConstructors, selectedForLines]);

  const bubbleData = useMemo(
    () =>
      filteredAgg.map((d) => ({
        ...d,
        name: `${d.construtora} (${d.ano})`,
        z: d.numUnidades,
      })),
    [filteredAgg]
  );

  const controlData = useMemo(() => {
    return [...filteredAgg]
      .sort((a, b) => a.ano - b.ano || a.construtora.localeCompare(b.construtora))
      .map((d) => ({ id: `${d.construtora}-${d.ano}`, name: `${d.ano}-${d.construtora}`, construtora: d.construtora, ano: d.ano, co2Media: d.co2Media }));
  }, [filteredAgg]);

  const firstYearTickNames = useMemo(() => {
    const seen = new Set<number>();
    const out = new Set<string>();
    controlData.forEach((d) => {
      if (!seen.has(d.ano)) {
        seen.add(d.ano);
        out.add(d.name);
      }
    });
    return out;
  }, [controlData]);

  const handleLineSelectionChange = (values: string[]) => {
    setSelectedForLines(values);
  };

  const selectedMin = yearRange[0];
  const selectedMax = yearRange[1];

  return (
    <div className="section">
      <div style={{ marginBottom: "1.5rem" }}>
        <span className="badge badge-blue" style={{ marginBottom: "0.5rem", display: "inline-flex" }}>
          <BarChart3 size={12} style={{ marginRight: "4px" }} /> Requisito 1
        </span>
        <h2 style={{ fontSize: "1.4rem", color: "var(--text-main)", marginTop: "0.4rem" }}>
          Emissao de CO2 medio por Construtora ao longo do Tempo
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
          Visualizacoes de alta viabilidade para explorar a emissao media por construtora em relacao ao periodo de tempo.
        </p>
      </div>

      <div
        className="card"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1.5rem",
          alignItems: "flex-end",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ flex: 1, minWidth: "220px" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--text-dim)", display: "block", marginBottom: "0.3rem" }}>
            Intervalo de Anos
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="range"
              min={1995}
              max={2025}
              value={selectedMin}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                updateYearRange([Math.min(v, selectedMax), selectedMax]);
              }}
              style={{ flex: 1, accentColor: "var(--primary)" }}
            />
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--primary)", minWidth: "70px", textAlign: "center" }}>
              {selectedMin} – {selectedMax}
            </span>
            <input
              type="range"
              min={1995}
              max={2025}
              value={selectedMax}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                updateYearRange([selectedMin, Math.max(v, selectedMin)]);
              }}
              style={{ flex: 1, accentColor: "var(--primary)" }}
            />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: "260px" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--text-dim)", display: "block", marginBottom: "0.3rem" }}>
            Construtoras ({selectedConstructors.length === 0 ? "todas" : `${selectedConstructors.length} selecionadas`})
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", maxHeight: "60px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "0.4rem" }}>
            {sortedConstructorList.map((c) => {
              const active = selectedConstructors.length === 0 || selectedConstructors.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => {
                    setSelectedConstructors((prev) => {
                      if (prev.length === 0) {
                        return sortedConstructorList.filter((x) => x !== c);
                      }
                      if (prev.includes(c)) {
                        const next = prev.filter((x) => x !== c);
                        return next.length === 0 ? [] : next;
                      }
                      return [...prev, c];
                    });
                  }}
                  style={{
                    fontSize: "0.65rem",
                    padding: "0.15rem 0.4rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid",
                    borderColor: active ? "var(--primary)" : "var(--border-color)",
                    background: active ? "rgba(59, 130, 246, 0.15)" : "transparent",
                    color: active ? "var(--primary)" : "var(--text-dim)",
                    cursor: "pointer",
                    fontWeight: active ? 700 : 400,
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => { updateYearRange([1995, 2025]); setSelectedConstructors([]); setSelectedForLines([]); setBarCount(15); }}
          style={{ fontSize: "0.8rem", alignSelf: "flex-end" }}
        >
          Resetar Filtros
        </button>
      </div>

      <div className="card" style={{ borderColor: "rgba(59, 130, 246, 0.4)", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <BarChart3 size={16} color="var(--primary)" />
          <h3 className="card-title" style={{ margin: 0 }}>Comparacao entre Construtoras</h3>
        </div>
        <p className="card-subtitle">
          CO2 medio (kg/m2) por construtora no periodo <strong style={{ color: "var(--primary)" }}>{compPeriod[0]} – {compPeriod[1]}</strong>. Piores (vermelho) vs Melhores (verde). Arraste o slider para ajustar quantas mostrar.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
          <PeriodSelector
            value={compPeriod}
            min={allYears[0] ?? 1995}
            max={allYears[allYears.length - 1] ?? 2025}
            onChange={setCompPeriod}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Quantidade (N):</label>
            <input
              type="range"
              min={5}
              max={Math.min(30, compConstructorAvg.length)}
              value={barCount}
              onChange={(e) => setBarCount(parseInt(e.target.value))}
              style={{ width: "110px", accentColor: "var(--primary)" }}
            />
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)" }}>{barCount}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "stretch" }}>
          <div>
            <div style={{ textAlign: "center", fontSize: "0.8rem", fontWeight: 700, color: "#f43f5e", marginBottom: "0.5rem" }}>
              Piores Construtoras (maior CO2)
            </div>
            <div style={{ width: "100%", height: Math.max(280, barCount * 28) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topBarData} layout="vertical" margin={{ top: 4, right: 40, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis type="number" stroke="var(--text-dim)" fontSize={10} />
                  <YAxis type="category" dataKey="construtora" width={90} stroke="var(--text-dim)" fontSize={10} />
                  <Tooltip
                    content={({ payload }) => {
                      if (payload && payload.length) {
                        const d = payload[0].payload as { construtora: string; co2Media: number; numAnos: number };
                        return (
                          <div style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border-color)", padding: "0.6rem 0.75rem", borderRadius: "8px" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{d.construtora}</div>
                            <div style={{ fontSize: "0.8rem", color: "#fff" }}>{d.co2Media} kg/m2</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{d.numAnos} anos</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="co2Media" radius={[0, 4, 4, 0]}>
                    {topBarData.map((_, i) => (
                      <Cell key={i} fill="#f43f5e" fillOpacity={0.85 - i * 0.015} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <div style={{ textAlign: "center", fontSize: "0.8rem", fontWeight: 700, color: "#10b981", marginBottom: "0.5rem" }}>
              Melhores Construtoras (menor CO2)
            </div>
            <div style={{ width: "100%", height: Math.max(280, barCount * 28) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bestBarData} layout="vertical" margin={{ top: 4, right: 40, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis type="number" stroke="var(--text-dim)" fontSize={10} />
                  <YAxis type="category" dataKey="construtora" width={90} stroke="var(--text-dim)" fontSize={10} />
                  <Tooltip
                    content={({ payload }) => {
                      if (payload && payload.length) {
                        const d = payload[0].payload as { construtora: string; co2Media: number; numAnos: number };
                        return (
                          <div style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border-color)", padding: "0.6rem 0.75rem", borderRadius: "8px" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{d.construtora}</div>
                            <div style={{ fontSize: "0.8rem", color: "#fff" }}>{d.co2Media} kg/m2</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{d.numAnos} anos</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="co2Media" radius={[0, 4, 4, 0]}>
                    {bestBarData.map((_, i) => (
                      <Cell key={i} fill="#10b981" fillOpacity={0.9 - i * 0.02} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ borderColor: "rgba(59, 130, 246, 0.4)", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <BarChart3 size={16} color="var(--primary)" />
          <h3 className="card-title" style={{ margin: 0 }}>Dot Plot com Erro (Min / Max)</h3>
        </div>
        <p className="card-subtitle">
          CO2 medio por construtora no periodo <strong style={{ color: "var(--primary)" }}>{compPeriod[0]} – {compPeriod[1]}</strong>, com barra indicando o intervalo minimo e maximo observado.
        </p>

        <div style={{ marginBottom: "0.75rem" }}>
          <PeriodSelector
            value={compPeriod}
            min={allYears[0] ?? 1995}
            max={allYears[allYears.length - 1] ?? 2025}
            onChange={setCompPeriod}
          />
        </div>

        <div style={{ width: "100%", height: 420 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={[...compConstructorAvg].map((d) => ({
                ...d,
                errLow: d.co2Min,
                errRange: d.co2Max - d.co2Min,
              })).reverse()}
              margin={{ top: 8, right: 24, left: 4, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis type="category" dataKey="construtora" interval={0} angle={-45} textAnchor="end"
                height={100} stroke="var(--text-dim)" fontSize={9} />
              <YAxis type="number" domain={[0, (dataMax: number) => dataMax + 5]} stroke="var(--text-dim)" fontSize={10}
                label={{ value: "CO2 (kg/m2)", angle: -90, position: "insideLeft", fontSize: 10, fill: "var(--text-dim)" }} />
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload.length) {
                    const d = payload[0].payload as { construtora: string; co2Media: number; co2Min: number; co2Max: number };
                    return (
                      <div style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border-color)", padding: "0.6rem 0.75rem", borderRadius: "8px" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{d.construtora}</div>
                        <div style={{ fontSize: "0.8rem", color: "#fff" }}>Media: {d.co2Media} kg/m2</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Min-Max: {d.co2Min} - {d.co2Max} kg/m2</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="errLow" stackId="err" barSize={3} fill="transparent" />
              <Bar dataKey="errRange" stackId="err" barSize={3} fill="#94a3b8" fillOpacity={0.8} />
              <Line type="linear" dataKey="co2Media" stroke="var(--primary)" strokeWidth={1.5} dot={{ r: 3.5, fill: "var(--primary)" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ borderColor: "rgba(59, 130, 246, 0.4)", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <BarChart3 size={16} color="var(--primary)" />
          <h3 className="card-title" style={{ margin: 0 }}>Heatmap Construtora x Ano</h3>
        </div>
        <p className="card-subtitle">Intensidade de CO2 medio por construtora e ano. Cores: verde (baixo) -&gt; vermelho (alto).</p>

        <HeatmapChart data={filteredAgg} years={allYears} constructors={effectiveConstructors} />
      </div>

      <div className="card" style={{ borderColor: "rgba(16, 185, 129, 0.4)", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <TrendingUp size={16} color="#10b981" />
          <h3 className="card-title" style={{ margin: 0 }}>Tendencias Temporais</h3>
        </div>
        <p className="card-subtitle">Evolucao do CO2 medio por construtora ao longo dos anos.</p>

        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginBottom: "0.3rem", display: "block" }}>
            Multi-selecao de construtoras para exibir no grafico (Ctrl/Shift para selecionar varias):
          </label>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <select
              multiple
              value={selectedForLines.length > 0 ? selectedForLines : effectiveConstructors}
              onChange={(e) => {
                const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                handleLineSelectionChange(opts);
              }}
              style={{
                minHeight: "80px",
                maxHeight: "120px",
                minWidth: "260px",
                fontSize: "0.75rem",
                background: "var(--bg-panel)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-main)",
                padding: "0.3rem",
              }}
            >
              {sortedConstructorList.map((c) => (
                <option key={c} value={c} style={{ padding: "1px 4px" }}>
                  {c}
                </option>
              ))}
            </select>
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedForLines([])}
              style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
            >
              Selecionar todas
            </button>
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginTop: "0.3rem" }}>
            {visibleLineConstructors.length} de {effectiveConstructors.length} construtoras visiveis.
          </div>
        </div>

        <div style={{ width: "100%", height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={lineDataByYear} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="ano" stroke="var(--text-dim)" fontSize={10} />
              <YAxis stroke="var(--text-dim)" fontSize={10} label={{ value: "CO2 (kg/m2)", angle: -90, position: "insideLeft", fontSize: 10, fill: "var(--text-dim)" }} />
              <Tooltip contentStyle={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border-color)", borderRadius: "8px" }} />
              {visibleLineConstructors.map((c) => {
                const idx = sortedConstructorList.indexOf(c);
                return (
                  <Line
                    key={c}
                    type="monotone"
                    dataKey={c}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ borderColor: "rgba(245, 158, 11, 0.4)", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <AlertTriangle size={16} color="#f59e0b" />
          <h3 className="card-title" style={{ margin: 0 }}>Deteccao de Outliers</h3>
        </div>
        <p className="card-subtitle">Control Chart do CO2 medio por construtora (agrupado por ano no eixo X) com linhas de media e desvio padrao.</p>

        <div style={{ width: "100%", height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={controlData}
              margin={{ top: 30, right: 16, left: 4, bottom: 24 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" interval={0} tickFormatter={(v: string) => (v.includes("-") && firstYearTickNames.has(v) ? String(Number(v.split("-")[0])) : "")}
                angle={-45} textAnchor="end" height={70} tick={{ fontSize: 9, fill: "var(--text-dim)" }} />
              <YAxis stroke="var(--text-dim)" fontSize={10} domain={[globalStats.min - 10, globalStats.max + 10]} label={{ value: "CO2 (kg/m2)", angle: -90, position: "insideLeft", fontSize: 10, fill: "var(--text-dim)" }} />
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload.length) {
                    const d = payload[0].payload as { construtora: string; ano: number; co2Media: number };
                    return (
                      <div style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border-color)", padding: "0.6rem 0.75rem", borderRadius: "8px" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{d.construtora}</div>
                        <div style={{ fontSize: "0.8rem", color: "#fff" }}>{d.ano} — CO2: {d.co2Media} kg/m2</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={globalStats.mean} stroke="#10b981" strokeWidth={2} label={{ value: "Media", position: "insideTopRight", fill: "#10b981", fontSize: 10 }} />
              <ReferenceLine y={globalStats.mean + globalStats.std} stroke="#f59e0b" strokeDasharray="5 3" label={{ value: "+1s", position: "insideTopRight", fill: "#f59e0b", fontSize: 9 }} />
              <ReferenceLine y={globalStats.mean - globalStats.std} stroke="#f59e0b" strokeDasharray="5 3" label={{ value: "-1s", position: "insideBottomRight", fill: "#f59e0b", fontSize: 9 }} />
              <ReferenceLine y={globalStats.mean + 2 * globalStats.std} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: "+2s", position: "insideTopRight", fill: "#f43f5e", fontSize: 9 }} />
              <ReferenceLine y={globalStats.mean - 2 * globalStats.std} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: "-2s", position: "insideBottomRight", fill: "#f43f5e", fontSize: 9 }} />
              <Line type="linear" dataKey="co2Media" stroke="var(--primary)" strokeWidth={1.5} dot={{ r: 2, fill: "var(--primary)" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card" style={{ borderColor: "rgba(139, 92, 246, 0.4)", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <Activity size={16} color="#8b5cf6" />
          <h3 className="card-title" style={{ margin: 0 }}>Bubble Chart (Visao Geral)</h3>
        </div>
        <p className="card-subtitle">X = Ano, Y = CO2 medio, Tamanho = numero de unidades. Cada bolha = construtora + ano.</p>

        <div style={{ width: "100%", height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 16, left: 4, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              {allYears.map((y) => (
                <ReferenceLine key={y} x={y} stroke="var(--border-color)" strokeDasharray="2 4" strokeOpacity={0.6} />
              ))}
              <XAxis type="number" dataKey="ano" name="Ano" domain={[allYears[0], allYears[allYears.length - 1]]} ticks={allYears} interval={0} stroke="var(--text-dim)" fontSize={10} tick={{ fontSize: 8 }} />
              <YAxis type="number" dataKey="co2Media" name="CO2" stroke="var(--text-dim)" fontSize={10} label={{ value: "CO2 (kg/m2)", angle: -90, position: "insideLeft", fontSize: 10, fill: "var(--text-dim)" }} />
              <ZAxis dataKey="z" range={[30, 250]} />
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload.length) {
                    const d = payload[0].payload as ConstructorYearAgg & { z: number };
                    return (
                      <div style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border-color)", padding: "0.6rem 0.75rem", borderRadius: "8px", maxWidth: "250px" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{d.construtora}</div>
                        <div style={{ fontSize: "0.8rem", color: "#fff" }}>Ano: {d.ano}</div>
                        <div style={{ fontSize: "0.8rem", color: "#fff" }}>CO2: {d.co2Media} kg/m2</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{d.numUnidades} unidades</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter data={bubbleData} fill="#8b5cf6" fillOpacity={0.5} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function HeatmapChart({
  data,
  years,
  constructors,
}: {
  data: ConstructorYearAgg[];
  years: number[];
  constructors: string[];
}) {
  const valueRange = useMemo(() => {
    const vals = data.map((d) => d.co2Media);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [data]);

  const getColor = (val: number) => {
    const t = Math.max(0, Math.min(1, (val - valueRange.min) / (valueRange.max - valueRange.min || 1)));
    if (t < 0.25) return `rgba(16, 185, 129, ${0.2 + t * 3})`;
    if (t < 0.5) return `rgba(234, 179, 8, ${0.3 + (t - 0.25) * 2.8})`;
    if (t < 0.75) return `rgba(249, 115, 22, ${0.3 + (t - 0.5) * 2.8})`;
    return `rgba(239, 68, 68, ${0.4 + (t - 0.75) * 2.4})`;
  };

  const displayConstructors = constructors.slice(0, 30);
  const displayYears = years.filter((y) => y >= 2010);

  return (
    <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "500px" }}>
      <table style={{ borderCollapse: "collapse", fontSize: "0.6rem", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ position: "sticky", left: 0, background: "var(--bg-card)", zIndex: 1, padding: "2px 4px", textAlign: "left", border: "1px solid var(--border-color)", minWidth: "70px" }}>
              Construtora
            </th>
            {displayYears.map((y) => (
              <th key={y} style={{ padding: "2px 3px", textAlign: "center", border: "1px solid var(--border-color)", minWidth: "32px" }}>
                {y}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayConstructors.map((c) => (
            <tr key={c}>
              <td style={{ position: "sticky", left: 0, background: "var(--bg-card)", zIndex: 1, padding: "2px 4px", fontWeight: 700, border: "1px solid var(--border-color)", whiteSpace: "nowrap" }}>
                {c}
              </td>
              {displayYears.map((y) => {
                const cell = data.find((d) => d.construtora === c && d.ano === y);
                return (
                  <td
                    key={y}
                    title={cell ? `${c} (${y}): ${cell.co2Media} kg/m2` : `${c} (${y}): sem dados`}
                    style={{
                      padding: "2px 3px",
                      textAlign: "center",
                      border: "1px solid var(--border-color)",
                      background: cell ? getColor(cell.co2Media) : "transparent",
                      color: cell ? "#fff" : "var(--text-dim)",
                      fontWeight: cell ? 700 : 400,
                    }}
                  >
                    {cell ? cell.co2Media : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {constructors.length > 30 && (
        <p style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginTop: "0.5rem" }}>
          Mostrando 30 de {constructors.length} construtoras. Use o filtro para reduzir.
        </p>
      )}
    </div>
  );
}
