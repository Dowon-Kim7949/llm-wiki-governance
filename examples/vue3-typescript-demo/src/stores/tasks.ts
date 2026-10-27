import { computed, reactive, readonly } from 'vue'
import type { Task, TaskFilter } from '../types'

// The longest task title the app accepts, counted after trimming.
export const MAX_TITLE_LENGTH = 80

// Mock data so the page is not empty on first load. Nothing is persisted:
// a reload restores these three tasks.
const state = reactive({
  tasks: [
    { id: 1, title: 'Read the project wiki index', done: true },
    { id: 2, title: 'Run llm-wiki validate', done: false },
    { id: 3, title: 'Review the impact report', done: false },
  ] as Task[],
  filter: 'all' as TaskFilter,
})

let nextId = 4

// Returns the message to show the user, or null when the title is acceptable.
export function validateTitle(raw: string): string | null {
  const title = raw.trim()
  if (title.length === 0) return 'Enter a title.'
  if (title.length > MAX_TITLE_LENGTH) return `Keep the title within ${MAX_TITLE_LENGTH} characters.`
  return null
}

// The single entry point components use. State is exposed read-only; every change
// goes through the functions below.
export function useTaskStore() {
  const visibleTasks = computed(() => {
    const matching = state.tasks.filter((task) => {
      if (state.filter === 'active') return !task.done
      if (state.filter === 'done') return task.done
      return true
    })
    // Open tasks first; the sort is stable, so each group keeps its insertion order.
    return [...matching].sort((a, b) => Number(a.done) - Number(b.done))
  })

  const remaining = computed(() => state.tasks.filter((task) => !task.done).length)

  function addTask(raw: string): string | null {
    const error = validateTitle(raw)
    if (error) return error
    state.tasks.push({ id: nextId++, title: raw.trim(), done: false })
    return null
  }

  function toggleTask(id: number): void {
    const task = state.tasks.find((candidate) => candidate.id === id)
    if (task) task.done = !task.done
  }

  function removeTask(id: number): void {
    state.tasks = state.tasks.filter((task) => task.id !== id)
  }

  function setFilter(filter: TaskFilter): void {
    state.filter = filter
  }

  return {
    state: readonly(state),
    visibleTasks,
    remaining,
    addTask,
    toggleTask,
    removeTask,
    setFilter,
  }
}
