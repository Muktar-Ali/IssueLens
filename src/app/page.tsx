import { Bot, CheckCircle2, GitBranch, SearchCode, ShieldCheck } from "lucide-react";

const foundations = [
  {
    icon: GitBranch,
    title: "GitHub App",
    description: "Repository-scoped authentication and read-only code access.",
  },
  {
    icon: SearchCode,
    title: "Evidence pipeline",
    description: "Bounded code search with file and line references.",
  },
  {
    icon: Bot,
    title: "Structured AI",
    description: "Schema-validated investigations through the Responses API.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e7efff_0,transparent_34%),#f5f7fb] px-6 py-8 text-slate-950 sm:px-10 lg:px-16">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between border-b border-slate-200/80 pb-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
              <SearchCode className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold tracking-tight">IssueLens</p>
              <p className="text-xs text-slate-500">GitHub issue triage assistant</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            Standard stack ready
          </span>
        </header>

        <section className="grid flex-1 items-center gap-14 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              Evidence before automation
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
              Turn issue reports into actionable engineering work.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Classify bugs, surface missing context, find likely duplicates, inspect relevant code,
              and draft reproduction steps without giving an AI uncontrolled repository access.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-sm font-medium">
              <span className="rounded-lg bg-slate-950 px-4 py-2.5 text-white">Next.js + TypeScript</span>
              <span className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-700">PostgreSQL + Drizzle</span>
              <span className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-700">Octokit + OpenAI</span>
            </div>
          </div>

          <aside className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-[0_24px_80px_rgba(30,64,175,0.11)] backdrop-blur sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold">Foundation initialized</p>
                <p className="text-sm text-slate-500">Credentials are not configured yet.</p>
              </div>
            </div>
            <div className="space-y-4">
              {foundations.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <Icon className="mt-0.5 size-5 shrink-0 text-blue-600" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <footer className="border-t border-slate-200/80 pt-6 text-sm text-slate-500">
          Local foundation only · No GitHub or OpenAI credentials are active
        </footer>
      </div>
    </main>
  );
}
