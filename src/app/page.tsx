import {
  CheckCircle2,
  GitBranch,
  LockKeyhole,
  LogOut,
  SearchCode,
  ShieldCheck,
} from "lucide-react";
import { getAuthorizedSession } from "@/lib/auth-access";
import { signInWithGitHub, signOutOfIssueLens } from "./auth-actions";
import { InvestigationWorkspace } from "./investigation-workspace";

const safeguards = [
  { icon: LockKeyhole, label: "Explicit public allowlist" },
  { icon: GitBranch, label: "Same-repository search only" },
  { icon: ShieldCheck, label: "No files, tools, or write access" },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getAuthorizedSession();
  if (!session) {
    const { error } = await searchParams;
    return <SignInScreen hasError={Boolean(error)} />;
  }

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

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-[#237a45]/20 bg-[#e8f5e9] px-3 py-1.5 text-xs font-semibold text-[#176538] sm:inline-flex">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              @{session.user.githubLogin}
            </span>
            <form action={signOutOfIssueLens}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border border-[#172019]/15 bg-white px-3 py-2 text-xs font-semibold transition hover:bg-[#eef0e9]"
              >
                <LogOut className="size-3.5" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
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

function SignInScreen({ hasError }: { hasError: boolean }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f3f4ef] px-5 py-12 text-[#172019]">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(23,32,25,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(23,32,25,0.035)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />

      <section className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-[#172019]/10 bg-white shadow-[0_30px_100px_rgba(32,48,37,0.14)]">
        <div className="bg-[#172019] p-7 text-white sm:p-9">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#dfff54] text-[#172019]">
            <SearchCode className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-8 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#dfff54]">
            Protected workspace
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            Sign in to IssueLens.
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/65">
            GitHub verifies your identity. IssueLens then checks your permanent user ID against its
            explicit server allowlist.
          </p>
        </div>

        <div className="p-7 sm:p-9">
          {hasError && (
            <div className="mb-5 rounded-2xl bg-[#fff0ec] p-4 text-sm leading-6 text-[#8e3423]" role="alert">
              This GitHub account is not approved, or sign-in could not be completed. No IssueLens
              data was exposed.
            </div>
          )}

          <form action={signInWithGitHub}>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[#172019] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2c382f]"
            >
              <GitBranch className="size-5" aria-hidden="true" />
              Continue with GitHub
            </button>
          </form>

          <div className="mt-6 grid gap-3 text-xs leading-5 text-[#667168] sm:grid-cols-2">
            <p className="rounded-xl bg-[#f3f4ef] p-3">
              <strong className="block text-[#344238]">Identity only</strong>
              No repository or write scope is requested for login.
            </p>
            <p className="rounded-xl bg-[#f3f4ef] p-3">
              <strong className="block text-[#344238]">Default deny</strong>
              An empty user allowlist permits nobody.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
