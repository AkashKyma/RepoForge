# RepoForge

RepoForge is a GitHub repository analyzer and MVP recreation platform. In Phase 1, it answers two immediate questions about any public GitHub repository:

1. **What is this technically?** Stack, architecture, feature surface, complexity, and maintenance risk.
2. **What is this commercially?** Market potential, monetization paths, competitor pressure, and expected effort.

The longer-term product direction is bigger: the same system that analyzes a repo today can later generate PRDs, scaffold MVPs, and support deployment workflows. This MVP focuses on **analysis + reports only**.

## What was built for PAP-458

This ticket delivers the first working RepoForge vertical slice:

- **Next.js frontend** for submitting a public GitHub repository URL
- **Analysis status flow** with queued, cloning, analyzing, synthesizing, done, and failed states
- **Repository intake** using GitHub’s API for metadata, language breakdown, tree sampling, and manifest inspection
- **Multi-role report synthesis** that produces:
  - a **Technical Report**
  - a **Commercial Report**
  - an **Executive Summary**
- **Persisted analysis records** stored locally in `data/analyses.json` so reports can be revisited
- **Report UI** for reviewing repository metadata, progress timeline, technical findings, and commercial findings

## The problem RepoForge solves

Most repositories are opaque from the outside. Before investing engineering time, acquisition effort, or product strategy around an existing codebase, you need to know:

- Is the architecture sound or fragile?
- What features exist in code versus what the README claims?
- How hard will this be to maintain or refactor?
- Is there a viable product hidden inside the repo?
- What would it cost to rebuild or productize it as an MVP?

RepoForge automates that initial diligence step instead of making a human manually clone the repository, inspect dependencies, infer features, and draft a commercial assessment from scratch.

## How it works

### User flow

1. Paste a public GitHub repository URL
2. RepoForge validates the URL and creates an analysis job
3. The app fetches repository metadata and prepares a lightweight snapshot from GitHub
4. The analysis pipeline synthesizes technical and commercial findings
5. The UI displays the final report and stores it for later review

### Analysis pipeline

RepoForge is designed around specialized roles rather than one broad “analyze this repo” prompt.

- **Architect** — evaluates architecture style, boundaries, and scalability signals
- **Technical Analyst** — identifies frameworks, dependencies, stack signals, and complexity
- **Product Analyst** — infers feature surfaces and likely use cases
- **Commercial Analyst** — evaluates market potential, monetization, and competitive framing
- **Scribe** — merges the findings into a readable final report

## MVP scope

### Input

- A **public GitHub repository URL**

### Output

#### Technical report
- frontend, backend, data, and infrastructure stack signals
- inferred architecture style
- feature breakdown from repository structure
- dependency and tooling observations
- complexity score
- maintenance and refactor risk

#### Commercial report
- target users
- likely use cases
- market potential
- monetization options
- competitor landscape
- build and maintenance effort estimates
- commercialization opportunities

#### Executive summary
- concise repo summary
- recommendation for MVP recreation or selective rebuild
- top technical risks
- top commercial opportunities

## High-level architecture

- **Frontend:** Next.js App Router UI for submission, status tracking, and report viewing
- **Backend surface:** Next.js route handlers for creating and listing analyses
- **Repository intake:** GitHub API-based metadata fetch, language breakdown, tree sampling, and manifest reads
- **Persistence:** local JSON-backed storage in `data/analyses.json`
- **Report synthesis:** orchestrated technical and commercial analysis merged into a single report experience

## Project structure

```text
app/
  api/analyses/           API endpoints for creating and listing analyses
  analyses/[id]/          Analysis detail page
components/               UI for forms, report sections, status, and metadata
src/lib/                  GitHub intake, analysis orchestration, persistence
src/types/                Shared report and analysis types
data/analyses.json        Persisted analysis records
```

## Setup

### Requirements

- Node.js 22+ recommended
- npm

### Install dependencies

```bash
npm install
```

## Running locally

### Start the development server

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

### Production build

```bash
npm run build
npm run start
```

## How to use RepoForge

1. Start the app
2. Open the homepage
3. Paste a public GitHub repo URL such as `https://github.com/owner/repo`
4. Submit the analysis request
5. Follow the progress timeline while RepoForge processes the repository
6. Review the generated executive, technical, and commercial report sections

## Current implementation notes

- This is **Phase 1 / MVP** only
- Analysis is based on repository metadata, tree structure, dependency manifests, and README excerpts
- Results are persisted locally for revisitability
- The current implementation is designed so deeper analysis layers can be swapped in later

## Roadmap

### Phase 1
- analysis + reports only

### Future phases
- PRD generation
- user stories and implementation planning
- MVP scaffolding and code generation
- deployable output flows
- deeper repository intelligence via AST/vector-backed analysis
- continuous re-analysis on repository changes

## Intended users

- founders evaluating OSS before building on top of it
- agencies or dev shops scoping inherited codebases
- investors doing lightweight technical and commercial diligence
- internal teams deciding whether to fork, buy, or rebuild
- maintainers exploring productization paths

## Success criteria for the product

- accurate stack and architecture inference
- useful commercial insight instead of generic fluff
- actionable report output
- strong handoff into later PRD and MVP-generation phases
- repeat use across multiple repositories
