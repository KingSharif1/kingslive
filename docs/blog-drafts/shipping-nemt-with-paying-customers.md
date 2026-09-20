# How I shipped NEMT billing with paying customers

I did not start with a pitch deck. I started with a spreadsheet problem.

Non-emergency medical transport operators get broker trip exports and somehow have to turn those rows into accurate driver pay — ambulatory vs wheelchair, mileage tiers, deductions. Doing that by hand is slow and easy to get wrong.

## What I built

A web app that:

1. Ingests Excel/CSV trip exports
2. Applies tiered rates by service type
3. Subtracts deductions
4. Saves history and exports PDF/spreadsheet pay breakdowns
5. Gates access behind Stripe subscriptions

Stack: Next.js, Strapi, Postgres, Stripe.

## What happened

Five companies pay for it in production. Each runs on the order of 50–100 calculations a month, with roughly 80–500 trips per run.

That taught me more about product than any class project: support tickets, rate edge cases, and the difference between "it works on my laptop" and "someone's payroll depends on this."

## Why it matters for hiring

This is the clearest proof I can ship software people pay for — not just demos. If you want someone who has felt the weight of production billing, this is that story.
