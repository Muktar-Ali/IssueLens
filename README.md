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

Start PostgreSQL, apply migrations, and run the app:

```bash
npm run db:up
npm run db:migrate
npm run dev
```

To stop the local database:

```bash
npm run db:down
```

Open `http://localhost:3000`.

## Create an investigation

The first API workflow accepts public GitHub issue URLs:

```bash
curl -X POST http://localhost:3000/api/investigations \
  -H "Content-Type: application/json" \
  -d '{"issueUrl":"https://github.com/owner/repository/issues/123"}'
```

Set the optional `GITHUB_TOKEN` environment variable to increase GitHub's API rate limit. Private
repository access will use the GitHub App integration in a later project step.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Project status

The standard full-stack foundation is ready. GitHub credentials, database provisioning, and the OpenAI-backed analysis workflow are intentionally not configured yet.
