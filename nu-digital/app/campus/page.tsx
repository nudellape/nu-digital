"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Avaliacao = {
  id: string;
  nome: string;
  peso: number;
  data: string;
  nota: number | null;
};

type Disciplina = {
  id: string;
  nome: string;
  codigo: string;
  meta: number;
  cor: string;
  avaliacoes: Avaliacao[];
};

type Linha = { nome: string; peso: string };

const CHAVE = "nu-campus-v2";
const CORES = ["#F0D7D8", "#DEE3C5", "#F8E4AD", "#DFE6D3", "#E3DCEF", "#F3D9C4"];

const campo =
  "w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base outline-none focus:border-[#82132D]";
const campoPequeno =
  "w-full rounded-lg border border-black/15 bg-white px-2 py-1.5 text-base outline-none focus:border-[#82132D]";
const botao =
  "rounded-full bg-[#82132D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#601024]";
const botaoSecundario =
  "rounded-full border border-[#82132D] px-5 py-2 text-sm font-semibold text-[#82132D] transition hover:bg-[#82132D] hover:text-white";

function novoId() {
  return Math.random().toString(36).slice(2, 10);
}

function paraNumero(texto: string) {
  const limpo = texto.trim().replace(",", ".");
  const n = Number(limpo);
  return limpo === "" || isNaN(n) ? null : n;
}

function formatar(n: number) {
  return n.toFixed(1).replace(".", ",");
}

function formatarPeso(n: number) {
  return String(Number(n.toFixed(4))).replace(".", ",");
}

function formatarData(data: string) {
  const [a, m, d] = data.split("-");
  return `${d}/${m}/${a}`;
}

