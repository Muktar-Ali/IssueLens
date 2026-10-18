# IssueLens

IssueLens is an AI-assisted GitHub issue triage dashboard. The planned MVP will classify issues, identify missing debugging information, find potential duplicates, inspect relevant repository code, and draft evidence-backed reproduction steps.

## Current status

The project foundation is initialized with TypeScript, React, Vinext/Next-compatible routing, Tailwind CSS, and a local Git repository on the `main` branch. GitHub API and AI integrations have not been enabled yet.

## Requirements

- Node.js 22.13 or newer
- Git
- A GitHub account

## Local setup

```bash
npm install
npm run dev
```

The development server normally opens at `http://localhost:5173`.

## Connect this repository to GitHub

Create an empty repository on GitHub without a generated README, license, or `.gitignore`. Then run:

```bash
git add .
git commit -m "Initialize IssueLens project"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPOSITORY` with the repository you create.

## Environment configuration

Copy `.env.example` to `.env.local` before API integration work:

```bash
cp .env.example .env.local
```

Never commit `.env.local` or real credentials. The starter ignores local environment files.

## Planned MVP

- GitHub issue URL input
- Issue classification and suggested labels
- Missing-information checklist
- Potential duplicate ranking
- Bounded, read-only repository code search
- Evidence with file and line references
- Draft reproduction steps, suspected fix, and test
- Human approval before any GitHub write action

## Commands

```bash
npm run dev
npm run build
npm run lint
```
