// REQ-001's acceptance criteria, one test each, against the domain module.
// Runs with Node alone (type stripping, Node 22.6+): npm test.
import test from "node:test";
import assert from "node:assert/strict";
import { approveTask, canStartAgentRun, createTask, startAgentRun } from "../src/domain/approval.ts";

const lead = { name: "dev-lead", role: "lead" };

test("AC-1: a new task waits for approval", () => {
  assert.equal(createTask("t1", "Add a login page", "requester").status, "pending_approval");
});

test("AC-2: an agent run cannot start before approval", () => {
  const task = createTask("t1", "Add a login page", "requester");
  assert.equal(canStartAgentRun(task), false);
  assert.throws(() => startAgentRun(task), /has not been approved/);
});

test("AC-3: only an approver role can approve", () => {
  const task = createTask("t1", "Add a login page", "requester");
  assert.throws(() => approveTask(task, { name: "contractor-a", role: "contractor" }), /not allowed to approve/);
});

test("AC-4: an approved task can start an agent run", () => {
  const approved = approveTask(createTask("t1", "Add a login page", "requester"), lead);
  assert.equal(startAgentRun(approved).status, "running");
});
