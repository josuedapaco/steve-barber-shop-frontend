"use client";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { useLanguage, LanguageToggle } from "../../components/language";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "../../components/link";
import { useTeam } from "../../components/use-team";
import { services } from "../../lib/barber";
import TeamServices from "../../components/team-services";
import ManagerOverview from "../../components/manager-dashboard";
import type { StaffSession } from "../../lib/staff-auth";
type Appointment = { id: string; barberId: string; serviceId: string; date: string; time: string; customerName: string; customerEmail: string; customerPhone: string; notes: string; status: string };
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
export default function Staff() {
  const { t, language } = useLanguage();
  const barbers = useTeam();
  const confirmationRef = useRef<HTMLDialogElement>(null);
  const [pendingChange, setPendingChange] = useState<{ id: string; status: string } | null>(null);
  useEffect(() => { if (pendingChange) confirmationRef.current?.showModal(); }, [pendingChange]);
  const [managerView, setManagerView] = useState<"charts" | "clients" | "schedule" | "team">("charts");
  const [date, setDate] = useState(today), [barber, setBarber] = useState("all");
  const [accountType, setAccountType] = useState<"manager" | "barber">("manager"), [loginBarber, setLoginBarber] = useState("marco");
  const [rows, setRows] = useState<Appointment[]>([]), [pin, setPin] = useState("");
  const [session, setSession] = useState<StaffSession | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const load = useCallback(async (d: string, barberFilter = "all") => {
    if (!d) return;
    try {
      const params = new URLSearchParams({ date: d });
      if (barberFilter !== "all") params.set("barber", barberFilter);
      const r = await fetch(`/api/appointments?${params}`, { cache: "no-store" });
      if (r.status === 401) { setAuthorized(false); setSession(null); setRows([]); return; }
      const data = await r.json() as { error?: string; appointments?: Appointment[]; session?: StaffSession };
      if (!r.ok) throw new Error(data.error || "Appointments are temporarily unavailable.");
      setRows(data.appointments || []); setSession(data.session || null); setAuthorized(true); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load appointments."); }
  }, []);
  useEffect(() => {
    const timeout = window.setTimeout(() => { void load(today()); }, 0);
    return () => window.clearTimeout(timeout);
  }, [load]);
  useEffect(() => { if (authorized && date) { const id = setInterval(() => load(date, barber), 30000); return () => clearInterval(id); } }, [authorized, barber, date, load]);
  async function login(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try { const r = await fetch("/api/staff/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin, ...(accountType === "barber" ? { barberId: loginBarber } : {}) }) });
      const data = await r.json() as { error?: string; session?: StaffSession }; if (!r.ok || !data.session) throw new Error(data.error || "Could not sign in.");
      setPin(""); setManagerView("charts"); setSession(data.session); setAuthorized(true); await load(date || today());
    } catch (e) { setError(e instanceof Error ? e.message : "Could not sign in."); } finally { setBusy(false); }
  }
  async function update(id: string, status: string) {
    setBusy(true); setError("");
    try { const r = await fetch("/api/staff/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) }); const data = await r.json() as { error?: string }; if (!r.ok) throw new Error(data.error); await load(date, barber); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not update appointment."); } finally { setBusy(false); }
  }
  async function logout() { await fetch("/api/staff/logout", { method: "POST" }); setAuthorized(false); setSession(null); setRows([]); }
  const visible = session?.role === "barber" ? rows.filter(row => row.barberId === session.barberId) : rows;
  const confirmed = visible.filter(row => row.status === "confirmed").length;
  const completed = visible.filter(row => row.status === "completed").length;
  const bookedValue = visible.reduce((total, row) => row.status === "cancelled" ? total : total + (services.find(service => service.id === row.serviceId)?.price || 0), 0);
  const barberName = barbers.find(item => item.id === session?.barberId)?.name;
  function dismissConfirmation() { confirmationRef.current?.close(); setPendingChange(null); }
  const pendingAppointment = rows.find(row => row.id === pendingChange?.id);
  return <main className="staff-page"><dialog ref={confirmationRef} className="staff-confirmation" onCancel={event => { event.preventDefault(); dismissConfirmation(); }} aria-labelledby="confirmation-title">
    <h2 id="confirmation-title">{t("Confirm appointment change")}</h2><p>{t("You are about to mark this appointment as")} <strong>{t(pendingChange?.status === "completed" ? "Completed" : "Cancelled")}</strong>.</p>
    <p>{pendingAppointment?.customerName} · {pendingAppointment?.time}</p><div><button type="button" onClick={dismissConfirmation}>{t("Keep current status")}</button><button type="button" onClick={() => { if (!pendingChange) return; const change = pendingChange; dismissConfirmation(); void update(change.id, change.status); }}>{t("Confirm change")}</button></div>
  </dialog><header className="staff-header"><Link className="brand" href="/"><span className="brand-mark">A<span>✦</span></span><span>ATELIER<small>{t("BARBER \u00b7 NEW YORK")}</small></span></Link><LanguageToggle /><Link href="/">{t("← BACK TO SITE")}</Link></header>
    <div className="staff-container"><p className="eyebrow">ATELIER · {session?.role === "manager" ? t("MANAGEMENT") : session?.role === "barber" ? t("BARBER DESK") : t("STAFF")}</p><h1>{session?.role === "barber" ? <>{t("YOUR")} <em>{t("CHAIR.")}</em></> : session?.role === "manager" ? <>{t("MANAGER")} <em>{t("DESK.")}</em></> : <>{t("THE")} <em>{t("APPOINTMENTS.")}</em></>}</h1>
    {authorized === null ? <p className="staff-loading">{t("Loading schedule…")}</p> : !authorized || !session ? <div className="login-card"><p className="eyebrow">{t("PRIVATE ACCESS")}</p><h2>{t("Welcome back.")}</h2><p>{t("Sign in to manage the Atelier schedule.")}</p><form onSubmit={login}><label>{t("Access level")}<select value={accountType} onChange={e => setAccountType(e.target.value as "manager" | "barber")}><option value="manager">{t("Manager")}</option><option value="barber">{t("Barber")}</option></select></label>{accountType === "barber" && <label>{t("Your profile")}<select value={loginBarber} onChange={e => setLoginBarber(e.target.value)}>{barbers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}<label>{t("Access code")}<input type="password" value={pin} onChange={e => setPin(e.target.value)} required autoComplete="current-password" /></label><button disabled={busy} className="submit-button">{busy ? t("SIGNING IN") : t("OPEN YOUR DESK")}<span aria-hidden="true"><ArrowUpRight size={22} strokeWidth={1.6} /></span></button></form>{error && <p className="form-error" role="alert">{t(error)}</p>}</div> : <>
      <div className="staff-welcome"><div><span>{session.role === "manager" ? t("MANAGER VIEW") : t("PERSONAL SCHEDULE")}</span><strong>{session.role === "manager" ? t("All barbers, one clear view.") : barberName}</strong></div><button onClick={logout}>{t("Sign out")}<span aria-hidden="true"><ArrowUpRight size={22} strokeWidth={1.6} /></span></button></div>
      {session.role === "manager" && <div className="manager-navigation"><span>{managerView === "charts" ? t("Gráficas") : managerView === "clients" ? t("Clientes") : managerView === "team" ? t("Team & services") : t("Agenda")}</span><details className="manager-section-menu" onKeyDown={event => { if (event.key === "Escape") { event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); } }}><summary>{t("Secciones")}<span aria-hidden="true"><ChevronDown size={20} strokeWidth={1.6} /></span></summary><nav aria-label="Secciones del manager">{([{ id: "charts", label: t("Gráficas"), detail: t("Ingresos y servicios más solicitados") }, { id: "clients", label: t("Clientes"), detail: t("Historial de visitas y próximas reservas") }, { id: "team", label: t("Team & services"), detail: t("Activities and authorized services") }, { id: "schedule", label: t("Agenda"), detail: t("Consultar y gestionar citas") }] as const).map(option => <button key={option.id} type="button" aria-current={managerView === option.id ? "page" : undefined} onClick={event => { setManagerView(option.id); const menu = event.currentTarget.closest("details"); if (menu) { menu.open = false; menu.querySelector("summary")?.focus(); } }}><strong>{option.label}</strong><small>{option.detail}</small></button>)}</nav></details></div>}
      {error && <p className="form-error" role="alert">{t(error)}</p>}
      {session.role === "manager" && managerView === "schedule" && <div className="staff-metrics"><article><span>{t("APPOINTMENTS")}</span><strong>{visible.length}</strong><small>{t("Selected day")}</small></article><article><span>{t("CONFIRMED")}</span><strong>{confirmed}</strong><small>{t("Ready for the chair")}</small></article><article><span>{t("COMPLETED")}</span><strong>{completed}</strong><small>{language === "es" ? "Valor reservado" : "Booked value"} ${bookedValue}</small></article></div>}
      {session.role === "manager" && (managerView === "charts" || managerView === "clients") && <ManagerOverview refreshKey={rows} view={managerView} />}
      {session.role === "manager" && managerView === "team" && <TeamServices />}
      <div hidden={session.role === "manager" && managerView !== "schedule"}>
      <div className="staff-toolbar" id="daily-schedule"><label>{t("Date")}<input type="date" value={date} onChange={e => { setDate(e.target.value); load(e.target.value, barber); }} /></label>{session.role === "manager" && <label>{t("Barber")}<select value={barber} onChange={e => { setBarber(e.target.value); load(date, e.target.value); }}><option value="all">{t("All barbers")}</option>{barbers.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}<button onClick={() => load(date, barber)}>{t("Refresh schedule")}</button></div>
      <p className="schedule-count">{visible.length} {language === "es" ? "cita" : "appointment"}{visible.length === 1 ? "" : "s"} · {new Date(`${date}T12:00:00Z`).toLocaleDateString(language, { dateStyle: "medium", timeZone: "UTC" })}</p>{error && <p className="form-error" role="alert">{t(error)}</p>}
      {visible.length ? <div className="appointment-list">{visible.map(appointment => <article className="appointment" key={appointment.id}><div className="appointment-time">{appointment.time}<small>{t(appointment.status === "confirmed" ? "Confirmed" : appointment.status === "completed" ? "Completed" : "Cancelled")}</small></div><div className="appointment-main"><h2>{appointment.customerName}</h2><p>{t(services.find(service => service.id === appointment.serviceId)?.name || "")} · {barbers.find(item => item.id === appointment.barberId)?.name}</p><p><a href={`tel:${appointment.customerPhone}`}>{appointment.customerPhone}</a> · <a href={`mailto:${appointment.customerEmail}`}>{appointment.customerEmail}</a></p>{appointment.notes && <p className="appointment-notes">“{appointment.notes}”</p>}</div><div className="appointment-actions">{appointment.status === "confirmed" ? <select aria-label={`${t("Status for")} ${appointment.customerName}`} value={appointment.status} disabled={busy} onChange={e => { if (session.role === "barber") setPendingChange({ id: appointment.id, status: e.target.value }); else void update(appointment.id, e.target.value); }}><option value="confirmed">{t("Confirmed")}</option><option value="completed">{t("Completed")}</option><option value="cancelled">{t("Cancelled")}</option></select> : <span>{t(appointment.status === "confirmed" ? "Confirmed" : appointment.status === "completed" ? "Completed" : "Cancelled")}</span>}</div></article>)}</div> : <div className="empty-schedule"><span>{t("NO APPOINTMENTS")}</span><p>{t("Your schedule is clear for this date.")}</p></div>}
      </div>
    </>}</div></main>;
}
