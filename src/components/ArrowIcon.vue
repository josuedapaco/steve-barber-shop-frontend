<script setup>
defineProps({ direction: { type: String, default: 'up-right' } });
</script>

<template>
  <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <path v-if="direction === 'left'" d="M20 12H4m7-7-7 7 7 7" />
    <path v-else d="M5 19 19 5M5 5h14v14" />
  </svg>
</template>

<style scoped>
.arrow-icon { display: inline-block; width: 1em; height: 1em; flex-shrink: 0; vertical-align: -0.12em; }
</style>
