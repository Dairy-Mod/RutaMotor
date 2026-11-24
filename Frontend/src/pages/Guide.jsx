import { useState } from "react";
import { Icon } from "../components/Icons";
import DashboardSymbol from "../components/DashboardSymbol";
import { dashboard, dashboardSources } from "../data/dashboard";
export default function Guide({ onExplore }) {
  const [search, setSearch] = useState(""),
    [level, setLevel] = useState("");
  const shown = dashboard.filter(
    (i) =>
      (!level || i.level === level) &&
      (i.name + " " + i.meaning)
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  const names = {
    red: "Atención inmediata",
    amber: "Revisión necesaria",
    blue: "Sistema activo",
  };
  return (
    <main className="content guide">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CONOCE TU VEHÍCULO</span>
          <h1>Tu tablero te está hablando.</h1>
          <p>
            Reconoce las señales y entiende cuál puede ser tu siguiente paso.
          </p>
        </div>
        <span className="pill">
          <Icon name="book" size={16} />
          Guía de consulta
        </span>
      </div>
      <section className="guide-intro">
        <div>
          <span className="eyebrow light">PRIMERO, TU SEGURIDAD</span>
          <h2>
            Una luz es una señal.
            <br />
            Escúchala a tiempo.
          </h2>
          <p>
            Estaciónate antes de consultar esta guía. Los símbolos y sus colores
            cambian según el vehículo: consulta siempre su manual.
          </p>
        </div>
        <div className="dashboard-display" aria-hidden="true">
          <span className="red">
            <DashboardSymbol name="oil" />
          </span>
          <span className="amber">
            <DashboardSymbol name="engine" />
          </span>
          <span className="blue">
            <DashboardSymbol name="highbeam" />
          </span>
          <div className="dash-line" />
        </div>
      </section>
      <div className="severity-legend">
        <button
          className={"severity red " + (level === "red" ? "active" : "")}
          onClick={() => setLevel(level === "red" ? "" : "red")}
        >
          <span />
          <div>
            <strong>Rojo</strong>
            <small>Prioriza tu seguridad</small>
          </div>
        </button>
        <button
          className={"severity amber " + (level === "amber" ? "active" : "")}
          onClick={() => setLevel(level === "amber" ? "" : "amber")}
        >
          <span />
          <div>
            <strong>Ámbar</strong>
            <small>Solicita una revisión</small>
          </div>
        </button>
        <button
          className={"severity blue " + (level === "blue" ? "active" : "")}
          onClick={() => setLevel(level === "blue" ? "" : "blue")}
        >
          <span />
          <div>
            <strong>Azul / verde</strong>
            <small>Funciones activadas</small>
          </div>
        </button>
        <p>El color orienta; el significado exacto depende del manual.</p>
      </div>
      <div className="section-heading">
        <div>
          <h2>Identifica el testigo</h2>
          <p>Ilustraciones orientativas de los símbolos más comunes.</p>
        </div>
        <label className="search-field guide-search">
          <Icon name="search" size={18} />
          <input
            aria-label="Buscar testigo"
            placeholder="Ej. aceite, frenos, motor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      <div className="warning-grid">
        {shown.map((item) => (
          <article className="warning-card" key={item.id}>
            <div className="warning-card-top">
              <span className={"dashboard-symbol " + item.level}>
                <DashboardSymbol name={item.id} />
              </span>
              <span className={"severity-tag " + item.level}>
                {names[item.level]}
              </span>
            </div>
            <h3>{item.name}</h3>
            <p>{item.meaning}</p>
            <div className="warning-action">
              <strong>Qué hacer</strong>
              <p>{item.action}</p>
            </div>
            {item.service && (
              <button
                className="text-button"
                onClick={() => onExplore(item.service)}
              >
                <Icon name="wrench" size={16} />
                Buscar {item.service.toLowerCase()}
              </button>
            )}
          </article>
        ))}
      </div>
      {!shown.length && (
        <div className="empty-state">
          <Icon name="search" size={28} />
          <h3>No encontramos ese testigo</h3>
          <p>Prueba otro término o cambia el filtro de color.</p>
        </div>
      )}
      <div className="info-strip">
        <Icon name="help" size={24} />
        <div>
          <strong>Esta guía orienta; un profesional confirma.</strong>
          <p>
            No es un diagnóstico ni garantiza que sea seguro conducir. Ante una
            señal grave, detente en un lugar seguro y pide asistencia.
          </p>
        </div>
      </div>
      <section className="guide-sources">
        <h3>Referencias para consultar</h3>
        <p>
          Contenido resumido a partir de manuales del fabricante. Consulta el
          manual específico de tu modelo.
        </p>
        {dashboardSources.map((s) => (
          <a href={s.url} target="_blank" rel="noreferrer" key={s.url}>
            {s.name}
            <Icon name="external" size={14} />
          </a>
        ))}
      </section>
    </main>
  );
}
