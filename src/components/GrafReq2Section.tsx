import { useState, useMemo } from "react";
import type { Unit } from "../types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  Cell,
  Treemap,
} from "recharts";
import { MapPin, BarChart3, TrendingUp } from "lucide-react";
import { PeriodSelector } from "./GrafReq1Section";

interface LocationStat {
  name: string;
  projetos: number;
  unidades: number;
  pct: number;
}

const densityColor = (value: number, max: number) => {
  if (max <= 0) return "#0d9488";
  const t = Math.log(value + 1) / Math.log(max + 1);
  const r = Math.round(5 + (244 - 5) * t);
  const g = Math.round(150 + (63 - 150) * t);
  const b = Math.round(101 + (94 - 101) * t);
  return `rgb(${r}, ${g}, ${b})`;
};

const buildPareto = (rows: LocationStat[], total: number) => {
  let acc = 0;
  const safeTotal = total || 1;
  return rows.map((r) => {
    acc += r.projetos;
    return { ...r, cum: acc, cumPct: parseFloat(((acc / safeTotal) * 100).toFixed(1)) };
  });
};

function LocationTooltip({ payload }: { payload?: Array<{ payload: LocationStat & { cum?: number; cumPct?: number } }> }) {
  if (!payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border-color)", padding: "0.6rem 0.75rem", borderRadius: "8px" }}>
      <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{d.name}</div>
      <div style={{ fontSize: "0.8rem", color: "#fff" }}>{d.projetos} projetos</div>
      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{d.pct}% do total · {d.unidades} unidades</div>
      {typeof d.cumPct === "number" && (
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Acumulado: {d.cumPct}%</div>
      )}
    </div>
  );
}

type TreeMover = { name: string; value: number } | null;

function TreeMapContent(props: Record<string, unknown>) {
  const x = Number(props.x ?? 0);
  const y = Number(props.y ?? 0);
  const width = Number(props.width ?? 0);
  const height = Number(props.height ?? 0);
  const depth = Number(props.depth ?? 0);
  const name = String(props.name ?? "");
  const value = Number(props.value ?? 0);
  const maxCity = Number(props.maxCity ?? 1);
  const onHover = props.onHover as (h: TreeMover) => void;

  if (depth === 2) {
    const fill = densityColor(value, maxCity);
    const showName = width > 52;
    const showValue = width > 60 && height > 30;
    return (
      <g
        onMouseEnter={() => onHover({ name, value })}
        onMouseLeave={() => onHover(null)}
      >
        <rect x={x} y={y} width={width} height={height} fill={fill} stroke="var(--bg-card)" strokeWidth={1} rx={2} />
        {showName && (
          <text x={x + 4} y={y + (showValue ? 14 : height / 2 + 3)} fontSize={10} fontWeight={700} fill="#fff" style={{ pointerEvents: "none" }}>
            {name}
          </text>
        )}
        {showValue && (
          <text x={x + 4} y={y + 26} fontSize={9} fill="rgba(255,255,255,0.8)" style={{ pointerEvents: "none" }}>
            {value} projetos
          </text>
        )}
      </g>
    );
  }
  if (depth === 1) {
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="rgba(255,255,255,0.05)"
        stroke="rgba(148,163,184,0.35)"
        strokeWidth={1}
        rx={2}
      />
    );
  }
  return <g />;
}

