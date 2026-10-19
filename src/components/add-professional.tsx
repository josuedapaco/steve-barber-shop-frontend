"use client";
import { notifyTeamUpdated } from "../lib/team-updates";
import { useState } from "react";
import { services } from "../lib/barber";
import type { TeamMember } from "../lib/staff-services";
import { useLanguage } from "./language";
export default function AddProfessional({ onCreated }: { onCreated: (team: TeamMember[]) => void }) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [accessCode, setAccessCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  async function create(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/staff/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, serviceIds, accessCode }) });
      const result = await response.json() as { team: TeamMember[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Could not add this professional.");
      onCreated(result.team);
      setName(""); setAccessCode(""); setServiceIds([]);
      setMessage("Professional added. Their profile is now available for authorized services and staff sign-in.");
      notifyTeamUpdated();
    } catch (error) { setError(error instanceof Error ? error.message : "Could not add this professional."); }
    finally { setBusy(false); }
  }
  return <details className="add-professional"><summary>{t("+ Add professional")}</summary>
    <form onSubmit={create}><fieldset disabled={busy}><legend>{t("New professional")}</legend>
      <p className="manager-note">{t("Choose any activities this professional can perform. Share their personal access code so they can open their own schedule.")}</p>
      <div className="new-person-fields">
        <label>{t("Full name")}<input value={name} onChange={event => setName(event.target.value)} required minLength={2} maxLength={80} autoComplete="off" /></label>
        <label>{t("Personal access code")}<input type="password" value={accessCode} onChange={event => setAccessCode(event.target.value)} required minLength={8} maxLength={64} autoComplete="new-password" /><small>{t("8–64 characters. The code is saved securely and is not shown again.")}</small></label>
      </div>
      <p className="field-label">{t("Authorized services")}</p>
      <div className="new-person-services">{services.map(service => <label key={service.id} className="team-service"><input type="checkbox" checked={serviceIds.includes(service.id)} onChange={event => setServiceIds(ids => event.target.checked ? [...ids, service.id] : ids.filter(id => id !== service.id))} /><span>{t(service.name)}</span></label>)}</div>
      {!serviceIds.length && <p className="manager-note">{t("No services enabled: this professional will not receive new reservations.")}</p>}
      <button type="submit" className="submit-button">{busy ? t("Adding professional…") : t("Create professional")}</button>
    </fieldset></form>
    {error && <p className="form-error" role="alert">{t(error)}</p>}{message && <p className="team-success" role="status">{t(message)}</p>}
  </details>;
}
