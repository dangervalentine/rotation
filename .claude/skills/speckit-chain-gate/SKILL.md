---
name: "speckit-chain-gate"
description: "Hook-chain decision point. After /speckit-plan or /speckit-analyze, decide whether open questions need /speckit-clarify, otherwise continue to the next Spec Kit phase automatically."
compatibility: "Requires spec-kit project structure with .specify/ directory"
user-invocable: true
disable-model-invocation: false
---

# Spec Kit chain gate

This skill is invoked by the mandatory `after_plan` and `after_analyze` hooks in `.specify/extensions.yml`. It decides whether the chain pauses for clarification or keeps going. Do not ask the user whether to continue: either route to clarify or invoke the next phase.

## 1. Locate the feature

Run `.specify/scripts/powershell/check-prerequisites.ps1 -Json -PathsOnly` from the repo root once and parse `FEATURE_DIR`, `FEATURE_SPEC`, `IMPL_PLAN` and `TASKS`.

## 2. Work out which phase just finished

- If `tasks.md` does not exist, or it is older than `plan.md` (compare last-write times): **plan just finished**, and the next phase is `/speckit-tasks`.
- Otherwise: **analyze just finished**, and the next phase is `/speckit-implement`.

## 3. Look for questions that would benefit from clarity

Collect open questions from these sources only:

- **After plan**: any `NEEDS CLARIFICATION` text left in `spec.md`, `plan.md` or `research.md`; assumptions recorded in `research.md` or `plan.md` that were guesses about product behaviour (not technical choices the plan can legitimately make); and spec requirements the plan could not map to a concrete design.
- **After analyze**: the analysis report from this conversation. Count findings in the Ambiguity or Underspecification categories, and any CRITICAL finding whose fix depends on a product decision rather than an edit to spec/plan/tasks.

Keep a question only if its answer would materially change scope, data model, UX, or acceptance criteria, and a reasonable default would be risky. Discard style nits, wording issues, and anything the plan or tasks can resolve on their own.

## 4. Route

- **Questions found**: list them briefly under a `## Chain gate: clarification needed` heading, then invoke `/speckit-clarify` with those questions as its argument. The `after_clarify` hook re-runs `/speckit-plan` with the answers, which brings the chain back through this gate.
- **No questions found**: print one line, `Chain gate: no open questions, continuing to <next phase>.`, then invoke the next phase from step 2.

## Loop guard

If `/speckit-clarify` already ran in this conversation for this feature, and the only remaining questions are ones the user declined or answered with "use your judgement", treat them as resolved and continue to the next phase.
