"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Calculator,
  CalendarClock,
  CloudRain,
  CloudSun,
  Droplets,
  GraduationCap,
  Info,
  Leaf,
  ListChecks,
  MapPin,
  Package,
  Scale,
  Sprout,
  Thermometer,
  TriangleAlert,
  Wheat,
  Wind,
} from "lucide-react";

/* ================= TIPOS ================= */

type Cultura = "Milho" | "Soja";

type Canteiro = {
  id: string;
  nome: string;
  cultura: Cultura;
  semeadura: string;
  area: number;
  doseN: number;
  ajusteDias: number;
  feitas: string[];
};

type Estadio = { codigo: string; nome: string; inicio: number };

type Atividade = {
  id: string;
  titulo: string;
  inicio: number;
  fim: number;
  texto: string;
  recursos: string[];
  critica?: boolean;
};

type Perfil = {
  ciclo: number;
  kc: { ini: number; meio: number; fim: number };
  fases: [number, number, number, number];
  estadios: Estadio[];
  atividades: Atividade[];
};

type Prova = { titulo: string; data: string };

type Clima = {
  eto: number | null;
  chuva: number;
  prob: number | null;
  tmax: number | null;
  tmin: number | null;
  codigo: number | null;
  umidade: number | null;
};

/* ================= CONSTANTES ================= */

const CHAVE = "nu-agro-v1";
const CHAVE_CAMPUS = "nu-campus-v2";
const LAT = -22.82; // Unicamp, Campinas
const LON = -47.06;
const EFICIENCIA = 0.9; // eficiência do gotejamento

const COR: Record<Cultura, string> = { Milho: "#fbbf24", Soja: "#34d399" };
const COR_FUNDO: Record<Cultura, string> = {
  Milho: "rgba(251, 191, 36, 0.10)",
  Soja: "rgba(52, 211, 153, 0.10)",
};

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const DIAS_LONGOS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

const MACROS = ["Plantio", "Crescimento", "Floração", "Grãos", "Colheita"];
const MACRO_AJUDA = [
  "A semente foi plantada e está germinando.",
  "A planta está formando folhas e raízes. Fase de controlar daninhas e, no milho, de adubar.",
  "A planta está florescendo. Falta de água agora reduz muito a colheita.",
  "Os grãos estão se formando e enchendo. Ainda é fase sensível à água.",
  "A planta está madura. Hora de planejar a colheita.",
];

const PERFIS: Record<Cultura, Perfil> = {
  Milho: {
    ciclo: 120,
    kc: { ini: 0.3, meio: 1.2, fim: 0.6 },
    fases: [20, 35, 40, 25],
    estadios: [
      { codigo: "S", nome: "semeado", inicio: 0 },
      { codigo: "VE", nome: "emergência", inicio: 5 },
      { codigo: "V2", nome: "2 folhas", inicio: 10 },
      { codigo: "V4", nome: "4 folhas", inicio: 18 },
      { codigo: "V6", nome: "6 folhas", inicio: 25 },
      { codigo: "V8", nome: "8 folhas", inicio: 35 },
      { codigo: "V10", nome: "10 folhas ou mais", inicio: 45 },
      { codigo: "VT", nome: "pendoamento", inicio: 55 },
      { codigo: "R1", nome: "embonecamento", inicio: 60 },
      { codigo: "R2", nome: "grão bolha d'água", inicio: 70 },
      { codigo: "R3", nome: "grão leitoso", inicio: 80 },
      { codigo: "R4", nome: "grão pastoso", inicio: 90 },
      { codigo: "R5", nome: "grão farináceo", inicio: 100 },
      { codigo: "R6", nome: "maturidade fisiológica", inicio: 110 },
    ],
    atividades: [
      { id: "estande", titulo: "Contar as plantas que nasceram", inicio: 7, fim: 14, texto: "Compare com o planejado na calculadora de estande. Abaixo de 80%, avalie replantio nas falhas.", recursos: ["Trena", "Prancheta"] },
      { id: "vistoria", titulo: "Vistoriar folhas e pragas", inicio: 10, fim: 55, texto: "Olhe o cartucho (lagartas), a cor e o vigor das folhas. Amarelecimento em V nas folhas velhas pode indicar falta de nitrogênio.", recursos: ["Celular para fotos"] },
      { id: "capina1", titulo: "Capinar entre as linhas", inicio: 13, fim: 18, texto: "Início do período crítico de competição com daninhas (V2 a V8).", recursos: ["Enxadinha", "Luvas"] },
      { id: "adubacao", titulo: "Adubar com nitrogênio", inicio: 18, fim: 30, texto: "Entre V4 e V6, com solo úmido, ao lado da linha. Regar logo depois para o nitrogênio não se perder no ar.", recursos: ["Ureia", "Balança de cozinha", "Luvas"] },
      { id: "capina2", titulo: "Segunda capina", inicio: 28, fim: 33, texto: "Ainda no período crítico. Depois que as folhas fecharem e sombrearem o solo, as daninhas pesam menos.", recursos: ["Enxadinha", "Luvas"] },
      { id: "agua-critica", titulo: "Fase crítica de água", inicio: 55, fim: 70, texto: "Pendoamento e embonecamento: a fase em que o milho mais sofre com falta de água. Não pule regas.", recursos: [], critica: true },
      { id: "biometria", titulo: "Medições finais", inicio: 100, fim: 112, texto: "Altura, diâmetro do colmo, leitura SPAD, estádio e contagem de plantas em 2 m².", recursos: ["Trena", "Paquímetro", "Medidor SPAD"] },
      { id: "colheita", titulo: "Colher", inicio: 110, fim: 125, texto: "Em R6: procure a camada preta na base do grão.", recursos: ["Sacos", "Etiquetas"] },
    ],
  },
  Soja: {
    ciclo: 110,
    kc: { ini: 0.4, meio: 1.15, fim: 0.5 },
    fases: [15, 25, 45, 25],
    estadios: [
      { codigo: "S", nome: "semeado", inicio: 0 },
      { codigo: "VE", nome: "emergência", inicio: 5 },
      { codigo: "VC", nome: "cotilédones abertos", inicio: 10 },
      { codigo: "V2", nome: "segundo nó", inicio: 15 },
      { codigo: "V4", nome: "quarto nó", inicio: 25 },
      { codigo: "V6", nome: "sexto nó", inicio: 35 },
      { codigo: "R1", nome: "início da floração", inicio: 40 },
      { codigo: "R2", nome: "em flor", inicio: 48 },
      { codigo: "R3", nome: "início das vagens", inicio: 55 },
      { codigo: "R4", nome: "vagens formadas", inicio: 65 },
      { codigo: "R5", nome: "enchendo os grãos", inicio: 75 },
      { codigo: "R6", nome: "grãos cheios", inicio: 85 },
      { codigo: "R7", nome: "início da maturação", inicio: 95 },
      { codigo: "R8", nome: "maturação plena", inicio: 105 },
    ],
    atividades: [
      { id: "estande", titulo: "Contar as plantas que nasceram", inicio: 7, fim: 12, texto: "Compare com o planejado na calculadora de estande. Abaixo de 80%, avalie replantio nas falhas.", recursos: ["Trena", "Prancheta"] },
      { id: "capina1", titulo: "Capinar entre as linhas", inicio: 13, fim: 18, texto: "Início do período crítico de competição com daninhas (V2 a R1).", recursos: ["Enxadinha", "Luvas"] },
      { id: "vistoria", titulo: "Vistoriar folhas contra fungos", inicio: 25, fim: 95, texto: "Olhe as folhas de baixo. Com as plantas fechadas e o gotejo perto do caule, o ar fica úmido e favorece fungos: regue de manhã e não molhe as folhas.", recursos: ["Lupa", "Caderno de campo"] },
      { id: "nodulacao", titulo: "Conferir os nódulos da raiz", inicio: 25, fim: 35, texto: "A soja não recebe adubo nitrogenado: o nitrogênio vem de bactérias nos nódulos. Corte um nódulo: rosado por dentro significa que está funcionando.", recursos: ["Pá de jardim", "Canivete"] },
      { id: "capina2", titulo: "Segunda capina", inicio: 28, fim: 33, texto: "Ainda no período crítico, antes de as folhas fecharem.", recursos: ["Enxadinha", "Luvas"] },
      { id: "agua-critica", titulo: "Fase crítica de água", inicio: 55, fim: 85, texto: "Formação e enchimento dos grãos (R3 a R5). Não pule regas.", recursos: [], critica: true },
      { id: "biometria", titulo: "Medições finais", inicio: 90, fim: 102, texto: "Altura, número de nós, altura da primeira vagem, leitura SPAD e contagem em 2 m².", recursos: ["Trena", "Medidor SPAD"] },
      { id: "colheita", titulo: "Colher", inicio: 105, fim: 118, texto: "Em R8: cerca de 95% das vagens com cor de madura.", recursos: ["Sacos", "Etiquetas"] },
    ],
  },
};

