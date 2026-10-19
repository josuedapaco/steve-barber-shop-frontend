"use client";
import TeamRoster from "../components/team-roster";
import { TEAM_UPDATE_KEY } from "../lib/team-updates";
import type { TeamMember } from "../lib/staff-services";
import { ArrowUpRight } from "lucide-react";
import { useLanguage, LanguageToggle } from "../components/language";
import { useEffect, useRef, useState } from "react";
import Link from "../components/link";
import { services } from "../lib/barber";
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const pretty = (t: string) => { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`; };
export default function Home() {
  const { t, language } = useLanguage();
  const pageRef = useRef<HTMLElement>(null);
  const [activeSection, setActiveSection] = useState("");
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const header = document.querySelector<HTMLElement>(".wire-header");
      const line = (header?.getBoundingClientRect().height || 80) + 100;
      let current = "";
      for (const id of ["experience", "services", "artists", "book"]) {
        if ((document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= line) current = id;
      }
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) current = "book";
      setActiveSection(current);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, []);

  useEffect(() => {
    const root = pageRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || reducedMotion.matches || !("IntersectionObserver" in window)) return;
    const groups = [
      ".wire-hero-photo, .wire-hero-copy, .wire-hero-cta",
      ".wire-experience-copy, .wire-experience-photo, .wire-inset-photo, .wire-experience-description",
      ".wire-title-bars, .wire-service-photo, .wire-service-option",
      ".wire-artists-heading, .wire-barber-option, .wire-wide-cta",
      ".booking-aside, .booking-card",
    ];
    const elements = groups.flatMap(selector => Array.from(root.querySelectorAll<HTMLElement>(selector)));
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("motion-visible");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
    groups.forEach(selector => {
      root.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
        element.style.setProperty("--reveal-delay", `${Math.min(index, 3) * 110}ms`);
        element.classList.add("motion-reveal");
        observer.observe(element);
      });
    });
    const revealFocused = (event: FocusEvent) => {
      if (event.target instanceof Element) event.target.closest(".motion-reveal")?.classList.add("motion-visible");
    };
    const showAll = () => {
      if (reducedMotion.matches) { observer.disconnect(); elements.forEach(element => element.classList.add("motion-visible")); }
    };
    root.addEventListener("focusin", revealFocused);
    reducedMotion.addEventListener("change", showAll);
    return () => {
      observer.disconnect(); root.removeEventListener("focusin", revealFocused);
      reducedMotion.removeEventListener("change", showAll);
      elements.forEach(element => { element.classList.remove("motion-reveal", "motion-visible"); element.style.removeProperty("--reveal-delay"); });
    };
  }, []);
  const [serviceId, setService] = useState("signature"), [preferredBarberId, setBarber] = useState("marco");
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [teamError, setTeamError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    async function refreshTeam() {
      try {
        const response = await fetch("/api/team", { cache: "no-store", signal: controller.signal });
        const data = await response.json() as { error?: string; team: TeamMember[] };
        if (!response.ok) throw new Error(data.error || "Team services are temporarily unavailable.");
        setTeam(data.team); setTeamError("");
      } catch (error) {
        if (!controller.signal.aborted) { setTeam(null); setTeamError(error instanceof Error ? error.message : "Team services are temporarily unavailable."); }
      }
    }
    const onStorage = (event: StorageEvent) => { if (event.key === TEAM_UPDATE_KEY) void refreshTeam(); };
    window.addEventListener("storage", onStorage);
    void refreshTeam();
    window.addEventListener("focus", refreshTeam);
    window.addEventListener("barber-team-updated", refreshTeam);
    const interval = window.setInterval(refreshTeam, 30000);
    return () => { controller.abort(); window.removeEventListener("storage", onStorage); window.removeEventListener("focus", refreshTeam); window.removeEventListener("barber-team-updated", refreshTeam); window.clearInterval(interval); };
  }, []);
  const eligibleBarbers = (team || []).filter(person => person.serviceIds.includes(serviceId));
  const barberId = eligibleBarbers.find(person => person.id === preferredBarberId)?.id || eligibleBarbers[0]?.id || "";
  const [date, setDate] = useState(""), [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]), [loading, setLoading] = useState(false);
  const [error, setError] = useState(""), [success, setSuccess] = useState<{ serviceId: string; barberId: string; date: string; time: string; id: string } | null>(null), [submitting, setSubmitting] = useState(false);
  useEffect(() => { setDate(today()); }, []);
  useEffect(() => {
    if (!date || !barberId) { setTime(""); setSlots([]); setLoading(false); return; }
    let active = true; setTime(""); setLoading(true); setError("");
    fetch(`/api/availability?date=${date}&barber=${barberId}&service=${serviceId}`)
      .then(async r => { const data = await r.json() as { error?: string; slots: string[] }; if (!r.ok) throw new Error(data.error); return data; })
      .then(data => { if (active) setSlots(data.slots); })
      .catch(e => { if (active) { setSlots([]); setError(e.message); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [date, barberId, serviceId, success]);
  const service = services.find(s => s.id === serviceId)!, barber = team?.find(b => b.id === barberId);
  const successMessage = success ? `${t(services.find(item => item.id === success.serviceId)?.name || "")} ${language === "es" ? "con" : "with"} ${team?.find(item => item.id === success.barberId)?.name} ${language === "es" ? "el" : "on"} ${new Date(success.date + "T12:00:00").toLocaleDateString(language === "es" ? "es-US" : "en-US", { month: "long", day: "numeric", year: "numeric" })} ${language === "es" ? "a las" : "at"} ${pretty(success.time)}. ${language === "es" ? "Referencia" : "Booking reference"}: ${success.id.slice(0, 8).toUpperCase()}.` : "";
  async function book(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!time || !barberId || teamError) return;
    setSubmitting(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, barberId, date, time, name: form.get("name"), email: form.get("email"), phone: form.get("phone"), notes: form.get("notes") }) });
      const data = await response.json() as { error?: string; id: string };
      if (!response.ok) throw new Error(data.error);
      setSuccess({ serviceId, barberId, date, time, id: data.id });
      (event.target as HTMLFormElement).reset();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save your booking."); }
    finally { setSubmitting(false); }
  }
  return <main className="wire-site" id="top" ref={pageRef}>
    <header className="wire-header">
      <a href="#top" className="wire-center-logo" aria-label={t("Atelier Barber home")}><span className="wire-emblem">A<span>✦</span></span><span className="header-wordmark">ATELIER<small>{t("BARBER \u00b7 NEW YORK")}</small></span></a>
      <nav className="wire-nav" aria-label={t("Main navigation")}>
        {[{ id: "experience", label: "EXPERIENCE" }, { id: "services", label: "SERVICES" }, { id: "artists", label: "BARBERS" }, { id: "book", label: "BOOK NOW" }].map(item => <a key={item.id} href={`#${item.id}`} className={activeSection === item.id ? "active" : undefined} aria-current={activeSection === item.id ? "location" : undefined}>{t(item.label)}</a>)}
      </nav>
      <LanguageToggle />
    </header>
    <section className="wire-hero" aria-label={t("Atelier Barber New York")}>
      <div className="wire-grid" aria-hidden="true"></div>
      <div className="wire-hero-photo"><img src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=2000&q=85&fit=crop" alt={t("Interior of a barber shop")} /><span>{t("NEW YORK · BY APPOINTMENT")}</span></div>
      <div className="wire-hero-copy wire-white-lines"><span>{t("A BETTER STANDARD")}</span><span>{t("OF GROOMING")}</span><span>{t("IN NEW YORK")}</span></div>
      <a className="wire-hero-cta" href="#book">{t("RESERVE YOUR CHAIR")}<span aria-hidden="true"><ArrowUpRight size={22} strokeWidth={1.6} /></span></a>
    </section>
    <section id="experience" className="wire-experience">
      <div className="wire-experience-upper">
        <div className="wire-experience-copy"><span className="wire-gray-chip">{t("01 / THE PRIVATE RITUAL")}</span><div className="wire-white-lines"><span>{t("A RITUAL,")}</span><span>{t("CUT TO YOU.")}</span><span>{t("NEVER RUSHED.")}</span></div></div>
        <div className="wire-experience-photo"><img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=900&q=85&fit=crop" alt={t("Barber working with precision")} /></div>
      </div>
      <div className="wire-experience-lower"><div className="wire-inset-photo"><img src="https://images.unsplash.com/photo-1593702295094-aea22597af65?w=900&q=85&fit=crop" alt={t("Traditional barber tools")} /></div><div className="wire-experience-description wire-white-lines"><span>{t("A PRIVATE CONSULTATION.")}</span><span>{t("MASTERFUL ATTENTION TO DETAIL.")}</span><span>{t("TIME WELL SPENT.")}</span></div></div>
    </section>
    <section id="services" className="wire-services">
      <div className="wire-title-bars"><h2>{t("GROOMING, ELEVATED")}</h2><p>{t("A HIGHER STANDARD. NEVER RUSHED.")}</p></div>
      <div className="wire-service-main"><div className="wire-service-photo"><img src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1000&q=85&fit=crop" alt={t("Barber shaping a haircut")} /></div><div className="wire-service-copy"><div className="wire-service-options" role="group" aria-label={t("Choose a service")}>{services.map(s => <button type="button" key={s.id} className={serviceId === s.id ? "wire-service-option active" : "wire-service-option"} aria-pressed={serviceId === s.id} onClick={() => setService(s.id)}><span>{t(s.name).toUpperCase()} · ${s.price}</span><small>{s.duration} min · {t(s.detail || "")}</small></button>)}<span className="wire-service-tagline">{t("EXCEPTIONAL BY DESIGN.")}</span></div></div></div>
    </section>
    <section id="artists" className="wire-artists">
      <div className="wire-artists-heading wire-white-lines"><span>{t("MASTER BARBERS")}</span><span>{t("PERSONAL SERVICE.")}</span></div>
      <div className="wire-artists-stage"><TeamRoster team={team} error={teamError} selectedId={barberId} t={t} onSelect={person => {
        if (!person.serviceIds.includes(serviceId)) setService(person.serviceIds[0]);
        setBarber(person.id); setTime("");
      }} /><div className="wire-artist-frame" aria-hidden="true"></div><a href="#book" className="wire-wide-cta">{language === "es" ? "RESERVAR CON" : "BOOK WITH"} {(barber?.name || t("Choose a service")).toUpperCase()} <span aria-hidden="true"><ArrowUpRight size={22} strokeWidth={1.6} /></span></a></div>
    </section>
    <section id="book" className="booking-section"><div className="section-wrap booking-layout"><div className="booking-aside"><p className="eyebrow">{t("YOUR TIME, YOUR CHAIR")}</p><h2>{t("MAKE IT")}<br /><em>{t("YOURS.")}</em></h2><p>{t("A private consultation, a master barber, and an appointment shaped around you.")}</p><div className="booking-rule"></div><p className="booking-detail">{t("NEW YORK CITY")}<br />{t("Open daily · 10 AM – 6:30 PM")}</p></div><div className="booking-card"><div className="booking-card-heading"><span>{t("04 / RESERVATIONS")}</span><h3>{t("Reserve your appointment")}</h3></div>{success ? <div className="confirmation" role="status"><span>{t("✦ BOOKING CONFIRMED")}</span><p>{successMessage}</p><button onClick={() => { setSuccess(null); setTime(""); }}>{t("Make another reservation")}</button></div> : <form onSubmit={book}><p className="booking-selection" aria-live="polite">{t(service.name || "")} · {barber?.name || t("No professional available")}<span>${service.price} · {service.duration} min</span></p>
      <label className="field-label">{t("01 — SELECT A SERVICE")}</label><div className="choice-grid">{services.map(s => <button type="button" key={s.id} className={serviceId === s.id ? "choice selected" : "choice"} aria-pressed={serviceId === s.id} onClick={() => setService(s.id)}><span>{t(s.name || "")}</span><small>${s.price} · {s.duration} min</small></button>)}</div>
      <label className="field-label">{t("02 — CHOOSE YOUR BARBER")}</label><div className="barber-choice">{!team ? <p role="status">{t(teamError || "Loading team…")}</p> : !eligibleBarbers.length && <p role="status">{t("No professional is currently enabled for this service. Choose another service.")}</p>}{eligibleBarbers.map(b => <button type="button" key={b.id} className={barberId === b.id ? "barber-pill selected" : "barber-pill"} aria-pressed={barberId === b.id} onClick={() => setBarber(b.id)}><img src={b.image} alt="" /><span>{b.name}</span></button>)}</div>
      <div className="date-row"><label><span className="field-label">{t("03 — SELECT A DATE")}</span><input aria-label={t("Appointment date")} type="date" required value={date} min={today()} onChange={e => setDate(e.target.value)} /></label></div>
      <span className="field-label">{t("04 — AVAILABLE TIMES · NEW YORK TIME")}</span><div className="time-grid" role="group" aria-label={t("Available times")}>{loading ? <p className="muted">{t("Checking availability…")}</p> : slots.length ? slots.map(t => <button type="button" key={t} className={time === t ? "time selected" : "time"} onClick={() => setTime(t)}>{pretty(t)}</button>) : <p className="muted">{t("No times available for this selection. Try another date or barber.")}</p>}</div>
      <span className="field-label">{t("05 — YOUR DETAILS")}</span><div className="input-grid"><label>{t("Full name")}<input name="name" autoComplete="name" required minLength={2} placeholder={t("Your name")} /></label><label>{t("Phone number")}<input name="phone" type="tel" autoComplete="tel" required placeholder="(212) 555-0123" /></label><label className="full">{t("Email address")}<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label><label className="full">{t("Notes (optional)")}<textarea name="notes" rows={2} maxLength={500} placeholder={t("Anything your barber should know?")} /></label></div>
      {error && <p className="form-error" role="alert">{t(error)}</p>}<button className="submit-button" type="submit" disabled={!time || !barberId || !!teamError || submitting}>{submitting ? (language === "es" ? "GUARDANDO TU RESERVA…" : "SAVING YOUR RESERVATION…") : `${language === "es" ? "CONFIRMAR RESERVA" : "CONFIRM RESERVATION"} · $${service.price}`} <span aria-hidden="true"><ArrowUpRight size={22} strokeWidth={1.6} /></span></button><p className="form-foot">{t("No payment is collected online. Your appointment is reserved immediately.")}</p>
    </form>}</div></div></section>
    <footer><div className="section-wrap footer-inner"><div className="brand footer-brand"><span className="brand-mark">A<span>✦</span></span><span>ATELIER<small>{t("BARBER \u00b7 NEW YORK")}</small></span></div><span>{t("PRECISION IS PERSONAL.")}</span><Link href="/staff">{t("Staff appointments")}</Link></div></footer>
  </main>;
}
