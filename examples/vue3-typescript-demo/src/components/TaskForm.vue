<script setup lang="ts">
import { ref } from 'vue'
import { useTaskStore } from '../stores/tasks'

const { addTask } = useTaskStore()
const title = ref('')
const error = ref<string | null>(null)

function submit(): void {
  error.value = addTask(title.value)
  if (error.value === null) title.value = ''
}
</script>

<template>
  <form class="task-form" @submit.prevent="submit">
    <label for="new-task">New task</label>
    <div class="row">
      <input id="new-task" v-model="title" type="text" autocomplete="off" placeholder="What needs doing?" />
      <button type="submit">Add</button>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </form>
</template>
