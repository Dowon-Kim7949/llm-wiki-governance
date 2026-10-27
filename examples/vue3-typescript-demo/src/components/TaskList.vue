<script setup lang="ts">
import type { TaskFilter } from '../types'
import { useTaskStore } from '../stores/tasks'

const { state, visibleTasks, remaining, toggleTask, removeTask, setFilter } = useTaskStore()
const filters: TaskFilter[] = ['all', 'active', 'done']
</script>

<template>
  <section class="task-list">
    <nav class="filters" aria-label="Filter tasks">
      <button
        v-for="filter in filters"
        :key="filter"
        type="button"
        :aria-pressed="state.filter === filter"
        @click="setFilter(filter)"
      >
        {{ filter }}
      </button>
    </nav>

    <ul>
      <li v-for="task in visibleTasks" :key="task.id" :class="{ done: task.done }">
        <label>
          <input type="checkbox" :checked="task.done" @change="toggleTask(task.id)" />
          {{ task.title }}
        </label>
        <button type="button" :aria-label="`Remove ${task.title}`" @click="removeTask(task.id)">×</button>
      </li>
    </ul>

    <p class="remaining">{{ remaining }} open</p>
  </section>
</template>