function diasAte(data: string) {
  const [a, m, d] = data.split("-").map(Number);
  const alvo = new Date(a, m - 1, d);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

function textoPrazo(dias: number) {
  if (dias < 0) return "já passou, lance a nota";
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanhã";
  return `em ${dias} dias`;
}

function corPrazo(dias: number) {
  if (dias < 0) return "bg-zinc-200 text-zinc-600";
  if (dias <= 3) return "bg-[#82132D] text-white";
  if (dias <= 7) return "bg-[#E8B83F] text-[#202020]";
  return "bg-white text-zinc-600";
}

function situacao(d: Disciplina) {
  const lista = d.avaliacoes.filter((a) => a.peso > 0);
  const pesoTotal = lista.reduce((s, a) => s + a.peso, 0);
  const feitas = lista.filter((a) => a.nota !== null);
  const pesoFeito = feitas.reduce((s, a) => s + a.peso, 0);
  const pontos = feitas.reduce((s, a) => s + (a.nota ?? 0) * a.peso, 0);
  const pesoRestante = pesoTotal - pesoFeito;

  return {
    mediaParcial: pesoFeito > 0 ? pontos / pesoFeito : null,
    precisa: pesoRestante > 1e-9 ? (d.meta * pesoTotal - pontos) / pesoRestante : null,
    mediaFinal: pesoTotal > 0 && pesoRestante <= 1e-9 ? pontos / pesoTotal : null,
  };
}

function lerTabela(texto: string) {
  return texto
    .split(/\r?\n/)
    .map((l) => l.split("\t"))
    .filter((l) => l.some((c) => c.trim() !== ""));
}

function ehLinhaDeMedia(rotulo: string) {
  const r = rotulo.toUpperCase();
  return r.startsWith("MÉDIA") || r.startsWith("MEDIA");
}

// Aba PESOS: linha 1 = nomes | linha 2 (opcional) = códigos | demais = avaliação + pesos
function lerPesos(texto: string, jaExistentes: number): Disciplina[] {
  const linhas = lerTabela(texto);
  if (linhas.length < 2) return [];

  const nomes = linhas[0];
  const temCodigos = linhas[1].slice(1).some((c) => c.trim() !== "" && paraNumero(c) === null);
  const codigos = temCodigos ? linhas[1] : [];
  const linhasDePeso = linhas.slice(temCodigos ? 2 : 1);

  const resultado: Disciplina[] = [];
  for (let col = 1; col < nomes.length; col++) {
    const nome = nomes[col]?.trim();
    if (!nome) continue;

    const avaliacoes: Avaliacao[] = [];
    for (const linha of linhasDePeso) {
      const rotulo = linha[0]?.trim();
      if (!rotulo || ehLinhaDeMedia(rotulo)) continue;
      const peso = paraNumero(linha[col] ?? "");
      if (peso === null || peso <= 0) continue;
      avaliacoes.push({ id: novoId(), nome: rotulo.toUpperCase(), peso, data: "", nota: null });
    }

    resultado.push({
      id: novoId(),
      nome,
      codigo: codigos[col]?.trim().toUpperCase() ?? "",
      meta: 5,
      cor: CORES[(jaExistentes + resultado.length) % CORES.length],
      avaliacoes,
    });
  }
  return resultado;
}

// Aba NOTAS: linha 1 = códigos (ou nomes) | demais = avaliação + notas
function aplicarNotas(texto: string, disciplinas: Disciplina[], zeroEhVazio: boolean) {
  const linhas = lerTabela(texto);
  const problemas = new Set<string>();
  let lancadas = 0;

  const copia = disciplinas.map((d) => ({ ...d, avaliacoes: d.avaliacoes.map((a) => ({ ...a })) }));
  if (linhas.length < 2) return { copia, lancadas, problemas: [] as string[] };

  const cabecalho = linhas[0];
  for (let col = 1; col < cabecalho.length; col++) {
    const chave = cabecalho[col]?.trim().toUpperCase();
    if (!chave) continue;

    const disc = copia.find((d) => d.codigo === chave || d.nome.toUpperCase() === chave);
    if (!disc) {
      problemas.add(`disciplina ${chave} não cadastrada`);
      continue;
    }

    for (const linha of linhas.slice(1)) {
      const rotulo = linha[0]?.trim().toUpperCase();
      if (!rotulo || ehLinhaDeMedia(rotulo)) continue;
      const celula = (linha[col] ?? "").trim();
      if (celula === "") continue;

      const av = disc.avaliacoes.find((a) => a.nome.toUpperCase() === rotulo);
      if (!av) {
        problemas.add(`${rotulo} não existe em ${chave}`);
        continue;
      }

      let nota = paraNumero(celula);
      if (nota === 0 && zeroEhVazio) nota = null;
      av.nota = nota;
      if (nota !== null) lancadas++;
    }
  }
  return { copia, lancadas, problemas: [...problemas] };
}

export default function NuCampus() {
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [carregado, setCarregado] = useState(false);

  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [meta, setMeta] = useState("5");
  const [linhas, setLinhas] = useState<Linha[]>([
    { nome: "P1", peso: "" },
    { nome: "P2", peso: "" },
  ]);

  const [textoPesos, setTextoPesos] = useState("");
  const [textoNotas, setTextoNotas] = useState("");
  const [zeroEhVazio, setZeroEhVazio] = useState(true);

  // Carrega o que estava salvo no navegador
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) setDisciplinas(JSON.parse(salvo));
    } catch {
      // se der erro, começa vazio
    }
    setCarregado(true);
  }, []);

  // Salva sempre que algo muda
  useEffect(() => {
    if (!carregado) return;
    try {
      localStorage.setItem(CHAVE, JSON.stringify(disciplinas));
    } catch {
      // navegador sem armazenamento: segue sem salvar
    }
  }, [disciplinas, carregado]);

  const somaPesos = linhas.reduce((s, l) => s + (paraNumero(l.peso) ?? 0), 0);
  const somaFechaEmUm = Math.abs(somaPesos - 1) < 0.001;

  function mudarLinha(i: number, campoNome: keyof Linha, valor: string) {
    setLinhas((atual) => atual.map((l, j) => (j === i ? { ...l, [campoNome]: valor } : l)));
  }

  function adicionarLinha() {
    setLinhas((atual) => [...atual, { nome: `P${atual.length + 1}`, peso: "" }]);
  }

  function removerLinha(i: number) {
    setLinhas((atual) => atual.filter((_, j) => j !== i));
  }

  function salvarDisciplina() {
    const avaliacoes = linhas
      .map((l) => ({ nome: l.nome.trim().toUpperCase(), peso: paraNumero(l.peso) }))
      .filter((l) => l.nome && l.peso !== null && l.peso > 0)
      .map((l) => ({ id: novoId(), nome: l.nome, peso: l.peso as number, data: "", nota: null }));

    if (!nome.trim() || avaliacoes.length === 0) {
      alert("Coloque o nome da disciplina e pelo menos uma avaliação com peso.");
      return;
    }

    setDisciplinas((atual) => [
      ...atual,
      {
        id: novoId(),
        nome: nome.trim(),
        codigo: codigo.trim().toUpperCase(),
        meta: paraNumero(meta) ?? 5,
        cor: CORES[atual.length % CORES.length],
        avaliacoes,
      },
    ]);
    setNome("");
    setCodigo("");
    setLinhas([
      { nome: "P1", peso: "" },
      { nome: "P2", peso: "" },
    ]);
  }

  function importarPesos() {
    const novas = lerPesos(textoPesos, disciplinas.length);
    if (novas.length === 0) {
      alert("Não consegui ler. Copie a aba PESOS a partir da célula A1.");
      return;
    }
    setDisciplinas((atual) => [
      ...atual.filter((d) => !d.codigo || !novas.some((n) => n.codigo === d.codigo)),
      ...novas,
    ]);
    setTextoPesos("");
    alert(`${novas.length} disciplina(s) importada(s). Agora importe as notas.`);
  }

  function importarNotas() {
    if (disciplinas.length === 0) {
      alert("Importe os pesos primeiro, para as disciplinas existirem.");
      return;
    }
    const { copia, lancadas, problemas } = aplicarNotas(textoNotas, disciplinas, zeroEhVazio);
    setDisciplinas(copia);
    setTextoNotas("");
    let aviso = `${lancadas} nota(s) lançada(s).`;
    if (problemas.length > 0) aviso += `\n\nNão encontrei:\n- ${problemas.join("\n- ")}`;
    alert(aviso);
  }

  function atualizarAvaliacao(discId: string, avId: string, mudanca: Partial<Avaliacao>) {
    setDisciplinas((atual) =>
      atual.map((d) =>
        d.id !== discId
          ? d
          : { ...d, avaliacoes: d.avaliacoes.map((a) => (a.id === avId ? { ...a, ...mudanca } : a)) }
      )
    );
  }

  function renomear(id: string, novoNome: string) {
    const limpo = novoNome.trim();
    if (!limpo) return;
    setDisciplinas((atual) => atual.map((d) => (d.id === id ? { ...d, nome: limpo } : d)));
  }

  function removerDisciplina(id: string) {
    if (!confirm("Apagar esta disciplina e todas as notas dela?")) return;
    setDisciplinas((atual) => atual.filter((d) => d.id !== id));
  }

  function apagarTodas() {
    if (!confirm("Apagar TODAS as disciplinas e notas?")) return;
    setDisciplinas([]);
  }

  const proximas = disciplinas
    .flatMap((d) => d.avaliacoes.map((a) => ({ ...a, disciplina: d })))
    .filter((a) => a.data !== "" && a.nota === null)
    .sort((a, b) => a.data.localeCompare(b.data));

  return (
    <main className="min-h-screen bg-[#F7F3EC] text-[#202020]">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Link href="/" className="text-sm font-medium text-[#82132D]">
          ← Nu Digital
        </Link>

        <div className="mt-6 flex items-center gap-4">
          <span className="text-4xl text-[#82132D]">◈</span>
          <div>
            <h1 className="text-4xl font-black tracking-tight">Nu Campus</h1>
            <p className="text-zinc-600">Provas, entregas e quanto falta para passar.</p>
          </div>
        </div>

        {/* PRÓXIMAS */}
        <section className="mt-12">
          <h2 className="mb-5 text-2xl font-bold tracking-tight">Próximas provas e entregas</h2>

          {carregado && proximas.length === 0 && (
            <p className="rounded-3xl bg-[#EDE5D9] p-6 text-zinc-600">
              Nada com data marcada. Coloque as datas nos quadradinhos de cada disciplina, lá embaixo.
            </p>
          )}

          <ul className="flex flex-col gap-3">
            {proximas.map((a) => {
              const dias = diasAte(a.data);
              return (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5"
                  style={{ backgroundColor: a.disciplina.cor }}
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#82132D]">
                      {a.disciplina.codigo}
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      {a.nome} · {a.disciplina.nome}
                    </p>
                    <p className="text-sm text-zinc-600">
                      {formatarData(a.data)} · peso {formatarPeso(a.peso)}
                    </p>
                  </div>
                  <span className={`rounded-full px-4 py-2 text-sm font-semibold ${corPrazo(dias)}`}>
                    {textoPrazo(dias)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* CADASTRO E IMPORTAÇÃO */}
        <section className="mt-12 grid gap-5 md:grid-cols-2">
          {/* Importar pesos */}
          <div className="rounded-3xl bg-white/60 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#82132D]">Passo 1</p>
            <h3 className="mt-1 text-lg font-bold">Importar pesos</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Copie a aba de pesos a partir da célula A1: nomes na primeira linha, códigos na segunda e
              as avaliações embaixo.
            </p>
            <textarea
              className={`${campo} mt-4 h-40 font-mono text-sm`}
              placeholder="Cole aqui a aba PESOS"
              value={textoPesos}
              onChange={(e) => setTextoPesos(e.target.value)}
            />
            <button className={`${botao} mt-3 w-full`} onClick={importarPesos}>
              Importar pesos
            </button>
          </div>

          {/* Importar notas */}
          <div className="rounded-3xl bg-white/60 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#82132D]">Passo 2</p>
            <h3 className="mt-1 text-lg font-bold">Importar notas</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              Copie a aba de notas a partir da célula A1: códigos das disciplinas na primeira linha e as
              avaliações embaixo, com os mesmos nomes da aba de pesos.
            </p>
            <textarea
              className={`${campo} mt-4 h-40 font-mono text-sm`}
              placeholder="Cole aqui a aba NOTAS"
              value={textoNotas}
              onChange={(e) => setTextoNotas(e.target.value)}
            />
            <label className="mt-3 flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#82132D]"
                checked={zeroEhVazio}
                onChange={(e) => setZeroEhVazio(e.target.checked)}
              />
              Na minha planilha, 0 significa &quot;ainda não teve&quot;
            </label>
            <button className={`${botao} mt-3 w-full`} onClick={importarNotas}>
              Importar notas
            </button>
          </div>

          {/* Manual */}
          <div className="rounded-3xl bg-white/60 p-6 md:col-span-2">
            <h3 className="text-lg font-bold">Ou cadastre uma disciplina à mão</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <input
                className={campo}
                placeholder="Nome (ex.: Física Geral III)"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <input
                className={campo}
                placeholder="Código (ex.: F328)"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
              <input
                className={campo}
                placeholder="Média para passar"
                inputMode="decimal"
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
              />
            </div>

            <p className="mt-4 text-sm font-semibold">Avaliações e pesos</p>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {linhas.map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={campoPequeno}
                    placeholder="Nome (P1, R1...)"
                    value={l.nome}
                    onChange={(e) => mudarLinha(i, "nome", e.target.value)}
                  />
                  <input
                    className={`${campoPequeno} w-28`}
                    placeholder="Peso"
                    inputMode="decimal"
                    value={l.peso}
                    onChange={(e) => mudarLinha(i, "peso", e.target.value)}
                  />
                  <button
                    onClick={() => removerLinha(i)}
                    className="px-2 text-zinc-400 hover:text-[#82132D]"
                    aria-label="Remover linha"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <button onClick={adicionarLinha} className={botaoSecundario}>
                + Avaliação
              </button>
              <span
                className={`text-sm font-semibold ${somaFechaEmUm ? "text-[#777D46]" : "text-[#82132D]"}`}
              >
                Soma dos pesos: {formatarPeso(somaPesos)}
                {somaFechaEmUm ? " (fecha em 1)" : ""}
              </span>
              <button className={botao} onClick={salvarDisciplina}>
                Salvar disciplina
              </button>
            </div>
          </div>
        </section>

        {/* DISCIPLINAS */}
        <section className="mt-12 pb-16">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold tracking-tight">Minhas disciplinas</h2>
            {disciplinas.length > 0 && (
              <button onClick={apagarTodas} className="text-sm text-zinc-500 hover:text-[#82132D]">
                Apagar todas
              </button>
            )}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {disciplinas.map((d) => {
              const s = situacao(d);

              let mensagem = "Lance as notas nos quadradinhos para calcular.";
              if (s.mediaFinal !== null) {
                mensagem =
                  s.mediaFinal >= d.meta
                    ? `Média final ${formatar(s.mediaFinal)}: meta atingida.`
                    : `Média final ${formatar(s.mediaFinal)}: abaixo da meta.`;
              } else if (s.precisa !== null && s.mediaParcial !== null) {
                if (s.precisa <= 0) {
                  mensagem = "Meta já garantida, mesmo tirando 0 no que falta.";
                } else if (s.precisa > 10) {
                  mensagem = `Só com o que falta não dá para chegar em ${formatar(d.meta)}. Vale ver exame.`;
                } else {
                  mensagem = `Você precisa de média ${formatar(s.precisa)} no que falta.`;
                }
              }

              return (
                <div key={d.id} className="rounded-3xl p-6" style={{ backgroundColor: d.cor }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      {d.codigo && (
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#82132D]">
                          {d.codigo}
                        </p>
                      )}
                      <input
                        key={`${d.id}-${d.nome}`}
                        defaultValue={d.nome}
                        onBlur={(e) => renomear(d.id, e.target.value)}
                        aria-label="Nome da disciplina"
                        title="Clique para editar o nome"
                        className="w-full rounded-lg bg-transparent text-xl font-bold outline-none focus:bg-white/70 focus:px-2"
                      />
                      <p className="text-sm text-zinc-600">
                        Meta {formatar(d.meta)}
                        {s.mediaParcial !== null && ` · Parcial ${formatar(s.mediaParcial)}`}
                      </p>
                    </div>
                    <button
                      onClick={() => removerDisciplina(d.id)}
                      className="text-sm text-zinc-500 hover:text-[#82132D]"
                    >
                      Apagar
                    </button>
                  </div>

                  <p className="mt-4 rounded-2xl bg-white/70 p-4 font-semibold">{mensagem}</p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {d.avaliacoes.map((a) => (
                      <div key={a.id} className="rounded-2xl bg-white/60 p-3">
                        <p className="text-sm font-bold">
                          {a.nome}{" "}
                          <span className="font-normal text-zinc-500">· peso {formatarPeso(a.peso)}</span>
                        </p>
                        <input
                          key={`${a.id}-${a.nota}`}
                          className={`${campoPequeno} mt-2 text-center`}
                          placeholder="nota"
                          inputMode="decimal"
                          defaultValue={a.nota === null ? "" : String(a.nota).replace(".", ",")}
                          onBlur={(e) =>
                            atualizarAvaliacao(d.id, a.id, { nota: paraNumero(e.target.value) })
                          }
                        />
                        <input
                          className={`${campoPequeno} mt-2`}
                          type="date"
                          value={a.data}
                          onChange={(e) => atualizarAvaliacao(d.id, a.id, { data: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
