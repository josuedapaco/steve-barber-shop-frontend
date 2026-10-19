"use client";
import { notifyTeamUpdated } from "../lib/team-updates";
import { useEffect, useState } from "react";
import { services } from "../lib/barber";
import AddProfessional from "./add-professional";
import type { StaffServices, TeamMember } from "../lib/staff-services";
import { useLanguage } from "./language";
export default function TeamServices() {
  const { t } = useLanguage();
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [saved, setSaved] = useState<TeamMember[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/staff/services", { cache: "no-store", signal: controller.signal }).then(async response => {
      const data = await response.json() as { error?: string; team: TeamMember[] };
      if (!response.ok) throw new Error(data.error || "Team services are temporarily unavailable.");
      setTeam(data.team); setSaved(data.team);
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, []);
  function change(staffId: string, values: Partial<StaffServices>) {
    setMessage("");
    setTeam(rows => rows?.map(row => row.staffId === staffId ? { ...row, ...values } : row) || null);
  }
  async function save(row: StaffServices) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/staff/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(row) });
      const data = await response.json() as { error?: string; team: TeamMember[] };
      if (!response.ok) throw new Error(data.error || "Could not save team services.");
      // Preserve other profiles' unsaved edits.
      setSaved(data.team);
      notifyTeamUpdated();
      setMessage("Services saved. New reservations now use these permissions.");
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save team services."); }
    finally { setBusy(false); }
  }
  return <section className="manager-panel team-services" aria-labelledby="team-title">
    <p className="eyebrow">{t("TEAM & ACTIVITIES")}</p><h2 id="team-title">{t("Who can perform each service")}</h2>
    <p className="manager-note">{t("Select any combination of haircut, beard and complete grooming services for each barber.")}</p>
    <p className="manager-note">{t("Clients can book only the activities enabled here. Existing appointments remain on the agenda; changes apply to new bookings.")}</p>
    {error && <p className="form-error" role="alert">{t(error)}</p>}
    {message && <p className="team-success" role="status">{t(message)}</p>}
    {team && <AddProfessional onCreated={next => {
      setSaved(next);
      setTeam(current => next.map(row => current?.find(existing => existing.staffId === row.staffId) || row));
    }} />}
    {!team ? !error && <p role="status">{t("Loading team…")}</p> : <div className="team-cards">{team.map(row => {
      const person = row;
      const original = saved.find(person => person.staffId === row.staffId);
      const dirty = !original || [...original.serviceIds].sort().join() !== [...row.serviceIds].sort().join();
      return <fieldset key={row.staffId} className="team-card" disabled={busy}><legend>{person.name}</legend>
        <p className="field-label">{t("Authorized services")}</p>
        {services.map(service => <label className="team-service" key={service.id}>
          <input type="checkbox" disabled={busy} checked={row.serviceIds.includes(service.id)} onChange={event => change(row.staffId, { serviceIds: event.target.checked ? [...row.serviceIds, service.id] : row.serviceIds.filter(id => id !== service.id) })} />
          <span>{t(service.name)}</span>
        </label>)}
        {!row.serviceIds.length && <p className="manager-note">{t("No services enabled: this professional will not receive new reservations.")}</p>}
        <button className="submit-button" type="button" disabled={busy || !dirty} onClick={() => void save(row)}>{busy ? t("Saving…") : t("Save services")}</button>
        <small className="team-save-state">{dirty ? t("Unsaved changes") : t("Saved configuration")}</small>
      </fieldset>;
    })}</div>}
  </section>;
}
