<script setup>
import Home from './views/Home.vue';
import Staff from './views/Staff.vue';
const staff=location.pathname.replace(/\/$/,'')==='/staff';
</script>
<template><Staff v-if="staff"/><Home v-else/></template>
