---
id: adr-004-rename-state-of-us
title: "Renamed to State of Us — Public Pulse and ComWatch retire as working titles"
date: 2026-06-12
status: accepted
tags: [naming, branding, curated, "cat:product"]
linked_features: []
linked_risks: []
---

## Context

The product carried two working titles: "Public Pulse" (in the original 10-document
package) and "ComWatch" (during pipeline staging and design prototyping). With the
design system complete (State of Us v4 prototype: neo-brutalist newspaper — ink/fire/
lime/cream, editorial desks, editions, "the public, counted"), the owner finalized the
name **State of Us** with a wordmark (navy STATE/US, coral OF).

## Decision

- Product name everywhere user-facing: **State of Us**.
- Tracker display_name, overview copy, guidelines, and future UI carry the new name.
- Infra identifiers stay `comwatch` (slug, repo, port registry) — they are hidden
  plumbing; renaming them buys nothing and risks breaking the pipeline's referential
  integrity. Public URL/domain decision tracked separately (owner input pending).
- Logo: wordmark integration planned at Stage 3 masthead build; asset file or in-system
  recreation (Archivo 900, "OF" in fire #FF5A47) pending owner choice.

## Consequences

- The name joins the design system's locked decisions; v5 builds under State of Us.
- Docs referencing ComWatch/Public Pulse remain historically accurate; new artifacts
  use State of Us.
