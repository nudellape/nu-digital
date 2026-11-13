"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Calculator } from "lucide-react";

const campo =
  "w-full rounded-xl border border-linha bg-fundo px-4 py-3 text-base text-texto outline-none transition focus:border-azul";

function paraNumero(texto: string) {
  const limpo = texto.trim().replace(",", ".");
  const n = Number(limpo);
  return limpo === "" || isNaN(n) ? null : n;
}

function br(n: number, casas = 2) {
  return n.toLocaleString("pt-BR", { maximumFractionDigits: casas });
}

const CULTURAS = [
  { nome: "Milho", entrePlantas: "15", cor: "#fbbf24" },
  { nome: "Soja", entrePlantas: "7,5", cor: "#34d399" },
];

function Campo({
  rotulo,
  valor,
  mudar,
  unidade,
}: {
  rotulo: string;
  valor: string;
  mudar: (v: string) => void;
  unidade: string;
}) {
  return (
    <label className="text-sm text-suave">
      {rotulo}
      <div className="mt-1 flex items-center gap-2">
        <input className={campo} inputMode="decimal" value={valor} onChange={(e) => mudar(e.target.value)} />
        <span className="w-8 shrink-0 text-apagado">{unidade}</span>
      </div>
    </label>
  );
}

export default function Estande() {
  const [cultura, setCultura] = useState("Milho");
  const [comprimento, setComprimento] = useState("2");
  const [largura, setLargura] = useState("1");
  const [entrePlantas, setEntrePlantas] = useState("15");
  const [entreLinhas, setEntreLinhas] = useState("");
  const [contadas, setContadas] = useState("");

  const cor = CULTURAS.find((c) => c.nome === cultura)?.cor ?? "#60a5fa";

  const C = paraNumero(comprimento);
  const L = paraNumero(largura);
  const ep = paraNumero(entrePlantas);
  const el = paraNumero(entreLinhas);
  const n = paraNumero(contadas);

  const area = C && L ? C * L : null;
  const epM = ep ? ep / 100 : null;
  const elM = el ? el / 100 : null;
  const areaPorPlanta = epM && elM ? epM * elM : null;
  const densPlan = areaPorPlanta ? 1 / areaPorPlanta : null;
  const haPlan = densPlan ? densPlan * 10000 : null;
  const canteiroPlan = densPlan && area ? densPlan * area : null;
  const densReal = n !== null && area ? n / area : null;
  const haReal = densReal !== null ? densReal * 10000 : null;
  const pct = densReal !== null && densPlan ? (densReal / densPlan) * 100 : null;

  let diagnostico: { texto: string; classe: string } | null = null;
  if (pct !== null) {
    if (pct >= 90) diagnostico = { texto: "Estande adequado.", classe: "border-soja/30 bg-soja/10 text-soja" };
    else if (pct >= 80)
      diagnostico = { texto: "Atenção: há falhas. Vale observar as linhas.", classe: "border-milho/30 bg-milho/10 text-milho" };
    else
      diagnostico = { texto: "Muitas falhas. Avalie replantio pontual.", classe: "border-alerta-borda bg-alerta-fundo text-alerta" };
  }

  const passos: string[] = [];
  if (area && C && L) passos.push(`Área do canteiro: ${br(C)} m × ${br(L)} m = ${br(area, 4)} m²`);
  if (areaPorPlanta && epM && elM)
    passos.push(`Área ocupada por planta: ${br(epM, 4)} m × ${br(elM, 4)} m = ${br(areaPorPlanta, 6)} m²`);
  if (densPlan && areaPorPlanta)
    passos.push(`Densidade planejada: 1 ÷ ${br(areaPorPlanta, 6)} = ${br(densPlan, 4)} plantas/m²`);
  if (haPlan && densPlan) passos.push(`Por hectare: ${br(densPlan, 4)} × 10 000 = ${br(haPlan, 0)} plantas/ha`);
  if (canteiroPlan && densPlan && area)
    passos.push(`Plantas previstas no canteiro: ${br(densPlan, 4)} × ${br(area, 4)} = ${br(canteiroPlan, 2)}`);
  if (densReal !== null && n !== null && area)
    passos.push(`Estande real: ${br(n)} ÷ ${br(area, 4)} = ${br(densReal, 4)} plantas/m²`);
  if (pct !== null && densReal !== null && densPlan)
    passos.push(`Percentual do planejado: ${br(densReal, 4)} ÷ ${br(densPlan, 4)} × 100 = ${br(pct, 1)}%`);

  return (
    <main className="min-h-screen bg-fundo text-texto">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <Link href="/agro" className="inline-flex items-center gap-1.5 text-sm font-medium text-azul-claro">
          <ArrowLeft className="size-4" aria-hidden />
          Nu Agro
        </Link>

        <header className="mt-8 flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-azul text-white">
            <Calculator className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Calculadora de estande</h1>
            <p className="text-suave">Quantas plantas deveriam existir e quantas existem de verdade.</p>
          </div>
        </header>

        <section className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-linha bg-cartao p-6">
            <h2 className="text-lg font-semibold">Dados do canteiro</h2>

            <div className="mt-4 flex gap-2">
              {CULTURAS.map((c) => (
                <button
                  key={c.nome}
                  onClick={() => {
                    setCultura(c.nome);
                    setEntrePlantas(c.entrePlantas);
                  }}
                  className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                    cultura === c.nome ? "bg-azul text-white" : "border border-linha text-suave hover:text-texto"
                  }`}
                >
                  {c.nome}
                </button>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Campo rotulo="Comprimento" valor={comprimento} mudar={setComprimento} unidade="m" />
              <Campo rotulo="Largura" valor={largura} mudar={setLargura} unidade="m" />
              <Campo rotulo="Entre plantas" valor={entrePlantas} mudar={setEntrePlantas} unidade="cm" />
              <Campo rotulo="Entre linhas" valor={entreLinhas} mudar={setEntreLinhas} unidade="cm" />
            </div>

            <div className="mt-3">
              <Campo rotulo="Plantas contadas (opcional)" valor={contadas} mudar={setContadas} unidade="pl." />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border p-6" style={{ backgroundColor: `${cor}14`, borderColor: `${cor}40` }}>
              <p className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: cor }}>
                Planejado · {cultura}
              </p>
              {densPlan ? (
                <>
                  <p className="mt-2 text-4xl font-semibold tracking-tight">{br(densPlan, 1)} plantas/m²</p>
                  <p className="text-suave">{br(haPlan ?? 0, 0)} plantas por hectare</p>
                  {canteiroPlan && (
                    <p className="mt-2 text-suave">
                      Cerca de <strong className="text-texto">{br(canteiroPlan, 0)} plantas</strong> no canteiro
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-suave">Preencha os espaçamentos.</p>
              )}
            </div>

            <div className="rounded-3xl border border-agua/20 bg-agua/10 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-agua">Real</p>
              {densReal !== null ? (
                <>
                  <p className="mt-2 text-4xl font-semibold tracking-tight">{br(densReal, 1)} plantas/m²</p>
                  <p className="text-suave">{br(haReal ?? 0, 0)} plantas por hectare</p>
                  {pct !== null && (
                    <p className="mt-2 text-suave">
                      <strong className="text-texto">{br(pct, 1)}%</strong> do planejado
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-suave">Informe as plantas contadas.</p>
              )}
            </div>

            {diagnostico && (
              <p className={`rounded-3xl border p-5 font-semibold ${diagnostico.classe}`}>{diagnostico.texto}</p>
            )}
          </div>
        </section>

        {passos.length > 0 && (
          <section className="mt-6 rounded-3xl border border-linha bg-cartao p-6">
            <h2 className="text-lg font-semibold">Memória de cálculo</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 font-mono text-sm text-suave">
              {passos.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-apagado">
              Faixas de diagnóstico (90% e 80%) são uma referência didática. Ajuste conforme a orientação do
              agrônomo responsável.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}