# How HireIQ's resume tailor works

Job search paperwork is where good candidates stall. Rewriting a resume for every posting is boring, and tracking applications in a spreadsheet is how things get lost.

HireIQ is my answer: tailor with AI, then track every application in one place.

## The pipeline

1. Paste or fetch a job description
2. Match it against a master resume + evidence (including GitHub when it helps)
3. Produce a tailored resume draft with ATS-oriented scoring
4. Export a document you can actually submit
5. Log the application so status does not live in your head

Under the hood: Next.js, TypeScript, Supabase, and Claude for the rewrite/match steps.

## Design choices that matter

- **Master resume as source of truth** — never invent experience; only rephrase and reorder what is real.
- **Tracker next to tailor** — a pretty PDF that never gets submitted is still failure.
- **Evidence over fluff** — pull real projects when the JD asks for skills your bullets underplay.

## Why I'm writing this

Recruiters should see how I think about product, not just that I used an LLM. HireIQ is the tool I use on my own search — dogfooding is the feature.
