import {
  CheckCircle2,
  GitBranch,
  LockKeyhole,
  SearchCode,
  ShieldCheck,
} from "lucide-react";
import { InvestigationWorkspace } from "./investigation-workspace";

const safeguards = [
  { icon: LockKeyhole, label: "Explicit public allowlist" },
  { icon: GitBranch, label: "Same-repository search only" },
  { icon: ShieldCheck, label: "No files, tools, or write access" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f3f4ef] text-[#172019]">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(23,32,25,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(23,32,25,0.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />

      <div className="relative mx-auto w-full max-w-[1440px] px-5 pb-16 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-[#172019]/10 py-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#172019] text-[#dfff54] shadow-[0_8px_24px_rgba(23,32,25,0.16)]">
              <SearchCode className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold tracking-[-0.02em]">IssueLens</p>
              <p className="text-xs text-[#5f6b61]">Evidence-based issue triage</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-[#237a45]/20 bg-[#e8f5e9] px-3 py-1.5 text-xs font-semibold text-[#176538]">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            Local service ready
          </span>
        </header>

        <section className="grid gap-10 pb-10 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:pb-14 lg:pt-20">
          <div>
            <p className="mb-5 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-[#536158]">
              Triage workspace / v0.1
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              A clearer first pass on every issue.
            </h1>
          </div>

          <div className="lg:pb-1">
            <p className="max-w-2xl text-base leading-7 text-[#536158] sm:text-lg sm:leading-8">
              Submit an issue from an approved public repository. IssueLens classifies the report,
              finds missing context, checks bounded duplicate candidates, and drafts reproduction
              steps for human review.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3">
              {safeguards.map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-2 text-xs font-semibold text-[#344238]">
                  <Icon className="size-3.5 text-[#237a45]" aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        <InvestigationWorkspace />

        <footer className="mt-8 flex flex-col gap-2 border-t border-[#172019]/10 pt-5 text-xs text-[#667168] sm:flex-row sm:items-center sm:justify-between">
          <p>IssueLens never modifies GitHub issues. All recommendations require human review.</p>
          <p className="font-mono uppercase tracking-[0.14em]">Public repositories only</p>
        </footer>
      </div>
    </main>
  );
}
