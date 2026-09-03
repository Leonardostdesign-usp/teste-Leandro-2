export interface MaterialBreakdown {
  material: string;
  qty: number | null;
  co2_min: number;
  co2_max: number;
  en_min: number;
  en_max: number;
}

export interface Unit {
  projeto: string;
  unidade: string;
  ano: number | null;
  status: string;
  estado: string;
  construtora: string;
  cidade: string;
  area: number | null;
  sistema: string;
  co2: [number | null, number | null];
  co2_ref: [number | null, number | null];
  desvio: [number | null, number | null];
  divergencia: string;
  co2_total: [number | null, number | null];
  en: [number | null, number | null];
  en_total: [number | null, number | null];
  fck: number;
  mats: MaterialBreakdown[];
}

export interface VersionScenario {
  versao: string;
  cenario: string;
  projeto: string;
  unidade: string;
  ano: number | null;
  status: string;
  estado: string;
  construtora: string;
  cidade: string;
  area: number | null;
  sistema: string;
  conc: number | null;
  aco: number | null;
  co2: [number | null, number | null];
  co2_total: [number | null, number | null];
  en: [number | null, number | null];
  en_total: [number | null, number | null];
}

export interface Dataset {
  meta: {
    unidades: number;
    projetos: number;
    estados: Record<string, number>;
    sistemas: Record<string, number>;
    status: Record<string, number>;
    construtoras: Record<string, number>;
    anos: Record<string, number>;
    fck_resolvido: { fck25: number; fck45: number };
  };
  kpis: {
    co2_min_medio: number;
    co2_max_medio: number;
    en_min_medio: number;
    en_max_medio: number;
    divergentes: number;
  };
  units: Unit[];
  versions: VersionScenario[];
  factors: Record<string, any>;
  representativos: Record<string, number>;
}

export interface FilterState {
  estado: string;
  sistema: string;
  status: string;
  construtora: string;
  anoStart: number | "Todos";
  anoEnd: number | "Todos";
  areaRange: [number, number];
  limiarDivergencia: number;
}
