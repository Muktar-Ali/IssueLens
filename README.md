# IssueLens

IssueLens is an evidence-based GitHub issue triage assistant. It will classify issues, detect missing debugging details, rank potential duplicates, inspect relevant repository code, and draft reproduction steps, fixes, and tests for human review.

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
- PostgreSQL

Install dependencies and create your local environment file:

```bash
npm install
cp .env.example .env.local
```

Then run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Project status

The standard full-stack foundation is ready. GitHub credentials, database provisioning, and the OpenAI-backed analysis workflow are intentionally not configured yet.
