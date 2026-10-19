<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { api, t, language } from '../lib/state';
const props = defineProps({ editable: Boolean });
const current = ref(null), draft = ref(0), dirty = ref(false), busy = ref(false), error = ref(''), saved = ref(false);
const percent = computed(() => current.value?.percentage);
const label = computed(() => percent.value == null ? 'Not updated yet' : percent.value < 34 ? 'Not too busy' : percent.value < 67 ? 'Moderately busy' : 'Very busy');
const guidance = computed(() => percent.value == null ? 'Ask our team about walk-in availability.' : percent.value < 34 ? 'A good time to stop by without an appointment.' : percent.value < 67 ? 'Walk-ins welcome. There may be a short wait.' : 'Expect a wait for walk-ins. Consider booking a time.');
const updated = computed(() => current.value?.updatedAt ? new Intl.DateTimeFormat(language.value === 'es' ? 'es-US' : 'en-US', { timeZone:'America/New_York',month:'short',day:'numeric',hour:'numeric',minute:'2-digit' }).format(new Date(current.value.updatedAt)) : '');
let stopped = false;
function failureMessage(e) {
  if (e.status === 404) return props.editable ? 'Walk-in updates are not enabled yet. Please contact the manager.' : 'Ask our team about walk-in availability.';
  if (e.status === 401) return 'Please sign in again to update walk-in availability.';
  return 'Could not update walk-in availability. Please try again.';
}
async function load() {
  try {
    const data = await api('/api/busyness');
    if (stopped) return;
    current.value = data;
    if (!dirty.value) draft.value = data.percentage ?? 0;
    error.value = '';
  } catch(e) { if (!stopped) error.value = failureMessage(e); }
}
async function save() {
  busy.value = true; error.value = ''; saved.value = false;
  try { current.value = await api('/api/staff/busyness', {percentage:Number(draft.value)}); dirty.value = false; saved.value = true; }
  catch(e) { error.value = failureMessage(e); }
  finally { busy.value = false; }
}
function edit() { dirty.value = true; saved.value = false; }
onMounted(load);
onUnmounted(() => { stopped = true; });
</script>

<template>
  <section class="busyness-panel" :class="{ 'busyness-editor': editable, 'busyness-compact': !editable }" :aria-label="t('Good time for a walk-in?')">
    <div class="busyness-heading"><span>{{t('Good time for a walk-in?')}}</span><strong>{{percent == null ? '—' : percent + '%'}}</strong></div>
    <meter :value="percent ?? 0" min="0" max="100" :aria-label="t('Good time for a walk-in?')" :aria-valuetext="t(label)">{{percent ?? 0}}%</meter>
    <div class="busyness-caption" aria-live="polite"><strong>{{t(label)}}</strong><small>{{t('Reported by our team')}}<template v-if="updated"> · {{updated}} ET</template></small></div>
    <p class="walk-in-guidance">{{t(guidance)}}</p>
    <form v-if="editable"  @submit.prevent="save">
      <label>{{t('Set the current walk-in busyness')}} <output>{{draft}}%</output>
        <input v-model="draft" type="range" min="0" max="100" step="1" :disabled="busy" @input="edit" :aria-label="t('Busyness percentage')">
      </label>
      <div class="busyness-scale"><span>0% · {{t('Not too busy')}}</span><span>100% · {{t('Very busy')}}</span></div>
      <button type="submit" :disabled="busy || !dirty">{{t(busy ? 'Saving…' : 'Accept')}}</button>
      <p v-if="saved" role="status">{{t('Busyness updated on the website.')}}</p>
    </form>
    <p v-if="error && (editable || percent != null)" role="alert">{{t(error)}}</p>
  </section>
</template>

<style scoped>
.busyness-panel{padding:20px max(5%,20px);background:#191c17;color:#eadfc9;border-bottom:1px solid #b89a6659}
.busyness-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:10px;font-size:13px;font-weight:600}
.busyness-heading>span{letter-spacing:.08em;text-transform:uppercase}.busyness-heading>strong{color:#d2b77e}
meter{display:block;width:100%;height:12px;border:0;border-radius:20px;overflow:hidden;background:#40423a;appearance:none}
meter::-webkit-meter-bar{background:#40423a;border:0;border-radius:20px}
meter::-webkit-meter-optimum-value{background:#b89a66;border-radius:20px}
meter::-moz-meter-bar{background:#b89a66;border-radius:20px}
.busyness-caption{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:10px;font-size:14px}
.busyness-caption small{font-size:11px;color:#c0b8a8}
.walk-in-guidance{margin:10px 0 0;color:#d2c4a6}
.busyness-editor{padding:24px;border:1px solid #b89a6677;border-radius:8px;margin:24px 0}
form{margin-top:20px}label{display:block;font-size:14px}output{float:right;font-weight:700}
input[type=range]{display:block;width:100%;min-height:44px;margin:8px 0;padding:0;accent-color:#b89a66;cursor:pointer;touch-action:pan-y}
.busyness-scale{display:flex;justify-content:space-between;gap:20px;font-size:11px;color:#c0b8a8}
button{min-height:48px;margin-top:18px;padding:12px 20px;border:1px solid #b89a66;background:#b89a66;color:#171914;border-radius:4px;font-weight:700;cursor:pointer}
button:disabled{opacity:.5;cursor:default}p{font-size:13px;line-height:1.5}
@media(max-width:600px){.busyness-panel{padding:16px 20px}.busyness-caption{align-items:flex-start;flex-direction:column;gap:5px}.walk-in-guidance{margin:10px 0 0;color:#d2c4a6}
.busyness-editor{padding:18px}.busyness-editor button{width:100%}}

.busyness-compact{padding:16px;background:linear-gradient(145deg,#24271ff5,#141610f5);border:1px solid #b89a6666;border-radius:10px;box-shadow:0 12px 32px #0005}
.busyness-compact .busyness-heading{gap:12px;margin-bottom:10px;align-items:flex-start;font-size:10px;line-height:1.5}
.busyness-compact .busyness-heading>span{max-width:155px;letter-spacing:.05em}
.busyness-compact .busyness-heading>strong{font-size:22px;font-weight:500;line-height:1}
.busyness-compact meter{height:6px}
.busyness-compact .busyness-caption{flex-direction:column;align-items:flex-start;gap:5px;margin-top:10px;font-size:13px}
.busyness-compact .busyness-caption small{font-size:9px;line-height:1.5;color:#ada895}
.busyness-compact .walk-in-guidance{font-size:12px;line-height:1.5;margin:8px 0 0}
.busyness-compact p[role=alert]{font-size:11px}
@media(max-width:600px){.busyness-compact{padding:12px 14px}.busyness-compact .busyness-heading{font-size:9px;gap:8px}.busyness-compact .busyness-heading>strong{font-size:20px}.busyness-compact .busyness-caption{font-size:12px;gap:3px}.busyness-compact .walk-in-guidance{font-size:11px;line-height:1.4}}
</style>
