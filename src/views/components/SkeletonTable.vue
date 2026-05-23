<script setup>
defineProps({
  rows: { type: Number, default: 5 },
  columns: { type: Number, default: 4 }
})
</script>

<template>
  <div class="w-full max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-secondary-800">
    <table class="w-full min-w-max">
      <thead class="bg-gray-50 dark:bg-secondary-700/50">
        <tr>
          <th v-for="col in columns" :key="'h' + col" class="px-4 py-3.5">
            <div class="skeleton h-3 w-20" :class="{ 'mx-auto': col > 1 }"></div>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
        <tr v-for="row in rows" :key="'r' + row">
          <td v-for="col in columns" :key="'r' + row + 'c' + col" class="px-4 py-4">
            <div class="skeleton h-4" :class="col === 1 ? 'w-24' : 'w-20 mx-auto'"></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
