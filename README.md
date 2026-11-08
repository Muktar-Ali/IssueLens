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

## GitHub App authentication

IssueLens uses a GitHub App installation token when these server-only variables are configured:

```bash
GITHUB_APP_ID=
GITHUB_PRIVATE_KEY_PATH=/absolute/path/to/private-key.pem
```

Keep the private key outside the repository and restrict it to your local user account. An inline
`GITHUB_PRIVATE_KEY` is also supported for hosted environments.

Run `npm run github:sync` after installing the App or changing its repository access. The command
stores installations and repositories in PostgreSQL. IssueLens then matches each submitted repository
to its installation automatically. Repositories without a matching installation fall back to the
optional `GITHUB_TOKEN` and then unauthenticated public access.

## Create an investigation

The first API workflow accepts public issues and private issues accessible to the configured App
installation:

```bash
curl -X POST http://localhost:3000/api/investigations \
  -H "Content-Type: application/json" \
  -d '{"issueUrl":"https://github.com/owner/repository/issues/123"}'
```

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Project status

The full-stack foundation, PostgreSQL persistence, GitHub issue intake, and database-backed GitHub
App installation authentication are ready. The OpenAI-backed analysis workflow is not configured yet.
