<script setup>
import { ref } from 'vue';
import { t } from '../lib/state';
import ArrowIcon from './ArrowIcon.vue';
const chooser = ref(null);
const open = () => chooser.value.showModal();
</script>

<template>
  <div class="location-map">
    <iframe src="https://www.google.com/maps?q=40.6947579,-73.849297&amp;z=17&amp;output=embed" :title="t('Location map')" loading="lazy" referrerpolicy="no-referrer-when-downgrade" tabindex="-1" aria-hidden="true"></iframe>
    <button class="map-open" type="button" aria-haspopup="dialog" @click="open">
      <span>{{ t('Tap the map for directions') }} <ArrowIcon /></span>
    </button>
    <dialog ref="chooser" class="maps-dialog" aria-labelledby="maps-title" @click="event => { if (event.target === chooser) chooser.close(); }">
      <div class="maps-heading"><h2 id="maps-title">{{ t('Choose your maps app') }}</h2><button type="button" class="maps-close" :aria-label="t('Close')" @click="chooser.close()">×</button></div>
      <p>Steve's Barbershop</p>
      <div class="maps-choices">
        <a href="https://maps.app.goo.gl/ahaUnBhazULqv9YEA" target="_blank" rel="noopener noreferrer" @click="chooser.close()">Google Maps <ArrowIcon /></a>
        <a href="https://maps.apple.com/?daddr=40.6947579,-73.849297&amp;q=Steve%27s%20Barbershop" target="_blank" rel="noopener noreferrer" @click="chooser.close()">Apple Maps <ArrowIcon /></a>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.location-map{position:relative;min-width:0}
.location-map iframe{display:block;pointer-events:none}
.map-open{position:absolute;inset:0;width:100%;border:1px solid #b89a665c;border-radius:6px;background:transparent;cursor:pointer;display:flex;align-items:flex-end;justify-content:center;padding:18px}
.map-open span{display:flex;align-items:center;gap:12px;padding:14px 18px;background:#111310ed;border:1px solid #b89a66;color:#eadfc9;border-radius:4px;font:600 14px/1.4 Manrope,Arial,sans-serif}
.map-open:focus-visible{outline:3px solid #d1b982;outline-offset:4px}
.maps-dialog{width:min(440px,calc(100% - 32px));max-height:calc(100svh - 32px);overflow:auto;margin:auto;padding:24px;border:1px solid #b89a66;border-radius:12px;background:#171914;color:#eadfc9;box-shadow:0 20px 80px #0009}
.maps-dialog::backdrop{background:#000a}
.maps-heading{display:flex;gap:16px;align-items:center;justify-content:space-between}
.maps-heading h2{font:500 24px/1.3 'Playfair Display',Georgia,serif;margin:0}
.maps-close{flex-shrink:0;width:44px;height:44px;border:1px solid #b89a6677;border-radius:50%;background:transparent;color:#eadfc9;font-size:28px;cursor:pointer}
.maps-dialog p{font-size:14px;color:#c6aa78}
.maps-choices{display:grid;gap:12px;margin-top:22px}
.maps-choices a{display:flex;align-items:center;justify-content:space-between;min-height:56px;padding:16px;background:#b89a66;color:#151510;border-radius:4px;font-weight:700}
@media(max-width:600px){.map-open{padding:12px}.map-open span{font-size:12px;padding:12px}.maps-dialog{padding:20px}.maps-heading h2{font-size:22px}}
</style>
