"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertCircle,
  BadgeCheck,
  Bug,
  Check,
  ChevronRight,
  CircleDashed,
  ClipboardCheck,
  ExternalLink,
  FileQuestion,
  Fingerprint,
  GitCompareArrows,
  History,
  Lightbulb,
  Link2,
  ListChecks,
  LoaderCircle,
  MessageSquareMore,
  RefreshCcw,
  Search,
  ShieldAlert,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { IssueAnalysisResult } from "@/lib/issue-analysis-schema";
import type {
  InvestigationHistoryItem,
  SavedInvestigationDetail,
} from "@/lib/investigation-history";

type Phase = "idle" | "creating" | "analyzing" | "completed" | "error";

type CreatedInvestigation = {
  id: string;
  status: "queued" | "completed";
  repository: { owner: string; name: string };
  issue: {
    number: number;
    title: string;
    url: string;
    state: string;
    author: string | null;
    labels: string[];
    updatedAt: string;
  };
  createdAt: string;
};

type CompletedInvestigation = {
  investigationId: string;
  status: "completed";
  result: IssueAnalysisResult;
  responseId: string;
  model: string;
};

type AnalysisView = Pick<CompletedInvestigation, "result" | "model">;

type ErrorPayload = {
  error?: { message?: string };
};

