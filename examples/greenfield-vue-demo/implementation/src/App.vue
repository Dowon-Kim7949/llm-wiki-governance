<script setup lang="ts">
import { ref } from 'vue'
import { approveTask, canStartAgentRun, createTask, startAgentRun, type Task } from './domain/approval.ts'

// The signed-in developer. A real app would take this from its auth layer.
const currentUser = { name: 'dev-lead', role: 'lead' }

const tasks = ref<Task[]>([createTask('t1', 'Add a login page', 'requester')])
const title = ref('')
const error = ref('')

function replace(updated: Task) {
  tasks.value = tasks.value.map((task) => (task.id === updated.id ? updated : task))
}

function add() {
  const trimmed = title.value.trim()
  if (!trimmed) return
  tasks.value = [...tasks.value, createTask(`t${tasks.value.length + 1}`, trimmed, currentUser.name)]
  title.value = ''
}

// The domain module decides; the component only reports its refusal.
function attempt(action: () => Task) {
  try {
    replace(action())
    error.value = ''
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : String(failure)
  }
}
</script>

<template>
  <main>
    <h1>Agent Task Board</h1>
    <form @submit.prevent="add">
      <input v-model="title" placeholder="Describe a task for the agent" />
      <button type="submit">Add task</button>
    </form>
    <p v-if="error" role="alert">{{ error }}</p>
    <ul>
      <li v-for="task in tasks" :key="task.id">
        <strong>{{ task.title }}</strong> — {{ task.status }}
        <button :disabled="task.status !== 'pending_approval'" @click="attempt(() => approveTask(task, currentUser))">Approve</button>
        <button :disabled="!canStartAgentRun(task)" @click="attempt(() => startAgentRun(task))">Start agent run</button>
      </li>
    </ul>
  </main>
</template>
