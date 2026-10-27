// REQ-001's approval rule, kept out of the Vue components (ADR-0001): a plain
// TypeScript module with no framework or browser imports, so the tests in
// tests/approval.test.ts check it with Node alone.

export type TaskStatus = "pending_approval" | "approved" | "running";

export interface Task {
  id: string;
  title: string;
  requestedBy: string;
  status: TaskStatus;
  approvedBy?: string;
}

export interface Approver {
  name: string;
  role: string;
}

export const APPROVER_ROLES: readonly string[] = ["lead", "maintainer"];

export function createTask(id: string, title: string, requestedBy: string): Task {
  return { id, title, requestedBy, status: "pending_approval" };
}

export function approveTask(task: Task, approver: Approver): Task {
  if (!APPROVER_ROLES.includes(approver.role)) {
    throw new Error(`${approver.name} (${approver.role}) is not allowed to approve tasks`);
  }
  return { ...task, status: "approved", approvedBy: approver.name };
}

export function canStartAgentRun(task: Task): boolean {
  return task.status === "approved" && Boolean(task.approvedBy);
}

export function startAgentRun(task: Task): Task {
  if (!canStartAgentRun(task)) {
    throw new Error(`task ${task.id} has not been approved by an authorized developer`);
  }
  return { ...task, status: "running" };
}
