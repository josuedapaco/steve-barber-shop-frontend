import { ref, onMounted, onUnmounted } from 'vue';
import { translations } from './translations';
export const language = ref('en');
try { language.value = localStorage.getItem('atelier-language') || 'en'; } catch {}
const english = new Map(Object.entries(translations).map(([en, es]) => [es, en]));
export const t = text => language.value === 'es' ? translations[text] || text : english.get(text) || text;
export function toggleLanguage() { language.value = language.value === 'en' ? 'es' : 'en'; try { localStorage.setItem('atelier-language', language.value); } catch {} }
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone:'America/New_York', year:'numeric',month:'2-digit',day:'2-digit' }).format(new Date());
export async function api(path, body, options={}) {
  const response = await fetch(path, { cache:'no-store', ...options, ...(body === undefined ? {} : { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }) });
  const data = await response.json();
  if (!response.ok) { const error = new Error(data.error || 'Service temporarily unavailable.'); error.status=response.status; throw error; }
  return data;
}
export function notifyTeamUpdated() {
  dispatchEvent(new Event('barber-team-updated'));
  try { localStorage.setItem('atelier-barber-team-updated',crypto.randomUUID()); } catch {}
}
export function useTeam() {
  const team=ref(null),error=ref('');let interval,stopped=false,sequence=0;
  async function refresh() { const current=++sequence;try { const data=await api('/api/team');if(!stopped&&current===sequence){team.value=data.team;error.value='';} }catch(e){if(!stopped&&current===sequence){team.value=null;error.value=e.message;}} }
  const storage=e=>{if(e.key==='atelier-barber-team-updated')refresh();};
  onMounted(()=>{refresh();interval=setInterval(refresh,30000);addEventListener('focus',refresh);addEventListener('barber-team-updated',refresh);addEventListener('storage',storage);});
  onUnmounted(()=>{stopped=true;clearInterval(interval);removeEventListener('focus',refresh);removeEventListener('barber-team-updated',refresh);removeEventListener('storage',storage);});
  return {team,error,refresh};
}
