import AppCard from "../components/AppCard";

// ======= EDITE AQUI SEUS CONTATOS =======
const contatos = {
  email: "seuemail@exemplo.com",
  linkedin: "https://www.linkedin.com/in/seu-perfil",
  github: "https://github.com/emanuellanu",
};
// ========================================

const apps = [
  {
    name: "Nu Campus",
    description: "Organize disciplinas, provas e notas.",
    icon: "◈",
    color: "#F0D7D8",
  },
  {
    name: "Nu Career",
    description: "Acompanhe vagas e candidaturas.",
    icon: "✳",
    color: "#DEE3C5",
  },
  {
    name: "Nu Casa",
    description: "Organize tarefas rotativas e a rotina da casa.",
    icon: "⌂",
    color: "#F8E4AD",
  },
  {
    name: "Nu Agro",
    description: "Explore ferramentas para o universo agrícola.",
    icon: "✿",
    color: "#DFE6D3",
  },
];

const ferramentas = ["Python", "Excel VBA", "AutoCAD", "Next.js", "Inglês C1"];

const destaques = [
  {
    tag: "Excel VBA · Neo Biotecnologia",
    titulo: "Automação financeira",
    texto:
      "Automatizei a emissão de boletos, reduzindo atrasos em cerca de 40%, e diminuí a conciliação bancária diária de 3 horas para cerca de 1 hora.",
    cor: "#F0D7D8",
  },
  {
    tag: "Python",
    titulo: "SmartFarming",
    texto: "Modelo preditivo desenvolvido em Python.",
    cor: "#DFE6D3",
  },
  {
    tag: "Equipe estudantil",
    titulo: "EcoCar UNICAMP",
    texto: "Integro a equipe EcoCar da Unicamp desde 2026.",
    cor: "#F8E4AD",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7F3EC] text-[#202020]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7">
        <div className="flex items-center gap-3">
          <span className="text-3xl text-[#82132D]">✳</span>
          <span className="text-xl font-black tracking-tight">
            NU DIGITAL
          </span>
        </div>

        <nav className="hidden gap-8 text-sm font-medium md:flex">
          <a href="#" className="text-[#82132D]">Início</a>
          <a href="#apps">Aplicativos</a>
          <a href="#sobre">Sobre</a>
        </nav>

        <span className="rounded-full border border-[#82132D]/30 px-4 py-2 text-xs">
          Em desenvolvimento
        </span>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-20 md:grid-cols-2">
        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-[#82132D]">
            Bem-vindo ao Nu Digital
          </p>

          <h1 className="text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
            Um espaço.
            <br />
            <span className="font-serif italic text-[#82132D]">
              Infinitas
            </span>
            <br />
            possibilidades.
          </h1>

          <p className="mt-7 max-w-lg text-lg leading-relaxed text-zinc-600">
            Um ecossistema de aplicativos para simplificar
            sua rotina, organizar projetos e transformar
            ideias em possibilidades.
          </p>

          <a
            href="#apps"
            className="mt-9 inline-flex rounded-full bg-[#82132D] px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#601024]"
          >
            Explorar aplicativos →
          </a>
        </div>

        <div className="relative flex min-h-80 items-center justify-center overflow-hidden rounded-[3rem] bg-[#EDE5D9]">
          <div className="absolute h-64 w-64 rotate-12 rounded-[3rem] bg-[#82132D]" />
          <div className="absolute h-44 w-44 -translate-x-16 translate-y-10 rounded-full bg-[#E8B83F]" />
          <div className="absolute h-28 w-28 translate-x-24 -translate-y-16 rounded-full bg-[#777D46]" />

          <span className="relative z-10 text-[9rem] font-serif text-[#F7F3EC]">
            ✳
          </span>
        </div>
      </section>

      <section id="apps" className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-9 flex items-center gap-5">
          <h2 className="text-3xl font-bold tracking-tight">
            Meus aplicativos
          </h2>
          <div className="h-px flex-1 bg-black/15" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {apps.map((app) => (
            <AppCard key={app.name} {...app} />
          ))}
        </div>
      </section>

      <section id="sobre" className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-9 flex items-center gap-5">
          <h2 className="text-3xl font-bold tracking-tight">Sobre mim</h2>
          <div className="h-px flex-1 bg-black/15" />
        </div>

        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <p className="text-lg leading-relaxed text-zinc-700">
              Sou <strong className="text-[#202020]">Nu Dellape</strong>,
              estudante de Engenharia Agrícola na Unicamp (FEAGRI), com
              formação técnica em Informática pela ETEC. Gosto de usar
              programação para resolver problemas concretos, do escritório
              ao campo.
            </p>

            <p className="mt-5 text-lg leading-relaxed text-zinc-700">
              Busco estágio em engenharia na região de Campinas e Paulínia.
            </p>

            <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-[#82132D]">
              Ferramentas
            </p>
            <div className="flex flex-wrap gap-2">
              {ferramentas.map((f) => (
                <span
                  key={f}
                  className="rounded-full border border-[#82132D]/30 bg-white/60 px-4 py-2 text-sm"
                >
                  {f}
                </span>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href={contatos.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-[#82132D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#601024]"
              >
                LinkedIn
              </a>
              <a
                href={contatos.github}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-[#82132D] px-6 py-3 text-sm font-semibold text-[#82132D] transition hover:bg-[#82132D] hover:text-white"
              >
                GitHub
              </a>
              <a
                href={`mailto:${contatos.email}`}
                className="rounded-full border border-[#82132D] px-6 py-3 text-sm font-semibold text-[#82132D] transition hover:bg-[#82132D] hover:text-white"
              >
                E-mail
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {destaques.map((d) => (
              <div
                key={d.titulo}
                className="rounded-3xl p-6"
                style={{ backgroundColor: d.cor }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#82132D]">
                  {d.tag}
                </p>
                <h3 className="mt-2 text-xl font-bold">{d.titulo}</h3>
                <p className="mt-2 leading-relaxed text-zinc-700">
                  {d.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-black/10 px-6 py-8 text-center text-sm text-zinc-500">
        Nu Dellape · Nu Digital — Tecnologia com personalidade.
      </footer>
    </main>
  );
}