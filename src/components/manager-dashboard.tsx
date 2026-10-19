"use client";
import { useLanguage } from "./language";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTeam } from "./use-team";
import { services } from "../lib/barber";
import type { ManagerDashboard } from "../lib/manager-dashboard";
export default function ManagerOverview({ refreshKey, view }: { refreshKey: unknown; view: "charts" | "clients" }) {
  const { t, language } = useLanguage();
  const barbers = useTeam();
  const money = (value: number) => new Intl.NumberFormat(language === "es" ? "es-US" : "en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
  const dayLabel = (date: string) => new Intl.DateTimeFormat(language, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
  const appointmentLabel = (row: { date: string; time: string }) => `${dayLabel(row.date)} ${row.date.slice(0, 4)} · ${row.time}`;

  const [data, setData] = useState<ManagerDashboard | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/staff/dashboard", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const result = await response.json() as ManagerDashboard & { error?: string };
        if (!response.ok) throw new Error(result.error || "No se pudo cargar el resumen.");
        return result as ManagerDashboard;
      }).then(result => { setData(result); setError(""); })
      .catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [refreshKey]);
  if (error) return <p className="form-error" role="alert">{t(error)}</p>;
  if (!data) return <p role="status">{t("Cargando ingresos e historial…")}</p>;
  return <div className="manager-overview">
    {view === "charts" && <>
    <section className="manager-panel" aria-labelledby="weekly-title">
      <div className="manager-panel-heading"><div><p className="eyebrow">{t("SEMANA ACTUAL · USD")}</p><h2 id="weekly-title">{t("Ingresos planificados")}</h2></div><span>{dayLabel(data.week[0].date)} — {dayLabel(data.week[6].date)}</span></div>
      <p className="manager-note">{t("Reservados: citas pendientes confirmadas. Completados: citas ya realizadas. Montos según el precio actual de cada servicio.")}</p>
      <p className="manager-mobile-hint">{t("Desliza la gráfica para ver los siete días.")}</p>
      <div className="manager-chart-scroll" tabIndex={0} aria-label={t("Desliza para ver toda la semana")}><div className="manager-chart" role="img" aria-label={t("Ingresos diarios reservados, completados y cancelados. Valores disponibles en la tabla debajo.")}>
        <ResponsiveContainer width="100%" height="100%"><BarChart data={data.week} margin={{ top: 15, right: 12, left: 8, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d3cdbc" />
          <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fill: "#55594f", fontSize: 12 }} interval={0} />
          <YAxis tickFormatter={money} width={70} tick={{ fill: "#55594f", fontSize: 12 }} />
          <Tooltip labelFormatter={label => dayLabel(String(label))} formatter={value => money(Number(value))} />
          <Legend />
          <Bar dataKey="reserved" name={t("Reservados")} fill="#b89a66" radius={[3, 3, 0, 0]} />
          <Bar dataKey="completed" name={t("Completados")} fill="#486751" radius={[3, 3, 0, 0]} />
          <Bar dataKey="cancelled" name={t("Cancelados")} fill="#a65448" radius={[3, 3, 0, 0]} />
        </BarChart></ResponsiveContainer>
      </div></div>
      <details><summary>{t("Ver montos por día")}</summary><div className="manager-table-wrap"><table><thead><tr><th>{t("Fecha")}</th><th>{t("Reservados")}</th><th>{t("Completados")}</th><th>{t("Cancelados")}</th></tr></thead><tbody>{data.week.map(day => <tr key={day.date}><th>{dayLabel(day.date)}</th><td>{money(day.reserved)}</td><td>{money(day.completed)}</td><td>{money(day.cancelled)}</td></tr>)}</tbody></table></div></details>
    </section>
    <section className="manager-panel" aria-labelledby="demand-title">
      <div className="manager-panel-heading"><div><p className="eyebrow">{t("PREFERENCIAS DE CLIENTES")}</p><h2 id="demand-title">{t("Servicios más solicitados")}</h2></div><span>{data.totalRequests} {language === "es" ? "reservas" : "bookings"}</span></div>
      <p className="manager-note">{t("Todo el historial · Incluye reservas confirmadas y completadas. Excluye cancelaciones.")}</p>
      {data.totalRequests === 0 ? <p>{t("Aún no hay reservas para comparar servicios.")}</p> : <ol className="service-demand-list">{data.serviceDemand.map((service, index) => {
        const percentage = Math.round(service.count / data.totalRequests * 100);
        return <li key={service.id}><div className="service-demand-heading"><strong>{index + 1}. {t(service.name || "")}</strong><span>{service.count} {language === "es" ? "reservas" : "bookings"} · {percentage}%</span></div>
          <div className="service-demand-track" aria-hidden="true"><span style={{ width: `${percentage}%` }} /></div>
          <p>{service.reserved} {language === "es" ? "reservadas" : "reserved"} · {service.completed} {language === "es" ? "completadas" : "completed"}</p>
        </li>;
      })}</ol>}
    </section>
    </>}
    {view === "clients" && <section className="manager-panel" aria-labelledby="clients-title"><div className="manager-panel-heading"><div><p className="eyebrow">{t("CLIENTES")}</p><h2 id="clients-title">{t("Historial de visitas")}</h2></div><span>{data.clients.length} {language === "es" ? "clientes" : "clients"}</span></div>
      <p className="manager-note">{t("Solo las citas completadas cuentan como visitas realizadas. Clientes agrupados por correo electrónico.")}</p>
      {data.clients.length === 0 ? <p>{t("Aún no hay clientes registrados.")}</p> : <div className="manager-table-wrap"><table className="manager-clients-table"><thead><tr><th>{t("Cliente")}</th><th>{t("Visitas realizadas")}</th><th>{t("Última visita")}</th><th>{t("Próxima reserva")}</th><th>{t("Historial")}</th></tr></thead><tbody>{data.clients.map(client => <tr key={client.email.toLowerCase()}>
        <td><strong>{client.name}</strong><a href={`mailto:${client.email}`}>{client.email}</a><a href={`tel:${client.phone}`}>{client.phone}</a></td>
        <td data-label={t("Visitas realizadas")}>{client.visits.length}</td><td data-label={t("Última visita")}>{client.visits[0] ? appointmentLabel(client.visits[0]) : t("Sin visitas realizadas")}</td>
        <td data-label={t("Próxima reserva")}>{client.upcoming[0] ? appointmentLabel(client.upcoming[0]) : t("Sin próxima reserva")}</td>
        <td data-label={t("Historial")}>{client.visits.length ? <details><summary>{t("Ver visitas")}</summary><ul>{client.visits.map(visit => <li key={visit.id}>{appointmentLabel(visit)}<br />{t(services.find(s => s.id === visit.serviceId)?.name || "")} · {barbers.find(b => b.id === visit.barberId)?.name}</li>)}</ul></details> : "—"}</td>
      </tr>)}</tbody></table></div>}
    </section>}
  </div>;
}