export function GrafReq2Section({ units }: { units: Unit[] }) {
  const allYears = useMemo(() => {
    const s = new Set<number>();
    units.forEach((u) => { if (u.ano) s.add(u.ano); });
    return Array.from(s).sort((a, b) => a - b);
  }, [units]);

  const [period, setPeriod] = useState<[number, number]>([1995, 2025]);
  const [topN, setTopN] = useState<number>(12);
  const [tmTop, setTmTop] = useState<number>(8);

  const effPeriod = useMemo<[number, number]>(
    () => [
      Math.max(period[0], allYears[0] ?? period[0]),
      Math.min(period[1], allYears[allYears.length - 1] ?? period[1]),
    ],
    [period, allYears]
  );

  const periodUnits = useMemo(
    () => units.filter((u) => u.ano != null && u.ano >= effPeriod[0] && u.ano <= effPeriod[1]),
    [units, effPeriod]
  );

  const stats = useMemo(() => {
    const byEst = new Map<string, { name: string; proj: Set<string>; unidades: number }>();
    const byCid = new Map<string, { name: string; proj: Set<string>; unidades: number }>();
    const byCidInState = new Map<string, Map<string, { name: string; proj: Set<string>; unidades: number }>>();

    periodUnits.forEach((u) => {
      const estName = u.estado || "—";
      const est = byEst.get(estName) || { name: estName, proj: new Set<string>(), unidades: 0 };
      est.proj.add(u.projeto);
      est.unidades += 1;
      byEst.set(estName, est);

      const cidKey = (u.cidade || "—").trim().toLocaleLowerCase("pt-BR");
      const cid = byCid.get(cidKey) || { name: u.cidade || "—", proj: new Set<string>(), unidades: 0 };
      cid.proj.add(u.projeto);
      cid.unidades += 1;
      byCid.set(cidKey, cid);

      if (!byCidInState.has(estName)) byCidInState.set(estName, new Map());
      const inState = byCidInState.get(estName)!;
      const c2 = inState.get(cidKey) || { name: u.cidade || "—", proj: new Set<string>(), unidades: 0 };
      c2.proj.add(u.projeto);
      c2.unidades += 1;
      inState.set(cidKey, c2);
    });

    const totalProj = new Set(periodUnits.map((u) => u.projeto)).size;
    const toRows = (map: Map<string, { name: string; proj: Set<string>; unidades: number }>): LocationStat[] =>
      [...map.values()]
        .map((v) => ({
          name: v.name,
          projetos: v.proj.size,
          unidades: v.unidades,
          pct: parseFloat(((v.proj.size / (totalProj || 1)) * 100).toFixed(1)),
        }))
        .sort((a, b) => b.projetos - a.projetos);

    const estados = toRows(byEst);
    const cidades = toRows(byCid);
    const maxCityCount = Math.max(0, ...cidades.map((c) => c.projetos));

    const treemap = estados
      .map((e) => ({
        name: e.name,
        children: [...(byCidInState.get(e.name)?.values() ?? [])]
          .map((c) => ({ name: c.name, size: c.proj.size }))
          .sort((a, b) => b.size - a.size)
          .slice(0, tmTop),
      }))
      .filter((e) => e.children.length > 0);

    return { totalProj, totalUnidades: periodUnits.length, estados, cidades, treemap, maxCityCount };
  }, [periodUnits, tmTop]);

  const stateTop = useMemo(() => stats.estados.slice(0, topN), [stats.estados, topN]);
  const cityTop = useMemo(() => stats.cidades.slice(0, topN), [stats.cidades, topN]);
  const paretoState = useMemo(() => buildPareto(stats.estados, stats.totalProj), [stats.estados, stats.totalProj]);
  const paretoCity = useMemo(() => buildPareto(stats.cidades, stats.totalProj), [stats.cidades, stats.totalProj]);
  const maxEstado = stats.estados[0]?.projetos ?? 1;
  const maxCidade = stats.cidades[0]?.projetos ?? 1;

  const [hovered, setHovered] = useState<TreeMover>(null);

  return (
    <div className="section">
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
          <PeriodSelector value={effPeriod} min={allYears[0] ?? 1995} max={allYears[allYears.length - 1] ?? 2025} onChange={(n) => setPeriod(n)} />
          <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
            <strong style={{ color: "var(--primary)" }}>{stats.totalProj}</strong> projetos distintos · <strong style={{ color: "var(--primary)" }}>{stats.totalUnidades}</strong> unidades no periodo
          </div>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => { setPeriod([allYears[0] ?? 1995, allYears[allYears.length - 1] ?? 2025]); setTopN(12); setTmTop(8); }}
          style={{ fontSize: "0.8rem" }}
        >
          Resetar Filtros
        </button>
      </div>

      <div className="card" style={{ borderColor: "rgba(139, 92, 246, 0.4)", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <MapPin size={16} color="#8b5cf6" />
          <h3 className="card-title" style={{ margin: 0 }}>Top Estados e Municipios por Projetos</h3>
        </div>
        <p className="card-subtitle">
          Maior concentracao de <strong style={{ color: "var(--primary)" }}>{stats.totalProj}</strong> projetos distintos por local no periodo <strong style={{ color: "var(--primary)" }}>{effPeriod[0]} – {effPeriod[1]}</strong>. Cores: teal (menos) -&gt; vermelho (mais).
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Top N por painel:</label>
          <input
            type="range"
            min={5}
            max={Math.min(20, Math.max(5, stats.estados.length))}
            value={topN}
            onChange={(e) => setTopN(parseInt(e.target.value))}
            style={{ width: "150px", accentColor: "var(--primary)" }}
          />
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)" }}>{topN}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "stretch" }}>
          <div>
            <div style={{ textAlign: "center", fontSize: "0.8rem", fontWeight: 700, color: "#8b5cf6", marginBottom: "0.5rem" }}>
              Estados ({stats.estados.length})
            </div>
            <div style={{ width: "100%", height: Math.max(260, stateTop.length * 26) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateTop} layout="vertical" margin={{ top: 4, right: 40, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis type="number" stroke="var(--text-dim)" fontSize={10} />
                  <YAxis type="category" dataKey="name" width={110} stroke="var(--text-dim)" fontSize={10} />
                  <Tooltip content={<LocationTooltip />} />
                  <Bar dataKey="projetos" radius={[0, 4, 4, 0]}>
                    {stateTop.map((r) => (
                      <Cell key={r.name} fill={densityColor(r.projetos, maxEstado)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <div style={{ textAlign: "center", fontSize: "0.8rem", fontWeight: 700, color: "#8b5cf6", marginBottom: "0.5rem" }}>
              Municipios ({stats.cidades.length})
            </div>
            <div style={{ width: "100%", height: Math.max(260, cityTop.length * 26) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityTop} layout="vertical" margin={{ top: 4, right: 40, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis type="number" stroke="var(--text-dim)" fontSize={10} />
                  <YAxis type="category" dataKey="name" width={130} stroke="var(--text-dim)" fontSize={10} />
                  <Tooltip content={<LocationTooltip />} />
                  <Bar dataKey="projetos" radius={[0, 4, 4, 0]}>
                    {cityTop.map((r) => (
                      <Cell key={r.name} fill={densityColor(r.projetos, maxCidade)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ borderColor: "rgba(139, 92, 246, 0.4)", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <BarChart3 size={16} color="#8b5cf6" />
          <h3 className="card-title" style={{ margin: 0 }}>Concentracao Hierarquica (Treemap)</h3>
        </div>
        <p className="card-subtitle">
          Area proporcional ao numero de projetos distintos por municipio, agrupados por estado. Passe o mouse para detalhes.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <label style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Municipios por estado:</label>
          <input
            type="range"
            min={3}
            max={15}
            value={tmTop}
            onChange={(e) => setTmTop(parseInt(e.target.value))}
            style={{ width: "150px", accentColor: "var(--primary)" }}
          />
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)" }}>{tmTop}</span>
        </div>

        <div style={{ width: "100%", height: 460, position: "relative" }}>
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={stats.treemap}
              dataKey="size"
              nameKey="name"
              aspectRatio={4 / 3}
              stroke="var(--bg-card)"
              content={<TreeMapContent maxCity={stats.maxCityCount} onHover={setHovered} />}
            />
          </ResponsiveContainer>
          {hovered && (
            <div style={{ position: "absolute", top: 8, right: 8, background: "var(--bg-panel)", border: "1px solid var(--border-color)", padding: "0.5rem 0.75rem", borderRadius: "8px", pointerEvents: "none" }}>
              <div style={{ fontWeight: 700, fontSize: "0.8rem" }}>{hovered.name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{hovered.value} projetos</div>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ borderColor: "rgba(245, 158, 11, 0.4)", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <TrendingUp size={16} color="#f59e0b" />
          <h3 className="card-title" style={{ margin: 0 }}>Pareto de Concentracao (80/20)</h3>
        </div>
        <p className="card-subtitle">
          Barras = projetos distintos por local (decrescente); linha = percentual acumulado. A referencia tracejada marca 80%.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", alignItems: "stretch" }}>
          <div>
            <div style={{ textAlign: "center", fontSize: "0.8rem", fontWeight: 700, color: "#f59e0b", marginBottom: "0.5rem" }}>
              Estados
            </div>
            <div style={{ width: "100%", height: 380 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={paretoState} margin={{ top: 8, right: 4, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={90} tick={{ fontSize: 9, fill: "var(--text-dim)" }} />
                  <YAxis yAxisId="left" stroke="var(--text-dim)" fontSize={9} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="var(--text-dim)" fontSize={9} tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip content={<LocationTooltip />} />
                  <ReferenceLine yAxisId="right" y={80} stroke="#f43f5e" strokeDasharray="5 3" strokeWidth={1.5} label={{ value: "80%", position: "insideTopRight", fill: "#f43f5e", fontSize: 9 }} />
                  <Bar yAxisId="left" dataKey="projetos" fill="#f59e0b" fillOpacity={0.85} radius={[3, 3, 0, 0]}>
                    {paretoState.map((r) => (
                      <Cell key={r.name} fill={densityColor(r.projetos, maxEstado)} />
                    ))}
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="cumPct" stroke="#f43f5e" strokeWidth={2} dot={{ r: 2, fill: "#f43f5e" }} name="Acumulado %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <div style={{ textAlign: "center", fontSize: "0.8rem", fontWeight: 700, color: "#f59e0b", marginBottom: "0.5rem" }}>
              Municipios
            </div>
            <div style={{ width: "100%", height: 380 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={paretoCity} margin={{ top: 8, right: 4, left: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={90} tick={{ fontSize: 8, fill: "var(--text-dim)" }} />
                  <YAxis yAxisId="left" stroke="var(--text-dim)" fontSize={9} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="var(--text-dim)" fontSize={9} tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip content={<LocationTooltip />} />
                  <ReferenceLine yAxisId="right" y={80} stroke="#f43f5e" strokeDasharray="5 3" strokeWidth={1.5} label={{ value: "80%", position: "insideTopRight", fill: "#f43f5e", fontSize: 9 }} />
                  <Bar yAxisId="left" dataKey="projetos" fillOpacity={0.85} radius={[3, 3, 0, 0]}>
                    {paretoCity.map((r) => (
                      <Cell key={r.name} fill={densityColor(r.projetos, maxCidade)} />
                    ))}
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="cumPct" stroke="#f43f5e" strokeWidth={2} dot={{ r: 2, fill: "#f43f5e" }} name="Acumulado %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}