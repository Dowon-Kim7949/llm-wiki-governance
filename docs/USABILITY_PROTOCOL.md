> Language: [English](./USABILITY_PROTOCOL.md) | [한국어](./USABILITY_PROTOCOL.ko.md)

# Usability protocol: can someone new adopt this from the README?

**Status: ready, not run.** No session has taken place. Until one has, independent
usability is **Unknown** in [VALIDATION.md](./VALIDATION.md). A session run by the
maintainer's own agent, or simulated, does not count.

## Who

- One or two developers who have never used or read about `llm-wiki-governance`.
- Not the maintainer, and not someone who has watched it being built.
- Consent recorded before the session; notes kept without names.

## Setup

- Their own machine, with Node.js 18.18 or later and git. Nothing from this project
  installed before the session.
- They may read only public material: the README, the files it links, `help <command>`.
- The facilitator does not help. The only exception is a step that would touch
  something outside the test project. Each request for help is recorded.
- They think aloud. Time-box: 60 minutes in total.

## Task A — a project with no code yet (about 30 minutes)

In an empty directory:

1. Set up the wiki for a new project.
2. Record one requirement with acceptance criteria. Writing it by hand is fine, as
   is asking an agent if they use one.
3. Approve that plan.
4. Add a small source file and a test that implement it, and link them as evidence.
5. Change the source file, commit, and find out which document needs another look.

## Task B — an existing project (about 25 minutes)

In a small repository they know, or a copy of `examples/python-fastapi-brownfield/app-src`:

1. Set up documentation governance.
2. Find what the wiki says about one area of the code.
3. Make one citation point at something that does not exist, and see what reports it.
4. Change a cited file and find out what needs updating.
5. Resolve one finding.

## Checklist (ask after each task; answer 1–5 plus one sentence)

| # | Question |
| --- | --- |
| 1 | Did you know what each command you ran was for before you ran it? |
| 2 | Was the README enough to start, without other pages? |
| 3 | Was there a setup step you did not expect? |
| 4 | When something failed, did the message tell you what to do next? |
| 5 | Could you tell an approved plan from implemented code? |
| 6 | Did you know which commands only read and which change files? |
| 7 | Did you need anything that is not in the public documentation? |
| 8 | Where were you most confused or slowed down? |

## What to record

- Time per step, and the step where they stopped if they did not finish.
- Each error message, verbatim, and what they did next.
- Each page or `help` topic they opened.
- Every request for help, and what was asked.
- Their checklist answers, unedited.

## Reporting

- Add results to [VALIDATION.md](./VALIDATION.md) under Usability with the date,
  the number of participants, the stack they used, and the findings. Report unfavourable
  results too.
- Each confusion point becomes an issue, or a documented decision not to change.
- Do not summarize as "users found it easy". Report what the participants did.
