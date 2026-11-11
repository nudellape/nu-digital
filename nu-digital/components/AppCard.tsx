
type AppCardProps = {
  name: string;
  description: string;
  icon: string;
  color: string;
};

export default function AppCard({
  name,
  description,
  icon,
  color,
}: AppCardProps) {
  return (
    <article className="group flex min-h-60 flex-col justify-between rounded-3xl border border-black/10 bg-white/70 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div>
        <div
          className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>

        <h3 className="text-2xl font-bold tracking-tight">
          {name}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          {description}
        </p>
      </div>

      <span className="mt-6 text-xs font-semibold uppercase tracking-widest text-[#82132D]">
        Em desenvolvimento
      </span>
    </article>
  );
}
