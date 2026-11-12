# IssueLens

IssueLens is an evidence-based GitHub issue triage assistant. It classifies issues, detects missing debugging details, ranks bounded same-repository duplicate candidates, and drafts reproduction steps and follow-up questions for human review without downloading repository files.

## Stack

- Next.js App Router and TypeScript
- Tailwind CSS
- GitHub App authentication with Octokit
- PostgreSQL with Drizzle ORM
- OpenAI Responses API with Zod-validated structured output
- Vitest and Playwright

## Local development

Requirements:

- Node.js 22.13 or newer
- Docker Desktop

Install dependencies and create your local environment file:

```bash
npm install
cp .env.example .env.local
```

Start PostgreSQL, apply migrations, sync GitHub access, and run the app:

```bash
npm run db:up
npm run db:migrate
npm run github:sync
npm run dev
```

To stop the local database:

```bash
npm run db:down
```

Open `http://localhost:3000`.

## GitHub App authentication and repository allowlist

IssueLens uses a GitHub App installation token when these server-only variables are configured:

```bash
GITHUB_APP_ID=
GITHUB_PRIVATE_KEY_PATH=/absolute/path/to/private-key.pem
GITHUB_ALLOWED_REPOSITORIES=Muktar-Ali/IssueLens
```

Keep the private key outside the repository and restrict it to your local user account. An inline
`GITHUB_PRIVATE_KEY` is also supported for hosted environments.

Run `npm run github:sync` after installing the App or changing its repository access. The command
stores installations and repositories in PostgreSQL. IssueLens then matches each submitted repository
to its installation automatically. Repositories without a matching installation fall back to the
optional `GITHUB_TOKEN` and then unauthenticated public access.

IssueLens only accepts exact public repositories listed in `GITHUB_ALLOWED_REPOSITORIES`. Separate
multiple repositories with commas. A missing or empty allowlist permits nothing, malformed entries
and wildcards are ignored, and GitHub must confirm that each selected repository is public before
IssueLens fetches an issue or sends content to OpenAI.

## Create an investigation

The first API workflow accepts issue URLs only from explicitly allowed public repositories:

```bash
curl -X POST http://localhost:3000/api/investigations \
  -H "Content-Type: application/json" \
  -d '{"issueUrl":"https://github.com/owner/repository/issues/123"}'
```

## Analysis result contract

`src/lib/issue-analysis-schema.ts` defines the strict result that the OpenAI Responses API will
produce and PostgreSQL will store in `investigations.result`. Every analysis contains:

- Summary, classification, severity, and confidence
- Missing-information checks and follow-up questions
- Suggested labels and ranked duplicate candidates
- Reproduction readiness, prerequisites, and steps
- Probable causes linked to traceable evidence
- Limitations that keep uncertain conclusions explicit

All fields are required for OpenAI Structured Outputs. Unknown individual values use `null`, while
sections with no supported findings use empty arrays.

## Run an analysis

Configure the server-only OpenAI settings in `.env.local`:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.4-mini
```

After creating an investigation, use its returned UUID to start analysis:

```bash
curl -X POST http://localhost:3000/api/investigations/INVESTIGATION_ID/analyze
```

The endpoint claims only `queued` investigations, marks one `running`, sends its stored issue
snapshot and up to five sanitized same-repository duplicate candidates to the OpenAI Responses API,
validates the Structured Output, and stores it in
`investigations.result`. Successful runs become `completed`; API, refusal, incomplete-output, and
validation failures become `failed` with a recorded reason. Responses are requested with
`store: false`.

Repository access is checked again immediately before analysis. Duplicate search never crosses the
selected repository, excludes the current issue and pull requests, redacts common credential formats,
and caps all untrusted text before it reaches the model. The model receives no GitHub credentials or
GitHub tools. If duplicate search is unavailable, the analysis records that limitation instead of
inventing candidates.

IssueLens reads only GitHub API JSON needed for triage: public-repository visibility and issue fields
such as title, body, labels, state, and URL. It does not clone repositories or download source files,
archives, releases, artifacts, attachments, or content linked from an issue. The internal Octokit
client is not exposed to the analysis pipeline; broader repository access requires an intentional
code change and review.

All repository text is treated as untrusted evidence. IssueLens detects common prompt-injection
signals, keeps repository content in the user-input data boundary, gives the model no tools or network
access, and uses a strict Structured Output schema. Instructions inside an issue—such as requests to
ignore rules, download a URL, reveal a key, or impersonate a system message—cannot grant permission or
trigger an action. Model output is advisory JSON for human review and is never executed as code or
interpreted as a command.

This synchronous endpoint is the MVP execution path. A background job queue can replace it later
without changing the analysis contract or database lifecycle.

## Reopen saved investigations

Completed analyses are stored in PostgreSQL and appear in the recent investigations section of the
workspace. Selecting one retrieves the stored report from IssueLens without contacting GitHub or
making another OpenAI request.

The history API exposes a bounded list and an individual completed report:

```bash
curl http://localhost:3000/api/investigations
curl http://localhost:3000/api/investigations/INVESTIGATION_ID
```

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Project status

The full-stack foundation, PostgreSQL persistence, public-repository allowlist, GitHub issue intake,
database-backed GitHub App authentication, structured analysis contract, duplicate candidate search,
OpenAI execution pipeline, analysis dashboard, and saved investigation history are ready. A valid API
key and at least one explicitly allowed public repository are required before making a live analysis
request.
