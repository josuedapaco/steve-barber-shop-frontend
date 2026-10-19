"use client";
import { TEAM_UPDATE_KEY } from "../lib/team-updates";
import { useEffect, useState } from "react";
import type { TeamMember } from "../lib/staff-services";
export function useTeam() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/team", { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json() as { team: TeamMember[] };
        setTeam(data.team);
      } catch { /* Booking and private management views report their own actionable errors. */ }
    }
    const onStorage = (event: StorageEvent) => { if (event.key === TEAM_UPDATE_KEY) void refresh(); };
    addEventListener("storage", onStorage);
    void refresh();
    addEventListener("focus", refresh);
    addEventListener("barber-team-updated", refresh);
    const interval = setInterval(refresh, 30000);
    return () => { controller.abort(); removeEventListener("storage", onStorage); removeEventListener("focus", refresh); removeEventListener("barber-team-updated", refresh); clearInterval(interval); };
  }, []);
  return team;
}
