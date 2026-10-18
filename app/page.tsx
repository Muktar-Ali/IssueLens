import { CheckCircle2, GitBranch, SearchCode, ShieldCheck } from "lucide-react";

const nextSteps = [
  "Connect this local repository to a new GitHub repository.",
  "Add GitHub authentication and issue URL parsing.",
  "Build the evidence-based triage workflow.",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f7f9] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-slate-950 text-white">
              <SearchCode className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold tracking-tight">IssueLens</p>
              <p className="text-xs text-slate-500">GitHub issue triage assistant</p>
            </div>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
            Foundation ready
          </span>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 shadow-sm">
              <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
              Project initialized
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
              Turn noisy bug reports into actionable evidence.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              IssueLens will classify GitHub issues, flag missing details, find likely duplicates,
              inspect relevant code, and draft reproducible next steps—with a human in control.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white">
                <GitBranch className="size-4" aria-hidden="true" />
                GitHub integration next
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Read-only by default
              </span>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Next milestones
            </p>
            <ol className="mt-6 space-y-5">
              {nextSteps.map((step, index) => (
                <li key={step} className="flex gap-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-6 text-slate-600">{step}</p>
                </li>
              ))}
            </ol>
          </aside>
        </section>

        <footer className="border-t border-slate-200 pt-6 text-sm text-slate-500">
          Local development only · No repository data is transmitted yet
        </footer>
      </div>
    </main>
  );
}
