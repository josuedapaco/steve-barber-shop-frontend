"use client";
import type { TeamMember } from "../lib/staff-services";
type Props = { team: TeamMember[] | null; error: string; selectedId: string; onSelect: (person: TeamMember) => void; t: (text: string) => string };
export default function TeamRoster({ team, error, selectedId, onSelect, t }: Props) {
  return <div className="wire-artist-roster" role="group" aria-label={t("Our barbers")}>
    {!team ? <p role={error ? "alert" : "status"}>{t(error || "Loading team…")}</p> : team.length === 0 ? <p role="status">{t("Our team will be available soon.")}</p> : team.map(person =>
      <button key={person.id} className={selectedId === person.id ? "wire-barber-option active" : "wire-barber-option"} type="button" aria-pressed={selectedId === person.id} disabled={!person.serviceIds.length} onClick={() => onSelect(person)}>
        <span className="wire-barber-portrait"><img src={person.image} alt={`${t("Portrait of")} ${person.name}`} /></span>
        <strong>{person.name}</strong><small>{t(person.role)}{!person.serviceIds.length && <span className="team-unavailable">{t("Not currently accepting bookings")}</span>}</small>
      </button>
    )}
  </div>;
}
