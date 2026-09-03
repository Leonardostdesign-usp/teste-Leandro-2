import React, { useState } from "react";
import type { Unit } from "../types";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { ShieldAlert, CheckCircle, AlertTriangle } from "lucide-react";

interface ValidationSectionProps {
  units: Unit[];
  limiarDivergencia: number;
}

export const ValidationSection: React.FC<ValidationSectionProps> = ({
  units,
  limiarDivergencia,
}) => {
  const [filterDivergentOnly, setFilterDivergentOnly] = useState<boolean>(false);

  const validUnits = units.filter((u) => u.co2[0] !== null && u.co2_ref && u.co2_ref[0] !== null);

  const divergentUnits = validUnits.filter((u) => {
    const dev = Math.abs(u.desvio[0] || 0);
    return dev > limiarDivergencia || u.divergencia === "Sim";
  });

  const percentDivergent = validUnits.length ? Math.round((divergentUnits.length / validUnits.length) * 100) : 0;

  const scatterValidationData = validUnits.map((u) => ({
    x: u.co2_ref[0],
    y: u.co2[0],
    name: `${u.projeto} - ${u.unidade}`,
    sistema: u.sistema,
    desvio: u.desvio[0],
    isDivergent: Math.abs(u.desvio[0] || 0) > limiarDivergencia || u.divergencia === "Sim",
  }));

  const devBuckets: Record<string, number> = {
    "0.0 - 0.5 kg/m² (Excelente)": 0,
    "0.5 - 1.5 kg/m² (Baixo)": 0,
    "1.5 - 3.0 kg/m² (Moderado)": 0,
    "> 3.0 kg/m² (Relevante)": 0,
  };

  validUnits.forEach((u) => {
    const dev = Math.abs(u.desvio[0] || 0);
    if (dev <= 0.5) devBuckets["0.0 - 0.5 kg/m² (Excelente)"] += 1;
    else if (dev <= 1.5) devBuckets["0.5 - 1.5 kg/m² (Baixo)"] += 1;
    else if (dev <= 3.0) devBuckets["1.5 - 3.0 kg/m² (Moderado)"] += 1;
    else devBuckets["> 3.0 kg/m² (Relevante)"] += 1;
  });

  const devHistogramData = Object.entries(devBuckets).map(([faixa, count]) => ({
    faixa,
    unidades: count,
  }));

  const displayList = filterDivergentOnly ? divergentUnits : validUnits;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div className="card" style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderColor: "var(--accent-rose)" }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          <ShieldAlert color="var(--accent-rose)" size={24} style={{ marginTop: "3px" }} />
          <div>
            <h3 style={{ fontSize: "1.2rem", color: "var(--accent-rose)" }}>
              Auditoria de Qualidade dos Dados &amp; Linha de Referência Cássio
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              Verifica a integridade metodológica comparando o CO₂ calculated nas planilhas contra o modelo de referência <code>co2_ref</code> (Cássio). Identifica desvios e garante transparência aos gestores.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        <div className="card">
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Total com Referência Validadas</div>
          <div style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--text-main)", margin: "0.4rem 0" }}>
            {validUnits.length} <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>unidades</span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>265 unidades com benchmark co2_ref</div>
        </div>

        <div className="card" style={{ borderColor: divergentUnits.length > 0 ? "rgba(244,63,94,0.4)" : "var(--border-color)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Unidades Sinalizadas (Divergentes)</div>
          <div style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--accent-rose)", margin: "0.4rem 0" }}>
            {divergentUnits.length} <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>({percentDivergent}%)</span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Desvio &gt; {limiarDivergencia} kg CO₂/m²</div>
        </div>

        <div className="card">
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Limiar de Divergência Atual</div>
          <div style={{ fontSize: "1.75rem", fontWeight: "700", color: "var(--primary)", margin: "0.4rem 0" }}>
            ± {limiarDivergencia} <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>kg/m²</span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>Ajustável no painel de controle superior</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div className="card">
          <h4 className="card-title">CO₂ Calculado vs. CO₂ Referência Cássio</h4>
          <p className="card-subtitle">Pontos sobre a linha diagonal representam alinhamento perfeito (Desvio = 0)</p>

          <div style={{ width: "100%", height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <XAxis
                  type="number"
                  dataKey="x"
                  name="CO₂ Referência Cássio"
                  unit=" kg/m²"
                  stroke="var(--text-muted)"
                  fontSize={12}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="CO₂ Calculado"
                  unit=" kg/m²"
                  stroke="var(--text-muted)"
                  fontSize={12}
                />
                <Tooltip
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ backgroundColor: "var(--bg-panel)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "8px" }}>
                          <div style={{ fontWeight: "bold", color: "#fff" }}>{data.name}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            Calculado: {data.y} kg/m² | Referência: {data.x} kg/m²
                          </div>
                          <div style={{ fontSize: "0.8rem", color: data.isDivergent ? "var(--accent-rose)" : "var(--primary)", fontWeight: "bold", marginTop: "0.2rem" }}>
                            Desvio: {data.desvio} kg/m² {data.isDivergent ? "(Divergência Sinalizada)" : "(Conforme)"}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine x={0} y={0} stroke="var(--border-color)" />
                <ReferenceLine segment={[{ x: 50, y: 50 }, { x: 300, y: 300 }]} stroke="var(--primary)" strokeDasharray="3 3" label={{ value: "Linha de Igualdade 1:1", fill: "var(--primary)", fontSize: 10 }} />
                <Scatter
                  name="Unidades"
                  data={scatterValidationData}
                  fill="#3b82f6"
                >
                  {scatterValidationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isDivergent ? "#f43f5e" : "#10b981"} opacity={0.8} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h4 className="card-title">Distribuição por Faixa de Desvio Metodológico</h4>
          <p className="card-subtitle">Frequência de unidades por grau de divergência em kg CO₂/m²</p>

          <div style={{ width: "100%", height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={devHistogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="faixa" stroke="var(--text-muted)" fontSize={10} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border-color)" }} />
                <Bar dataKey="unidades" fill="var(--accent-blue)" radius={[4, 4, 0, 0]}>
                  <Cell fill="#10b981" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#f43f5e" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h4 className="card-title">Registro de Auditoria das Unidades</h4>
            <p className="card-subtitle">Detalhamento dos desvios para revalidação pela equipe técnica da CAIXA / BIPc</p>
          </div>

          <button
            className={`btn ${filterDivergentOnly ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilterDivergentOnly(!filterDivergentOnly)}
          >
            <AlertTriangle size={14} /> {filterDivergentOnly ? "Exibindo Apenas Divergentes" : "Mostrar Todas as Unidades"}
          </button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                <th style={{ padding: "0.75rem" }}>Projeto / Torre</th>
                <th style={{ padding: "0.75rem" }}>Estado</th>
                <th style={{ padding: "0.75rem" }}>Sistema</th>
                <th style={{ padding: "0.75rem" }}>CO₂ Calc (kg/m²)</th>
                <th style={{ padding: "0.75rem" }}>CO₂ Ref (kg/m²)</th>
                <th style={{ padding: "0.75rem" }}>Desvio Absoluto</th>
                <th style={{ padding: "0.75rem" }}>Status Auditoria</th>
              </tr>
            </thead>
            <tbody>
              {displayList.slice(0, 15).map((u, idx) => {
                const isDiv = Math.abs(u.desvio[0] || 0) > limiarDivergencia || u.divergencia === "Sim";
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)", background: isDiv ? "rgba(244,63,94,0.04)" : "transparent" }}>
                    <td style={{ padding: "0.75rem", fontWeight: "600" }}>{u.projeto} - {u.unidade}</td>
                    <td style={{ padding: "0.75rem", color: "var(--text-muted)" }}>{u.estado}</td>
                    <td style={{ padding: "0.75rem", color: "var(--text-muted)" }}>{u.sistema}</td>
                    <td style={{ padding: "0.75rem", fontWeight: "700" }}>{u.co2[0]}</td>
                    <td style={{ padding: "0.75rem", color: "var(--text-muted)" }}>{u.co2_ref[0]}</td>
                    <td style={{ padding: "0.75rem", fontWeight: "700", color: isDiv ? "var(--accent-rose)" : "var(--primary)" }}>
                      {u.desvio[0]} kg/m²
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {isDiv ? (
                        <span className="badge badge-rose">
                          <AlertTriangle size={12} style={{ marginRight: "3px" }} /> Revalidação Solicitada
                        </span>
                      ) : (
                        <span className="badge badge-green">
                          <CheckCircle size={12} style={{ marginRight: "3px" }} /> Conforme
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {displayList.length > 15 && (
            <div style={{ textAlign: "center", padding: "0.75rem 0", color: "var(--text-dim)", fontSize: "0.8rem" }}>
              Exibindo 15 de {displayList.length} unidades nesta lista. Utilize a busca na barra lateral para explorar todas.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