export function InvestigationWorkspace() {
  const [issueUrl, setIssueUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [investigation, setInvestigation] = useState<CreatedInvestigation | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisView | null>(null);
  const [history, setHistory] = useState<InvestigationHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [openingHistoryId, setOpeningHistoryId] = useState<string | null>(null);

  const isPending = phase === "creating" || phase === "analyzing";

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const response = await requestJson<{ investigations: InvestigationHistoryItem[] }>(
        "/api/investigations",
      );
      setHistory(response.investigations);
    } catch (reason) {
      setHistoryError(reason instanceof Error ? reason.message : "Investigation history is unavailable.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    void requestJson<{ investigations: InvestigationHistoryItem[] }>("/api/investigations")
      .then((response) => {
        if (!active) return;
        setHistory(response.investigations);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setHistoryError(reason instanceof Error ? reason.message : "Investigation history is unavailable.");
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedUrl = issueUrl.trim();
    if (!submittedUrl || isPending) return;

    setError(null);
    setAnalysis(null);
    setInvestigation(null);
    setPhase("creating");

    try {
      const created = await requestJson<{ investigation: CreatedInvestigation }>(
        "/api/investigations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ issueUrl: submittedUrl }),
        },
      );

      setInvestigation(created.investigation);
      setPhase("analyzing");

      const completed = await requestJson<{ investigation: CompletedInvestigation }>(
        `/api/investigations/${created.investigation.id}/analyze`,
        { method: "POST" },
      );

      setAnalysis(completed.investigation);
      setPhase("completed");
      void loadHistory();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "IssueLens could not complete the analysis.");
      setPhase("error");
    }
  }

  function resetWorkspace() {
    setIssueUrl("");
    setPhase("idle");
    setError(null);
    setInvestigation(null);
    setAnalysis(null);
  }

  async function openSavedInvestigation(id: string) {
    if (isPending || openingHistoryId) return;

    setOpeningHistoryId(id);
    setHistoryError(null);

    try {
      const response = await requestJson<{ investigation: SavedInvestigationDetail }>(
        `/api/investigations/${id}`,
      );
      const saved = response.investigation;

      setIssueUrl(saved.issue.url);
      setInvestigation({
        id: saved.id,
        status: saved.status,
        repository: saved.repository,
        issue: saved.issue,
        createdAt: saved.createdAt,
      });
      setAnalysis({ result: saved.result, model: saved.model });
      setError(null);
      setPhase("completed");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (reason) {
      setHistoryError(reason instanceof Error ? reason.message : "The saved investigation could not be opened.");
    } finally {
      setOpeningHistoryId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[28px] border border-[#172019]/10 bg-white shadow-[0_30px_100px_rgba(32,48,37,0.12)]">
        <section className="border-b border-[#172019]/10 bg-[#172019] p-5 text-white sm:p-7 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-[#dfff54]">
              New investigation
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
              Paste an approved issue URL.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/60">
              The repository must be public and explicitly listed in your server allowlist.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label htmlFor="issue-url" className="sr-only">
              GitHub issue URL
            </label>
            <div className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/8 p-2 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <Link2 className="size-4 shrink-0 text-white/45" aria-hidden="true" />
                <input
                  id="issue-url"
                  type="url"
                  required
                  value={issueUrl}
                  onChange={(event) => setIssueUrl(event.target.value)}
                  placeholder="https://github.com/owner/repository/issues/123"
                  autoComplete="url"
                  disabled={isPending}
                  className="h-11 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35 disabled:cursor-not-allowed"
                />
              </div>
              <button
                type="submit"
                disabled={isPending || !issueUrl.trim()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#dfff54] px-5 text-sm font-bold text-[#172019] transition hover:bg-[#e9ff8d] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isPending ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Search className="size-4" aria-hidden="true" />
                )}
                {phase === "creating" ? "Checking issue" : phase === "analyzing" ? "Analyzing" : "Analyze issue"}
              </button>
            </div>
            <p className="flex items-center gap-2 text-xs text-white/45">
              <BadgeCheck className="size-3.5" aria-hidden="true" />
              Public metadata only · No repository files downloaded · No GitHub changes
            </p>
          </form>
        </div>
        </section>

        <div aria-live="polite">
          {phase === "idle" && <IdleState />}
          {(phase === "creating" || phase === "analyzing") && (
            <LoadingState phase={phase} investigation={investigation} />
          )}
          {phase === "error" && error && (
            <ErrorState message={error} onRetry={() => setPhase("idle")} />
          )}
          {phase === "completed" && analysis && investigation && (
            <AnalysisDashboard
              investigation={investigation}
              analysis={analysis}
              onReset={resetWorkspace}
            />
          )}
        </div>
      </div>

      <HistoryPanel
        investigations={history}
        loading={historyLoading}
        error={historyError}
        openingId={openingHistoryId}
        disabled={isPending}
        onOpen={openSavedInvestigation}
        onRefresh={() => void loadHistory()}
      />
    </div>
  );
}

function HistoryPanel({
  investigations,
  loading,
  error,
  openingId,
  disabled,
  onOpen,
  onRefresh,
}: {
  investigations: InvestigationHistoryItem[];
  loading: boolean;
  error: string | null;
  openingId: string | null;
  disabled: boolean;
  onOpen: (id: string) => void;
  onRefresh: () => void;
}) {
  return (
    <section className="rounded-[28px] border border-[#172019]/10 bg-white p-5 shadow-[0_20px_70px_rgba(32,48,37,0.08)] sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#237a45]">
            <History className="size-4" aria-hidden="true" />
            Saved in PostgreSQL
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Recent investigations</h2>
          <p className="mt-2 text-sm leading-6 text-[#667168]">
            Reopen a completed report without contacting GitHub or spending another AI request.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#172019]/15 px-4 py-2.5 text-sm font-semibold transition hover:bg-[#eef0e9] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCcw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#fff0ec] p-4 text-sm text-[#8e3423]" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {loading && investigations.length === 0 ? (
        <div className="mt-5 flex min-h-32 items-center justify-center rounded-2xl bg-[#f5f6f1] text-sm text-[#667168]">
          <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" />
          Loading saved investigations
        </div>
      ) : investigations.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-[#172019]/15 bg-[#fafaf7] p-7 text-center">
          <p className="text-sm font-semibold">No completed investigations yet</p>
          <p className="mt-2 text-xs leading-5 text-[#7a847c]">
            Your first successful analysis will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {investigations.map((item) => {
            const isOpening = openingId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpen(item.id)}
                disabled={disabled || openingId !== null}
                className="group rounded-2xl border border-[#172019]/10 p-4 text-left transition hover:border-[#237a45]/40 hover:bg-[#f8faf5] disabled:cursor-not-allowed disabled:opacity-55"
                aria-label={`Open saved analysis for ${item.issue.title}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[11px] text-[#667168]">
                      {item.repository.owner}/{item.repository.name} #{item.issue.number}
                    </p>
                    <p className="mt-2 line-clamp-2 font-semibold leading-6">{item.issue.title}</p>
                  </div>
                  {isOpening ? (
                    <LoaderCircle className="mt-1 size-4 shrink-0 animate-spin text-[#237a45]" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="mt-1 size-4 shrink-0 text-[#8a938b] transition group-hover:translate-x-0.5 group-hover:text-[#237a45]" aria-hidden="true" />
                  )}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <StatusPill tone="neutral">{humanize(item.classification)}</StatusPill>
                  <StatusPill tone={severityPillTone(item.severity)}>{humanize(item.severity)}</StatusPill>
                  <span className="ml-auto text-xs text-[#8a938b]">{formatHistoryDate(item.completedAt)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function IdleState() {
  return (
    <section className="grid gap-0 lg:grid-cols-3">
      <EmptyFeature
        number="01"
        icon={FileQuestion}
        title="Check report quality"
        description="See which reproduction, environment, version, and log details are present or missing."
      />
      <EmptyFeature
        number="02"
        icon={GitCompareArrows}
        title="Review likely duplicates"
        description="Compare up to five bounded candidates from the same selected repository."
      />
      <EmptyFeature
        number="03"
        icon={ClipboardCheck}
        title="Draft the next action"
        description="Generate evidence-backed reproduction steps and focused follow-up questions."
      />
    </section>
  );
}

function EmptyFeature({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-[#172019]/10 p-6 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0 sm:p-8">
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-xl bg-[#eef0e9] text-[#344238]">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="font-mono text-xs text-[#8a938b]">{number}</span>
      </div>
      <h3 className="mt-8 font-semibold tracking-[-0.02em]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#667168]">{description}</p>
    </div>
  );
}

function LoadingState({
  phase,
  investigation,
}: {
  phase: "creating" | "analyzing";
  investigation: CreatedInvestigation | null;
}) {
  const steps = [
    { label: "Verify allowlist and public visibility", done: phase === "analyzing" },
    { label: "Fetch bounded issue metadata", done: phase === "analyzing" },
    { label: "Search same-repository candidates", done: false },
    { label: "Validate and store structured analysis", done: false },
  ];

  return (
    <section className="grid min-h-[360px] gap-8 p-6 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:p-10">
      <div className="flex flex-col justify-between rounded-2xl bg-[#eef0e9] p-6">
        <LoaderCircle className="size-8 animate-spin text-[#237a45]" aria-hidden="true" />
        <div className="mt-16">
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#667168]">
            {phase === "creating" ? "Stage 1 of 2" : "Stage 2 of 2"}
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
            {phase === "creating" ? "Checking repository boundaries" : "Building the triage report"}
          </h3>
          {investigation && (
            <p className="mt-3 text-sm leading-6 text-[#667168]">
              {investigation.repository.owner}/{investigation.repository.name} #{investigation.issue.number}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col justify-center">
        {steps.map((step, index) => {
          const active = (phase === "creating" && index === 0) || (phase === "analyzing" && index >= 2);
          return (
            <div key={step.label} className="flex gap-4 border-b border-[#172019]/10 py-5 last:border-b-0">
              <span
                className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${
                  step.done
                    ? "bg-[#dff2e3] text-[#176538]"
                    : active
                      ? "bg-[#172019] text-[#dfff54]"
                      : "bg-[#eef0e9] text-[#8a938b]"
                }`}
              >
                {step.done ? <Check className="size-3.5" /> : <CircleDashed className="size-3.5" />}
              </span>
              <div>
                <p className="text-sm font-semibold">{step.label}</p>
                <p className="mt-1 text-xs text-[#7a847c]">
                  {step.done ? "Complete" : active ? "In progress" : "Waiting"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <section className="flex min-h-[320px] flex-col items-center justify-center p-6 text-center sm:p-10">
      <span className="grid size-14 place-items-center rounded-2xl bg-[#fff0ec] text-[#b6472f]">
        <AlertCircle className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-6 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-[#9a3f2d]">
        Investigation stopped
      </p>
      <h3 className="mt-3 max-w-xl text-2xl font-semibold tracking-[-0.03em]">{message}</h3>
      <p className="mt-3 max-w-lg text-sm leading-6 text-[#667168]">
        Check that the repository is public, appears exactly in the allowlist, and the URL points to a GitHub issue.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#172019] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2c382f]"
      >
        <RefreshCcw className="size-4" aria-hidden="true" />
        Try again
      </button>
    </section>
  );
}

function AnalysisDashboard({
  investigation,
  analysis,
  onReset,
}: {
  investigation: CreatedInvestigation;
  analysis: AnalysisView;
  onReset: () => void;
}) {
  const result = analysis.result;

  return (
    <section className="bg-[#f8f8f4] p-4 sm:p-6 lg:p-8">
      <div className="rounded-2xl border border-[#172019]/10 bg-white p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="success">Analysis complete</StatusPill>
              <span className="font-mono text-xs text-[#7a847c]">
                {investigation.repository.owner}/{investigation.repository.name} #{investigation.issue.number}
              </span>
            </div>
            <h2 className="mt-4 max-w-4xl text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
              {investigation.issue.title}
            </h2>
            <a
              href={investigation.issue.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#237a45] hover:underline"
            >
              View original issue
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#172019]/15 px-4 py-2.5 text-sm font-semibold transition hover:bg-[#eef0e9]"
          >
            <RefreshCcw className="size-4" aria-hidden="true" />
            New analysis
          </button>
        </div>

        <p className="mt-6 max-w-5xl border-l-2 border-[#dfff54] pl-4 text-base leading-7 text-[#4f5c52]">
          {result.summary}
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Classification"
          value={humanize(result.classification.category)}
          detail={`${percent(result.classification.confidence)} confidence`}
          icon={Bug}
          tone="dark"
        />
        <MetricCard
          label="Severity"
          value={humanize(result.severity.level)}
          detail={`${percent(result.severity.confidence)} confidence`}
          icon={TriangleAlert}
          tone={severityTone(result.severity.level)}
        />
        <MetricCard
          label="Reproduction"
          value={humanize(result.reproduction.readiness)}
          detail={`${result.reproduction.steps.length} drafted steps`}
          icon={ListChecks}
          tone="light"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard icon={FileQuestion} eyebrow="Report quality" title="Missing information">
          <div className="divide-y divide-[#172019]/10">
            {result.missingInformation.map((item) => (
              <div key={item.category} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{humanize(item.category)}</p>
                  <StatusPill tone={statusTone(item.status)}>{item.status}</StatusPill>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#667168]">{item.explanation}</p>
                {item.followUpQuestion && (
                  <p className="mt-3 flex gap-2 rounded-xl bg-[#f3f4ef] p-3 text-sm leading-6 text-[#3f4c42]">
                    <MessageSquareMore className="mt-1 size-4 shrink-0 text-[#237a45]" aria-hidden="true" />
                    {item.followUpQuestion}
                  </p>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard icon={ClipboardCheck} eyebrow="Suggested workflow" title="Reproduction plan">
          <div className="flex items-center gap-2">
            <StatusPill tone={readinessTone(result.reproduction.readiness)}>
              {result.reproduction.readiness}
            </StatusPill>
            <span className="text-xs text-[#7a847c]">Human review required</span>
          </div>

          {result.reproduction.prerequisites.length > 0 && (
            <div className="mt-5">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7a847c]">
                Prerequisites
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.reproduction.prerequisites.map((item) => (
                  <span key={item} className="rounded-lg bg-[#eef0e9] px-2.5 py-1.5 text-xs font-medium">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          <ol className="mt-6 space-y-3">
            {result.reproduction.steps.map((step, index) => (
              <li key={`${index}-${step}`} className="flex gap-3 text-sm leading-6">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#172019] font-mono text-[10px] text-[#dfff54]">
                  {index + 1}
                </span>
                <span className="text-[#4f5c52]">{step}</span>
              </li>
            ))}
          </ol>

          {(result.reproduction.expectedBehavior || result.reproduction.actualBehavior) && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <BehaviorBlock label="Expected" value={result.reproduction.expectedBehavior} />
              <BehaviorBlock label="Actual" value={result.reproduction.actualBehavior} />
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <SectionCard icon={GitCompareArrows} eyebrow="Same repository only" title="Duplicate candidates">
          {result.duplicateCandidates.length ? (
            <div className="space-y-3">
              {result.duplicateCandidates.map((candidate) => (
                <a
                  key={candidate.issueNumber}
                  href={candidate.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl border border-[#172019]/10 p-4 transition hover:border-[#237a45]/40 hover:bg-[#f8faf5]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-mono text-xs text-[#237a45]">#{candidate.issueNumber}</p>
                      <p className="mt-1 font-semibold">{candidate.title}</p>
                    </div>
                    <StatusPill tone="neutral">{percent(candidate.similarity)}</StatusPill>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#667168]">{candidate.explanation}</p>
                </a>
              ))}
            </div>
          ) : (
            <EmptyResult
              icon={GitCompareArrows}
              title="No supported duplicate candidates"
              description="The bounded same-repository search did not supply a candidate strong enough to return."
            />
          )}
        </SectionCard>

        <SectionCard icon={Lightbulb} eyebrow="Evidence-backed hypotheses" title="Probable causes">
          {result.probableCauses.length ? (
            <div className="space-y-4">
              {result.probableCauses.map((cause) => (
                <div key={cause.title} className="rounded-2xl bg-[#f3f4ef] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-semibold">{cause.title}</p>
                    <span className="font-mono text-xs text-[#667168]">{percent(cause.confidence)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#667168]">{cause.explanation}</p>
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8a938b]">
                    Evidence: {cause.evidenceIds.join(", ") || "none"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyResult
              icon={Lightbulb}
              title="No supported cause yet"
              description="The report does not contain enough evidence for a responsible hypothesis."
            />
          )}
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard icon={Fingerprint} eyebrow="Traceable support" title="Evidence ledger">
          <div className="space-y-3">
            {result.evidence.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[#172019]/10 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#237a45]">{item.id}</span>
                  <span className="text-xs text-[#8a938b]">{humanize(item.source)}</span>
                  <span className="text-xs text-[#8a938b]">·</span>
                  <span className="text-xs text-[#667168]">{item.reference}</span>
                </div>
                {item.excerpt && (
                  <blockquote className="mt-3 border-l-2 border-[#d7ddd5] pl-3 text-sm italic leading-6 text-[#667168]">
                    “{item.excerpt}”
                  </blockquote>
                )}
                <p className="mt-3 text-sm leading-6 text-[#3f4c42]">{item.supports}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard icon={MessageSquareMore} eyebrow="Reporter response" title="Follow-up questions">
            <ul className="space-y-3">
              {result.followUpQuestions.map((question) => (
                <li key={question} className="flex gap-3 text-sm leading-6 text-[#4f5c52]">
                  <ChevronRight className="mt-1 size-4 shrink-0 text-[#237a45]" aria-hidden="true" />
                  {question}
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard icon={ShieldAlert} eyebrow="Do not overstate" title="Limitations">
            <ul className="space-y-3">
              {result.limitations.map((limitation) => (
                <li key={limitation} className="flex gap-3 text-sm leading-6 text-[#667168]">
                  <AlertCircle className="mt-1 size-4 shrink-0 text-[#b26a2f]" aria-hidden="true" />
                  {limitation}
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-[#172019] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">Suggested labels</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {result.suggestedLabels.map((label) => (
              <span key={label} className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold">
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">Model</p>
          <p className="mt-2 text-xs font-semibold text-[#dfff54]">{analysis.model}</p>
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: "dark" | "warning" | "danger" | "light";
}) {
  const styles = {
    dark: "bg-[#172019] text-white",
    warning: "bg-[#fff1cc] text-[#6f491c]",
    danger: "bg-[#ffe2da] text-[#8e3423]",
    light: "bg-white text-[#172019] border border-[#172019]/10",
  }[tone];

  return (
    <div className={`rounded-2xl p-5 ${styles}`}>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] opacity-60">{label}</p>
        <Icon className="size-4 opacity-60" aria-hidden="true" />
      </div>
      <p className="mt-6 text-2xl font-semibold tracking-[-0.035em]">{value}</p>
      <p className="mt-1 text-xs opacity-60">{detail}</p>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  eyebrow,
  title,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-[#172019]/10 bg-white p-5 sm:p-6">
      <div className="mb-6 flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eef0e9] text-[#344238]">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7a847c]">{eyebrow}</p>
          <h3 className="mt-1 text-lg font-semibold tracking-[-0.025em]">{title}</h3>
        </div>
      </div>
      {children}
    </article>
  );
}

function StatusPill({
  tone,
  children,
}: {
  tone: "success" | "warning" | "danger" | "neutral";
  children: ReactNode;
}) {
  const styles = {
    success: "bg-[#e2f4e6] text-[#176538]",
    warning: "bg-[#fff1cc] text-[#80501d]",
    danger: "bg-[#ffe2da] text-[#9a3f2d]",
    neutral: "bg-[#eef0e9] text-[#536158]",
  }[tone];

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${styles}`}>
      {children}
    </span>
  );
}

function BehaviorBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl bg-[#f3f4ef] p-3">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#7a847c]">{label}</p>
      <p className="mt-2 text-xs leading-5 text-[#536158]">{value ?? "Not supplied"}</p>
    </div>
  );
}

function EmptyResult({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#172019]/15 bg-[#fafaf7] p-6 text-center">
      <Icon className="mx-auto size-5 text-[#8a938b]" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#7a847c]">{description}</p>
    </div>
  );
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message = isErrorPayload(payload) ? payload.error?.message : undefined;
    throw new Error(message || "IssueLens could not complete the request.");
  }

  if (!payload) throw new Error("IssueLens returned an empty response.");
  return payload as T;
}

function isErrorPayload(value: unknown): value is ErrorPayload {
  return typeof value === "object" && value !== null && "error" in value;
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatHistoryDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function statusTone(status: "present" | "partial" | "missing") {
  if (status === "present") return "success" as const;
  if (status === "partial") return "warning" as const;
  return "danger" as const;
}

function readinessTone(readiness: "ready" | "partial" | "blocked") {
  if (readiness === "ready") return "success" as const;
  if (readiness === "partial") return "warning" as const;
  return "danger" as const;
}

function severityTone(severity: IssueAnalysisResult["severity"]["level"]) {
  if (severity === "critical" || severity === "high") return "danger" as const;
  if (severity === "medium") return "warning" as const;
  return "light" as const;
}

function severityPillTone(severity: IssueAnalysisResult["severity"]["level"]) {
  if (severity === "critical" || severity === "high") return "danger" as const;
  if (severity === "medium") return "warning" as const;
  return "success" as const;
}