/* ================= FUNÇÕES DE APOIO ================= */

const campo =
  "w-full rounded-xl border border-linha bg-fundo px-4 py-3 text-base text-texto outline-none transition focus:border-azul";

function novoId() {
  return Math.random().toString(36).slice(2, 10);
}

function paraNumero(texto: string) {
  const limpo = texto.trim().replace(",", ".");
  const n = Number(limpo);
  return limpo === "" || isNaN(n) ? null : n;
}

function br(n: number, casas = 2) {
  return n.toLocaleString("pt-BR", { maximumFractionDigits: casas });
}

function paraData(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
}

function paraISO(dt: Date) {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function hojeISO() {
  return paraISO(new Date());
}

function somarDias(iso: string, n: number) {
  const dt = paraData(iso);
  dt.setDate(dt.getDate() + n);
  return paraISO(dt);
}

function diasEntre(de: string, ate: string) {
  return Math.round((paraData(ate).getTime() - paraData(de).getTime()) / 86400000);
}

function formatarData(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function diaCurto(iso: string, hoje: string) {
  const d = diasEntre(hoje, iso);
  if (d === 0) return "hoje";
  if (d === 1) return "amanhã";
  if (d > 1 && d < 7) return DIAS[paraData(iso).getDay()].toLowerCase();
  return formatarData(iso);
}

// Curva de Kc em quatro fases (FAO-56)
function kcDoDia(p: Perfil, das: number) {
  const [li, ld, lm, lf] = p.fases;
  if (das <= li) return p.kc.ini;
  if (das <= li + ld) return p.kc.ini + ((das - li) / ld) * (p.kc.meio - p.kc.ini);
  if (das <= li + ld + lm) return p.kc.meio;
  if (das <= li + ld + lm + lf) return p.kc.meio + ((das - li - ld - lm) / lf) * (p.kc.fim - p.kc.meio);
  return p.kc.fim;
}

function estadioAtual(p: Perfil, das: number) {
  let atual = p.estadios[0];
  for (const e of p.estadios) if (das >= e.inicio) atual = e;
  return atual;
}

function macroDe(cultura: Cultura, codigo: string) {
  const mapa: Record<Cultura, Record<string, number>> = {
    Milho: { S: 0, VE: 1, V2: 1, V4: 1, V6: 1, V8: 1, V10: 1, VT: 2, R1: 2, R2: 3, R3: 3, R4: 3, R5: 3, R6: 4 },
    Soja: { S: 0, VE: 1, VC: 1, V2: 1, V4: 1, V6: 1, R1: 2, R2: 2, R3: 3, R4: 3, R5: 3, R6: 3, R7: 4, R8: 4 },
  };
  return mapa[cultura][codigo] ?? 0;
}

function descricaoTempo(codigo: number | null) {
  if (codigo === null) return "Previsão do dia";
  if (codigo === 0) return "Céu limpo";
  if (codigo <= 3) return "Sol entre nuvens";
  if (codigo <= 48) return "Neblina";
  if (codigo <= 57) return "Garoa";
  if (codigo <= 67) return "Chuva";
  if (codigo <= 82) return "Pancadas de chuva";
  return "Tempestade";
}

function lerProvas(): Prova[] {
  try {
    const salvo = localStorage.getItem(CHAVE_CAMPUS);
    if (!salvo) return [];
    const disciplinas = JSON.parse(salvo) as {
      nome: string;
      avaliacoes: { nome: string; data: string; nota: number | null }[];
    }[];
    return disciplinas.flatMap((d) =>
      d.avaliacoes
        .filter((a) => a.data && a.nota === null)
        .map((a) => ({ titulo: `${a.nome} de ${d.nome}`, data: a.data }))
    );
  } catch {
    return [];
  }
}

function canteirosExemplo(hoje: string): Canteiro[] {
  return [
    { id: "demo-milho", nome: "Canteiro A", cultura: "Milho", semeadura: somarDias(hoje, -24), area: 2, doseN: 120, ajusteDias: 0, feitas: [] },
    { id: "demo-soja", nome: "Canteiro B", cultura: "Soja", semeadura: somarDias(hoje, -50), area: 2, doseN: 0, ajusteDias: 0, feitas: [] },
  ];
}

/* ================= PEÇAS VISUAIS ================= */

function Termo({ titulo, explicacao, children }: { titulo: string; explicacao: string; children: ReactNode }) {
  const [aberto, setAberto] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        onMouseEnter={() => setAberto(true)}
        onMouseLeave={() => setAberto(false)}
        aria-label={`${titulo}: ${explicacao}`}
        className="inline-flex items-center gap-1 rounded text-[11px] font-semibold uppercase tracking-wide text-suave underline decoration-dotted underline-offset-[3px] transition hover:text-texto"
      >
        {children}
        <Info className="size-3 opacity-70" aria-hidden />
      </button>
      {aberto && (
        <span
          role="tooltip"
          className="absolute bottom-full right-0 z-30 mb-2 w-64 rounded-xl border border-linha bg-cartao-2 px-3.5 py-2.5 text-left text-[13px] leading-snug text-texto shadow-2xl"
        >
          <span className="block font-semibold">{titulo}</span>
          <span className="mt-0.5 block text-suave">{explicacao}</span>
        </span>
      )}
    </span>
  );
}

function LinhaDoCiclo({ macro, cor }: { macro: number; cor: string }) {
  const at = macro / (MACROS.length - 1);
  return (
    <div className="relative" role="img" aria-label={`Ciclo da planta: agora em ${MACROS[macro]}`}>
      <div className="absolute left-[10%] right-[10%] top-[9px] h-1.5 rounded-full bg-linha">
        <div className="h-full rounded-full" style={{ width: `${at * 100}%`, backgroundColor: cor }} />
      </div>
      <ol className="relative grid grid-cols-5">
        {MACROS.map((m, i) => (
          <li key={m} className="flex flex-col items-center gap-2 text-center">
            <span
              className="mt-[3px] size-[18px] rounded-full border-[3px] border-cartao"
              style={{ backgroundColor: i <= macro ? cor : "#1e2a44" }}
            />
            <span className={`text-[11px] leading-tight sm:text-xs ${i === macro ? "font-bold text-texto" : "text-suave"}`}>
              {m}
            </span>
          </li>
        ))}
      </ol>
      <div className="absolute top-0 -translate-x-1/2" style={{ left: `calc(10% + ${at} * 80%)` }} aria-hidden>
        <span className="pulsar block size-6 rounded-full border-4 border-cartao bg-azul" />
      </div>
    </div>
  );
}

function Secao({ titulo, subtitulo, id, children }: { titulo: string; subtitulo: string; id?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 py-8 sm:py-10">
      <div className="mb-5 sm:mb-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{titulo}</h2>
        <p className="mt-1 text-suave">{subtitulo}</p>
      </div>
      {children}
    </section>
  );
}

function Metrica({ icone, rotulo, valor, dica, termo }: { icone: ReactNode; rotulo: string; valor: string; dica: string; termo: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-linha bg-fundo p-4">
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-xl bg-cartao-2 text-azul-claro">{icone}</span>
        {termo}
      </div>
      <div>
        <p className="text-sm text-suave">{rotulo}</p>
        <p className="text-2xl font-semibold">{valor}</p>
        <p className="mt-1 text-sm text-suave">{dica}</p>
      </div>
    </div>
  );
}

/* ================= PÁGINA ================= */

export default function NuAgro() {
  const [canteiros, setCanteiros] = useState<Canteiro[]>([]);
  const [exemplo, setExemplo] = useState<Canteiro[]>([]);
  const [provasCampus, setProvasCampus] = useState<Prova[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [hoje, setHoje] = useState("");

  const [clima, setClima] = useState<Clima>({ eto: null, chuva: 0, prob: null, tmax: null, tmin: null, codigo: null, umidade: null });
  const [erroClima, setErroClima] = useState(false);
  const [etoManual, setEtoManual] = useState("4,5");

  const [nome, setNome] = useState("");
  const [cultura, setCultura] = useState<Cultura>("Milho");
  const [semeadura, setSemeadura] = useState("");
  const [area, setArea] = useState("2");
  const [doseN, setDoseN] = useState("120");
  const [meta, setMeta] = useState("");

  useEffect(() => {
    const h = hojeISO();
    setHoje(h);
    setSemeadura(h);
    setExemplo(canteirosExemplo(h));
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) setCanteiros(JSON.parse(salvo));
    } catch {
      // começa vazio
    }
    setProvasCampus(lerProvas());
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (!carregado) return;
    try {
      localStorage.setItem(CHAVE, JSON.stringify(canteiros));
    } catch {
      // segue sem salvar
    }
  }, [canteiros, carregado]);

  useEffect(() => {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      "&daily=et0_fao_evapotranspiration,precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min,weather_code" +
      "&hourly=relative_humidity_2m&timezone=America%2FSao_Paulo&forecast_days=3";
    fetch(url)
      .then((r) => r.json())
      .then((j) => {
        if (!j.daily || !j.hourly) throw new Error("sem dados");
        const ur = (j.hourly.relative_humidity_2m as (number | null)[]).filter((v): v is number => v !== null);
        setClima({
          eto: j.daily.et0_fao_evapotranspiration[0],
          chuva: j.daily.precipitation_sum[0] ?? 0,
          prob: j.daily.precipitation_probability_max[0],
          tmax: j.daily.temperature_2m_max[0],
          tmin: j.daily.temperature_2m_min[0],
          codigo: j.daily.weather_code[0],
          umidade: ur.length > 0 ? ur.reduce((s, v) => s + v, 0) / ur.length : null,
        });
      })
      .catch(() => setErroClima(true));
  }, []);

  if (!carregado || !hoje) {
    return <main className="min-h-screen bg-fundo" />;
  }

  /* ---------- modo exemplo ---------- */
  const emExemplo = canteiros.length === 0;
  const lista = emExemplo ? exemplo : canteiros;
  const provas =
    emExemplo && provasCampus.length === 0 ? [{ titulo: "P2 de Física Geral", data: somarDias(hoje, 3) }] : provasCampus;

  const etoUsada = clima.eto ?? paraNumero(etoManual) ?? 4.5;
  const chuvaHoje = clima.chuva;

  /* ---------- análise de cada canteiro ---------- */
  function analisar(c: Canteiro) {
    const p = PERFIS[c.cultura];
    const dasReal = diasEntre(c.semeadura, hoje);
    const das = dasReal + c.ajusteDias;
    const est = estadioAtual(p, das);
    const kc = kcDoDia(p, Math.max(das, 0));
    const etc = etoUsada * kc;
    const lamina = das < 0 ? 0 : Math.max(0, etc - chuvaHoje);
    const litros = (lamina * c.area) / EFICIENCIA;
    const ureiaG = (c.doseN * c.area) / 4.5;
    const dataDoDas = (x: number) => somarDias(c.semeadura, x - c.ajusteDias);
    const tarefas = p.atividades.filter((a) => !a.critica);
    const semana = tarefas.filter(
      (a) => (das >= a.inicio && das <= a.fim) || (a.inicio > das && a.inicio - das <= 7)
    );
    const critica = p.atividades.find((a) => a.critica && das >= a.inicio && das <= a.fim);
    const riscoFungo = c.cultura === "Soja" && das >= 40 && clima.umidade !== null && clima.umidade >= 80;
    const colheita = p.atividades.find((a) => a.id === "colheita");
    const diasColheita = colheita ? colheita.inicio - das : 0;
    return { c, p, dasReal, das, est, macro: macroDe(c.cultura, est.codigo), kc, etc, lamina, litros, ureiaG, dataDoDas, semana, critica, riscoFungo, diasColheita };
  }

  const analises = lista.map(analisar);
  type Analise = (typeof analises)[number];

  const conflitos = (an: Analise, a: Atividade) =>
    provas.filter((pr) => pr.data >= an.dataDoDas(Math.max(a.inicio, an.das)) && pr.data <= an.dataDoDas(a.fim));

  const tituloTarefa = (an: Analise, a: Atividade) =>
    a.id === "adubacao" ? `Adubar com ${Math.round(an.ureiaG)} g de ureia` : a.titulo;

  const quando = (an: Analise, a: Atividade) => {
    if (an.das < a.inicio) return `Começa ${diaCurto(an.dataDoDas(a.inicio), hoje)}`;
    const fim = an.dataDoDas(a.fim);
    return fim === hoje ? "Hoje" : `Até ${diaCurto(fim, hoje)}`;
  };

  /* ---------- ações ---------- */
  function atualizar(id: string, mudanca: Partial<Canteiro>) {
    const aplicar = (atual: Canteiro[]) => atual.map((c) => (c.id === id ? { ...c, ...mudanca } : c));
    if (id.startsWith("demo-")) setExemplo(aplicar);
    else setCanteiros(aplicar);
  }

  function alternarFeita(c: Canteiro, atividadeId: string) {
    const feitas = c.feitas.includes(atividadeId) ? c.feitas.filter((f) => f !== atividadeId) : [...c.feitas, atividadeId];
    atualizar(c.id, { feitas });
  }

  function confirmarEstadio(c: Canteiro, codigo: string, dasReal: number) {
    if (codigo === "") return atualizar(c.id, { ajusteDias: 0 });
    const e = PERFIS[c.cultura].estadios.find((x) => x.codigo === codigo);
    if (e) atualizar(c.id, { ajusteDias: e.inicio - dasReal });
  }

  function removerCanteiro(id: string) {
    if (!confirm("Apagar este canteiro?")) return;
    setCanteiros((atual) => atual.filter((c) => c.id !== id));
  }

  const metaT = paraNumero(meta);

  function adicionarCanteiro() {
    const a = paraNumero(area);
    const dose = metaT !== null ? (metaT * 1000) / 60 : paraNumero(doseN) ?? 120;
    if (!semeadura || !a) {
      alert("Preencha a data de plantio e a área.");
      return;
    }
    setCanteiros((atual) => [
      ...atual,
      {
        id: novoId(),
        nome: nome.trim() || `Canteiro de ${cultura.toLowerCase()}`,
        cultura,
        semeadura,
        area: a,
        doseN: cultura === "Milho" ? dose : 0,
        ajusteDias: 0,
        feitas: [],
      },
    ]);
    setNome("");
    setMeta("");
  }

  /* ---------- resumo do dia ---------- */
  type CardResumo = { tom: "rega" | "tarefa" | "alerta"; cor?: string; icone: ReactNode; tag: string; titulo: string; nota: string };
  const resumo: CardResumo[] = [];

  for (const an of analises.slice(0, 2)) {
    const nomeCultura = an.c.cultura;
    let titulo: string;
    let nota: string;
    if (an.das < 0) {
      titulo = `${nomeCultura}: ainda não plantado`;
      nota = `Plantio em ${formatarData(an.c.semeadura)}.`;
    } else if (an.lamina === 0) {
      titulo = chuvaHoje > 0 ? `${nomeCultura}: hoje não precisa regar, vai chover` : `${nomeCultura}: hoje não precisa regar`;
      nota = chuvaHoje > 0 ? `${br(chuvaHoje, 0)} mm de chuva previstos.` : "A demanda de água está baixa.";
    } else {
      titulo = `${nomeCultura}: regar ${br(an.litros, 0)} litros`;
      nota = "Direto no solo, de preferência pela manhã.";
    }
    resumo.push({
      tom: "rega",
      cor: COR[nomeCultura],
      icone: an.lamina === 0 && chuvaHoje > 0 ? <CloudRain className="size-5" /> : <Droplets className="size-5" />,
      tag: "Rega",
      titulo,
      nota,
    });
  }

  const comAdubo = analises.find((an) => an.semana.some((a) => a.id === "adubacao" && !an.c.feitas.includes(a.id)));
  const primeiraTarefa = analises
    .flatMap((an) => an.semana.filter((a) => !an.c.feitas.includes(a.id) && an.das >= a.inicio).map((a) => ({ an, a })))
    .find(() => true);

  if (comAdubo) {
    const a = comAdubo.semana.find((x) => x.id === "adubacao")!;
    resumo.push({
      tom: "tarefa",
      icone: <Scale className="size-5" />,
      tag: "Adubo",
      titulo: `Adubar o milho ${quando(comAdubo, a).toLowerCase()}: ${Math.round(comAdubo.ureiaG)} g de ureia`,
      nota: "Espalhar ao lado das plantas e regar em seguida.",
    });
  } else if (primeiraTarefa) {
    resumo.push({
      tom: "tarefa",
      icone: <ListChecks className="size-5" />,
      tag: "Tarefa",
      titulo: `${tituloTarefa(primeiraTarefa.an, primeiraTarefa.a)} (${primeiraTarefa.an.c.cultura.toLowerCase()})`,
      nota: quando(primeiraTarefa.an, primeiraTarefa.a),
    });
  }

  const choque = analises
    .flatMap((an) => an.semana.filter((a) => !an.c.feitas.includes(a.id)).map((a) => ({ an, a, provas: conflitos(an, a) })))
    .find((x) => x.provas.length > 0);
  const anCritica = analises.find((an) => an.critica);
  const anFungo = analises.find((an) => an.riscoFungo);

  if (choque) {
    resumo.push({
      tom: "alerta",
      icone: <GraduationCap className="size-5" />,
      tag: "Atenção",
      titulo: `${choque.provas[0].titulo} ${diaCurto(choque.provas[0].data, hoje)}`,
      nota: `Cai na janela de "${tituloTarefa(choque.an, choque.a).toLowerCase()}". Faça antes.`,
    });
  } else if (anCritica) {
    resumo.push({ tom: "alerta", icone: <TriangleAlert className="size-5" />, tag: "Atenção", titulo: `Fase crítica de água no ${anCritica.c.cultura.toLowerCase()}`, nota: "Não pule nenhuma rega nesta fase." });
  } else if (anFungo) {
    resumo.push({ tom: "alerta", icone: <TriangleAlert className="size-5" />, tag: "Atenção", titulo: "Risco de fungos na soja", nota: "Ar úmido nos próximos dias. Regue de manhã e vistorie as folhas." });
  }

  /* ---------- semana ---------- */
  const semanaDias = Array.from({ length: 7 }, (_, i) => somarDias(hoje, i));
  const marcas: Record<string, { prova: boolean; adubo: boolean; capina: boolean }> = {};
  for (const d of semanaDias) marcas[d] = { prova: false, adubo: false, capina: false };
  for (const pr of provas) if (marcas[pr.data]) marcas[pr.data].prova = true;
  for (const an of analises) {
    for (const a of an.semana) {
      if (an.c.feitas.includes(a.id)) continue;
      const dia = an.das >= a.inicio ? an.dataDoDas(a.fim) : an.dataDoDas(a.inicio);
      if (!marcas[dia]) continue;
      if (a.id === "adubacao") marcas[dia].adubo = true;
      if (a.id.startsWith("capina")) marcas[dia].capina = true;
    }
  }

  const dataHoje = paraData(hoje);

  return (
    <main className="min-h-screen bg-fundo text-texto">
      <div className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        {/* BARRA */}
        <nav className="flex items-center justify-between py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-azul text-white">
              <Leaf className="size-5" aria-hidden />
            </span>
            <span className="text-xl font-semibold tracking-tight">Nu Agro</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-1.5 text-sm text-suave sm:flex">
              <MapPin className="size-3.5" aria-hidden />
              Campinas · Unicamp
            </span>
            <Link href="/agro/estande" className="flex items-center gap-1.5 rounded-full border border-linha px-4 py-2 text-sm font-medium transition hover:border-azul hover:text-azul-claro">
              <Calculator className="size-4" aria-hidden />
              Estande
            </Link>
          </div>
        </nav>

        {/* TOPO */}
        <header className="pb-8 pt-6 sm:pb-12 sm:pt-12">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-azul-claro">
            {DIAS_LONGOS[dataHoje.getDay()]}, {dataHoje.getDate()} de {MESES[dataHoje.getMonth()]}
          </p>
          <h1 className="mt-4 max-w-3xl text-[2.15rem] font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Canteiros, culturas e uma agenda de provas: <span className="text-azul-claro">o que fazer hoje?</span>
          </h1>

          {emExemplo && (
            <p className="mt-6 max-w-2xl rounded-2xl border border-azul/40 bg-azul/10 px-4 py-3 text-sm text-texto">
              <strong>Exemplo ao vivo:</strong> dois canteiros fictícios com o <strong>clima real de hoje</strong> em Campinas.{" "}
              <a href="#cadastrar" className="font-semibold text-azul-claro underline underline-offset-2">Cadastre os seus</a>.
            </p>
          )}

          <div className="mt-8 rounded-3xl border border-linha bg-cartao p-3 sm:max-w-xl">
            <ol className="grid grid-cols-7 gap-1">
              {semanaDias.map((d, i) => {
                const m = marcas[d];
                return (
                  <li
                    key={d}
                    className={`flex flex-col items-center gap-1 rounded-2xl py-2.5 ${
                      i === 0 ? "bg-azul text-white" : m.prova ? "bg-alerta-fundo" : ""
                    }`}
                  >
                    <span className={`text-[11px] ${i === 0 ? "text-white/80" : "text-suave"}`}>{DIAS[paraData(d).getDay()]}</span>
                    <span className="text-base font-bold">{paraData(d).getDate()}</span>
                    <span className="flex h-1.5 gap-0.5">
                      {m.prova && <span className="size-1.5 rounded-full bg-alerta" />}
                      {m.adubo && <span className="size-1.5 rounded-full bg-milho" />}
                      {m.capina && <span className="size-1.5 rounded-full bg-soja" />}
                    </span>
                  </li>
                );
              })}
            </ol>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 px-2 pb-1 pt-2 text-xs text-suave">
              <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-alerta" />Prova</span>
              <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-milho" />Prazo de adubo</span>
              <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-soja" />Capina</span>
            </div>
          </div>
        </header>

        {/* RESUMO */}
        <Secao titulo="Resumo do dia" subtitulo="O essencial, em poucas frases.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {resumo.slice(0, 4).map((r, i) => {
              const alerta = r.tom === "alerta";
              return (
                <article
                  key={r.titulo}
                  className={`subir flex min-h-40 flex-col justify-between gap-6 rounded-3xl border p-5 sm:p-6 ${
                    alerta ? "border-alerta-borda bg-alerta-fundo" : "border-linha bg-cartao"
                  }`}
                  style={{ animationDelay: `${i * 60}ms`, ...(r.cor ? { backgroundColor: `${r.cor}14`, borderColor: `${r.cor}40` } : {}) }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-bold uppercase tracking-[0.12em]"
                      style={{ color: alerta ? "#fca5a5" : r.cor ?? "#60a5fa" }}
                    >
                      {r.tag}
                    </span>
                    <span
                      className="grid size-11 place-items-center rounded-2xl"
                      style={{
                        backgroundColor: alerta ? "rgba(248,113,113,0.15)" : r.cor ? `${r.cor}26` : "rgba(59,130,246,0.15)",
                        color: alerta ? "#fca5a5" : r.cor ?? "#60a5fa",
                      }}
                    >
                      {r.icone}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold leading-[1.15] tracking-tight text-balance">{r.titulo}</h3>
                    <p className={`mt-2 text-sm ${alerta ? "text-red-200/80" : "text-suave"}`}>{r.nota}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </Secao>

        {/* CANTEIROS */}
        <Secao titulo="Os canteiros" subtitulo="Onde cada planta está e o que ela pede nesta semana.">
          <div className="grid gap-5 lg:grid-cols-2">
            {analises.map((an) => {
              const { c, p } = an;
              const cor = COR[c.cultura];
              const Icone = c.cultura === "Milho" ? Wheat : Sprout;
              const pendentes = an.semana.filter((a) => !c.feitas.includes(a.id)).length;
              const materiais = Array.from(
                new Set(an.semana.filter((a) => !c.feitas.includes(a.id)).flatMap((a) => a.recursos))
              );
              const dataColheita = an.dataDoDas(an.das + an.diasColheita);

              return (
                <article key={c.id} className="subir overflow-hidden rounded-3xl border border-linha bg-cartao">
                  <header className="flex items-start justify-between gap-4 px-5 pb-6 pt-5 sm:px-7 sm:pt-7" style={{ backgroundColor: COR_FUNDO[c.cultura] }}>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: cor }}>
                        {c.nome} · {br(c.area)} m²
                      </p>
                      <h3 className="mt-1 text-3xl font-semibold tracking-tight">{c.cultura}</h3>
                      <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-suave">
                        {an.das < 0 ? (
                          <span>Plantio em {formatarData(c.semeadura)}</span>
                        ) : (
                          <>
                            <span><span className="font-semibold text-texto">{an.das} dias</span> desde o plantio</span>
                            <Termo titulo="DAS · Dias após a semeadura" explicacao="Contagem de dias desde o plantio. É o relógio que o app usa para prever cada fase.">
                              {an.das} DAS
                            </Termo>
                          </>
                        )}
                      </p>
                    </div>
                    <span className="grid size-14 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: cor, color: "#0a0f1c" }}>
                      <Icone className="size-7" aria-hidden />
                    </span>
                  </header>

                  <div className="space-y-7 px-5 py-6 sm:px-7 sm:py-7">
                    {/* FASE */}
                    <section>
                      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <p className="text-base">
                          Fase: <span className="font-semibold">{an.est.codigo} · {an.est.nome}</span>
                          {c.ajusteDias !== 0 && <span className="ml-2 text-xs text-azul-claro">ajustada no campo</span>}
                        </p>
                        <Termo titulo="Estádio fenológico" explicacao={MACRO_AJUDA[an.macro]}>
                          Estádio {an.est.codigo}
                        </Termo>
                      </div>
                      <LinhaDoCiclo macro={an.macro} cor={cor} />
                      <p className="mt-4 flex items-center gap-2 text-sm text-suave">
                        <CalendarClock className="size-4" aria-hidden />
                        {an.diasColheita > 0
                          ? `Colheita em cerca de ${Math.max(1, Math.round(an.diasColheita / 7))} semanas · ${formatarData(dataColheita)}`
                          : "Na janela de colheita"}
                      </p>
                      <label className="mt-3 flex flex-wrap items-center gap-2 text-sm text-suave">
                        Viu outra fase no campo?
                        <select
                          className="rounded-lg border border-linha bg-fundo px-2 py-1 text-sm text-texto"
                          value={c.ajusteDias === 0 ? "" : an.est.codigo}
                          onChange={(e) => confirmarEstadio(c, e.target.value, an.dasReal)}
                        >
                          <option value="">Usar estimativa</option>
                          {p.estadios.map((e) => (
                            <option key={e.codigo} value={e.codigo}>
                              {e.codigo} · {e.nome}
                            </option>
                          ))}
                        </select>
                      </label>
                    </section>

                    {/* ALERTAS */}
                    {an.critica && (
                      <p className="flex gap-3 rounded-2xl border border-alerta-borda bg-alerta-fundo p-4 text-sm text-red-100">
                        <TriangleAlert className="size-5 shrink-0 text-alerta" aria-hidden />
                        <span><strong>{an.critica.titulo}.</strong> {an.critica.texto}</span>
                      </p>
                    )}
                    {an.riscoFungo && (
                      <p className="flex gap-3 rounded-2xl border border-alerta-borda bg-alerta-fundo p-4 text-sm text-red-100">
                        <TriangleAlert className="size-5 shrink-0 text-alerta" aria-hidden />
                        <span><strong>Risco de fungos.</strong> Plantas fechadas e umidade de {br(clima.umidade ?? 0, 0)}% prevista. Regue de manhã e vistorie as folhas de baixo.</span>
                      </p>
                    )}

                    {/* ÁGUA */}
                    {an.das >= 0 && (
                      <section className="flex items-center gap-4 rounded-2xl border border-agua/20 bg-agua/10 p-4">
                        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-fundo text-agua">
                          <Droplets className="size-6" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-agua">Água de hoje</p>
                          <p className="text-2xl font-semibold leading-tight">
                            {an.lamina === 0 ? "Não regar" : `${br(an.litros, 1)} litros`}
                          </p>
                          <p className="text-sm text-suave">
                            {an.lamina === 0 && chuvaHoje > 0 ? "A chuva prevista já resolve" : "Direto no solo, pela manhã"}
                          </p>
                        </div>
                        <Termo
                          titulo="Como calculamos"
                          explicacao={`ETo ${br(etoUsada, 1)} mm × Kc ${br(an.kc, 2)} = ${br(an.etc, 2)} mm. Menos ${br(chuvaHoje, 1)} mm de chuva = ${br(an.lamina, 2)} mm. Vezes ${br(c.area)} m² ÷ eficiência do gotejo (0,9) = ${br(an.litros, 1)} L.`}
                        >
                          Kc {br(an.kc, 2)}
                        </Termo>
                      </section>
                    )}

                    {/* TAREFAS */}
                    <section>
                      <div className="mb-3 flex items-baseline justify-between">
                        <h4 className="font-semibold">Tarefas da semana</h4>
                        <span className="text-xs text-suave">
                          {pendentes === 0 ? "Tudo feito" : `${pendentes} pendente${pendentes > 1 ? "s" : ""}`}
                        </span>
                      </div>
                      {an.semana.length === 0 ? (
                        <p className="rounded-2xl border border-linha p-4 text-sm text-suave">Nenhuma tarefa nesta semana.</p>
                      ) : (
                        <ul className="divide-y divide-linha rounded-2xl border border-linha">
                          {an.semana.map((a) => {
                            const feita = c.feitas.includes(a.id);
                            const rot = quando(an, a);
                            const choques = feita ? [] : conflitos(an, a);
                            return (
                              <li key={a.id}>
                                <label className="flex cursor-pointer items-start gap-3 px-4 py-3.5 transition hover:bg-cartao-2">
                                  <input
                                    type="checkbox"
                                    checked={feita}
                                    onChange={() => alternarFeita(c, a.id)}
                                    className="mt-0.5 size-5 shrink-0 accent-[#3b82f6]"
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span className={`block font-medium leading-snug ${feita ? "text-apagado line-through" : ""}`}>
                                      {tituloTarefa(an, a)}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-suave">{a.texto}</span>
                                    {choques.map((pr) => (
                                      <span key={pr.titulo + pr.data} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-alerta-fundo px-2.5 py-1 text-xs font-medium text-red-200">
                                        <GraduationCap className="size-3.5" aria-hidden />
                                        {pr.titulo} {diaCurto(pr.data, hoje)}: faça antes
                                      </span>
                                    ))}
                                  </span>
                                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${rot === "Hoje" ? "bg-azul text-white" : "bg-cartao-2 text-texto"}`}>
                                    {rot}
                                  </span>
                                </label>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </section>

                    {/* MATERIAIS */}
                    {materiais.length > 0 && (
                      <section>
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                          <Package className="size-4 text-suave" aria-hidden />
                          Separar para a semana
                        </h4>
                        <ul className="flex flex-wrap gap-2">
                          {materiais.map((m) => (
                            <li key={m} className="rounded-full border border-linha bg-cartao-2 px-3 py-1.5 text-sm">{m}</li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {/* PLANO COMPLETO */}
                    <details className="rounded-2xl border border-linha p-4">
                      <summary className="cursor-pointer text-sm font-semibold text-azul-claro">Plano completo do ciclo</summary>
                      <ul className="mt-3 space-y-2 text-sm">
                        {p.atividades.map((a) => (
                          <li key={a.id} className="flex items-center gap-2">
                            <span className={`size-2 shrink-0 rounded-full ${a.critica ? "bg-alerta" : c.feitas.includes(a.id) ? "bg-soja" : "bg-linha"}`} />
                            <span className="flex-1">{tituloTarefa(an, a)}</span>
                            <span className="text-suave">{formatarData(an.dataDoDas(a.inicio))} a {formatarData(an.dataDoDas(a.fim))}</span>
                          </li>
                        ))}
                      </ul>
                    </details>

                    {!emExemplo && (
                      <button onClick={() => removerCanteiro(c.id)} className="text-sm text-apagado transition hover:text-alerta">
                        Apagar canteiro
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </Secao>

        {/* CLIMA */}
        <Secao titulo="Clima de hoje" subtitulo="É daqui que sai a conta da água.">
          <article className="subir rounded-3xl border border-linha bg-cartao p-5 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="grid size-14 place-items-center rounded-2xl bg-milho/15 text-milho">
                  <CloudSun className="size-7" aria-hidden />
                </span>
                <div>
                  <p className="text-sm text-suave">Campinas, SP</p>
                  <p className="font-medium">{erroClima ? "Previsão indisponível" : descricaoTempo(clima.codigo)}</p>
                </div>
              </div>
              {clima.tmax !== null && clima.tmin !== null && (
                <p className="flex items-center gap-1.5 text-sm text-suave">
                  <Thermometer className="size-4" aria-hidden />
                  <span className="text-2xl font-semibold text-texto">{Math.round(clima.tmax)}°</span>/ {Math.round(clima.tmin)}°
                </p>
              )}
            </div>

            {erroClima ? (
              <label className="mt-6 block max-w-sm text-sm text-suave">
                Não consegui buscar a previsão. Informe a ETo do dia (mm):
                <input className={`${campo} mt-2`} inputMode="decimal" value={etoManual} onChange={(e) => setEtoManual(e.target.value)} />
              </label>
            ) : (
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Metrica
                  icone={<Wind className="size-5" aria-hidden />}
                  rotulo="Água que o ambiente puxa"
                  valor={clima.eto === null ? "..." : `${br(clima.eto, 1)} L por m²`}
                  dica="Sol, vento e calor tiram essa água do solo e das folhas hoje."
                  termo={<Termo titulo="ETo · Evapotranspiração de referência" explicacao="Quanta água uma grama padrão perderia hoje para o ar. É a base para calcular a rega de cada cultura.">ETo</Termo>}
                />
                <Metrica
                  icone={<CloudRain className="size-5" aria-hidden />}
                  rotulo="Chuva prevista"
                  valor={`${br(chuvaHoje, 1)} mm`}
                  dica={clima.prob !== null ? `${Math.round(clima.prob)}% de chance de chuva hoje.` : "Previsão para hoje."}
                  termo={<Termo titulo="Milímetro de chuva" explicacao="1 mm de chuva é 1 litro de água em cada metro quadrado de solo.">1 mm = 1 L/m²</Termo>}
                />
                <Metrica
                  icone={<Droplets className="size-5" aria-hidden />}
                  rotulo="Umidade do ar"
                  valor={clima.umidade === null ? "..." : `${br(clima.umidade, 0)}%`}
                  dica={
                    clima.umidade === null
                      ? "Média dos próximos 3 dias."
                      : clima.umidade >= 80
                        ? "Ar muito úmido: atenção a fungos na soja."
                        : clima.umidade < 40
                          ? "Ar seco: as plantas perdem água mais rápido."
                          : "Confortável para as plantas."
                  }
                  termo={<Termo titulo="Umidade relativa" explicacao="Quanto vapor de água há no ar. Média prevista para os próximos 3 dias.">UR</Termo>}
                />
              </div>
            )}
            <p className="mt-4 text-xs text-apagado">Fonte: previsão Open-Meteo, atualizada a cada visita.</p>
          </article>
        </Secao>

        {/* COMO FUNCIONA */}
        <Secao titulo="Como funciona" subtitulo="Três passos, todo dia de manhã.">
          <ol className="grid gap-4 sm:grid-cols-3 sm:gap-5">
            {[
              { icone: <CloudSun className="size-10" aria-hidden />, cor: "#fbbf24", titulo: "Lê o clima do dia", texto: "Sol, vento, calor e chuva prevista dizem quanta água o canteiro vai perder." },
              { icone: <Calculator className="size-10" aria-hidden />, cor: "#38bdf8", titulo: "Calcula o que cada planta precisa", texto: "Considera a fase de cada cultura e o tamanho do canteiro para chegar em litros e gramas." },
              { icone: <ListChecks className="size-10" aria-hidden />, cor: "#34d399", titulo: "Entrega tarefas simples", texto: "Monta a semana e avisa quando uma tarefa cai perto de uma prova." },
            ].map((s, i) => (
              <li key={s.titulo} className="subir overflow-hidden rounded-3xl border border-linha bg-cartao" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="grid aspect-[4/3] place-items-center" style={{ backgroundColor: `${s.cor}14`, color: s.cor }}>
                  <span className="grid size-24 place-items-center rounded-3xl" style={{ backgroundColor: `${s.cor}1f` }}>
                    {s.icone}
                  </span>
                </div>
                <div className="p-5 sm:p-6">
                  <span className="grid size-8 place-items-center rounded-full bg-azul text-sm font-bold text-white">{i + 1}</span>
                  <h3 className="mt-3 text-xl font-semibold">{s.titulo}</h3>
                  <p className="mt-1.5 text-sm text-suave">{s.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </Secao>

        {/* CADASTRO */}
        <Secao id="cadastrar" titulo="Cadastrar canteiro" subtitulo={emExemplo ? "Ao cadastrar o primeiro, o exemplo some e aparecem os seus." : "Adicione outro canteiro."}>
          <div className="rounded-3xl border border-linha bg-cartao p-5 sm:p-7">
            <div className="flex gap-2">
              {(["Milho", "Soja"] as Cultura[]).map((cu) => (
                <button
                  key={cu}
                  onClick={() => setCultura(cu)}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    cultura === cu ? "bg-azul text-white" : "border border-linha text-suave hover:text-texto"
                  }`}
                >
                  {cu}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <label className="text-sm text-suave">
                Nome
                <input className={`${campo} mt-1`} placeholder={`Canteiro de ${cultura.toLowerCase()}`} value={nome} onChange={(e) => setNome(e.target.value)} />
              </label>
              <label className="text-sm text-suave">
                Data de plantio
                <input className={`${campo} mt-1`} type="date" value={semeadura} onChange={(e) => setSemeadura(e.target.value)} />
              </label>
              <label className="text-sm text-suave">
                Área (m²)
                <input className={`${campo} mt-1`} inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value)} />
              </label>
            </div>

            {cultura === "Milho" ? (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm text-suave">
                  Dose de nitrogênio (kg/ha)
                  <input className={`${campo} mt-1`} inputMode="decimal" value={doseN} onChange={(e) => setDoseN(e.target.value)} disabled={metaT !== null} />
                  <span className="mt-1 block text-xs text-apagado">Embrapa, milho irrigado: 100 a 150 kg/ha.</span>
                </label>
                <label className="text-sm text-suave">
                  Ou pela meta de colheita (t/ha)
                  <input className={`${campo} mt-1`} inputMode="decimal" placeholder="9" value={meta} onChange={(e) => setMeta(e.target.value)} />
                  <span className="mt-1 block text-xs text-apagado">
                    {metaT !== null
                      ? `${br(metaT)} t/ha = ${br((metaT * 1000) / 60, 1)} sacos/ha → ${br((metaT * 1000) / 60, 1)} kg de N/ha`
                      : "Boletim 100 (IAC): cerca de 1 kg de N/ha por saco de 60 kg."}
                  </span>
                </label>
              </div>
            ) : (
              <p className="mt-4 rounded-2xl border border-soja/30 bg-soja/10 p-4 text-sm">
                Soja: sem adubo nitrogenado. O nitrogênio vem das bactérias da raiz (fixação biológica).
              </p>
            )}

            <button onClick={adicionarCanteiro} className="mt-6 rounded-full bg-azul px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500">
              Adicionar canteiro
            </button>
          </div>
        </Secao>
      </div>

      <footer className="border-t border-linha">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-8 text-sm text-apagado sm:flex-row sm:justify-between sm:px-8">
          <span>Nu Agro · projeto de portfólio · Engenharia Agrícola, Unicamp</span>
          <span>Bases: FAO-56, Boletim 100 (IAC), Embrapa, escalas de Ritchie e Fehr e Caviness.</span>
        </div>
      </footer>
    </main>
  );
}