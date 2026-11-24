import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { api, write } from "./api";
import { Icon } from "./components/Icons";
import Auth from "./pages/Auth";
const Explorer = lazy(() => import("./pages/Explorer"));
const Admin = lazy(() => import("./pages/Admin"));
const Guide = lazy(() => import("./pages/Guide"));
const empty = { categories: [], businesses: [], specialties: [], zones: [] };
const nav = [
  ["explore", "compass", "Explorar mapa"],
  ["guide", "book", "Guía del tablero"],
  ["admin", "settings", "Administración"],
];
export default function App() {
  const [user, setUser] = useState(null),
    [checking, setChecking] = useState(true),
    [view, setView] = useState("explore"),
    [catalogs, setCatalogs] = useState(empty),
    [version, setVersion] = useState(0),
    [toast, setToast] = useState(null),
    [menu, setMenu] = useState(false),
    [catalogError, setCatalogError] = useState(""),
    [serviceSearch, setServiceSearch] = useState("");
  const notify = useCallback(
    (message, type = "success") => setToast({ message, type, key: Date.now() }),
    [],
  );
  const reload = useCallback(async () => {
    // El mapa consulta sus ubicaciones aunque falle uno de los catálogos.
    setVersion((v) => v + 1);
    try {
      const keys = Object.keys(empty);
      const responses = await Promise.all(keys.map((k) => api("/" + k)));
      setCatalogs(
        Object.fromEntries(keys.map((k, i) => [k, responses[i].data])),
      );
      setCatalogError("");
    } catch (e) {
      setCatalogError(e.message);
      throw e;
    }
  }, []);
  const afterMutation = useCallback(
    (message) => {
      notify(message);
      // La operación ya se guardó. El banner permite reintentar solo la lectura.
      void reload().catch(() => {});
    },
    [notify, reload],
  );
  useEffect(() => {
    api("/auth/me")
      .then(({ data }) => setUser(data))
      .catch(() => {})
      .finally(() => setChecking(false));
    const expired = () => {
      setUser(null);
      setCatalogs(empty);
      notify("Tu sesión terminó. Inicia sesión de nuevo.", "error");
    };
    window.addEventListener("session-expired", expired);
    return () => window.removeEventListener("session-expired", expired);
  }, [notify]);
  useEffect(() => {
    if (user) reload().catch((e) => notify(e.message, "error"));
  }, [user, reload, notify]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  async function logout() {
    try {
      await write("/auth/logout", {});
      setUser(null);
      setCatalogs(empty);
      setView("explore");
      setServiceSearch("");
    } catch (e) {
      notify(e.message, "error");
    }
  }
  function navigate(page) {
    setView(page);
    setMenu(false);
    window.scrollTo(0, 0);
  }
  if (checking)
    return (
      <div className="loading-screen">
        <Icon name="loading" className="spin" size={28} />
        <p>Preparando tu camino…</p>
      </div>
    );
  if (!user)
    return (
      <>
        <Auth
          onLogin={(u) => {
            setUser(u);
            setView("explore");
          }}
        />
        {toast && (
          <div className={"toast " + toast.type} role="alert">
            {toast.message}
            <button onClick={() => setToast(null)} aria-label="Cerrar mensaje">
              <Icon name="x" size={16} />
            </button>
          </div>
        )}
      </>
    );
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (menu ? "open" : "")}>
        <a
          href="#explore"
          onClick={(e) => {
            e.preventDefault();
            navigate("explore");
          }}
          className="brand"
        >
          <span className="brand-mark">
            <Icon name="navigate" size={24} />
          </span>
          ruta<span>motor</span>
        </a>
        <span className="sidebar-label">TU COPILOTO LOCAL</span>
        <nav aria-label="Navegación principal">
          {nav.map(([id, icon, label]) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              onClick={() => navigate(id)}
            >
              <Icon name={icon} size={20} />
              {label}
              {view === id && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Icon name="car" size={24} />
            <h3>El camino empieza contigo.</h3>
            <p>Encuentra ayuda. Comparte un lugar. Sigue adelante.</p>
          </div>
          <div className="sidebar-local">
            <span />
            Entorno local <small>León, Guanajuato</small>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Abrir menú"
            onClick={() => setMenu(!menu)}
          >
            <Icon name="menu" />
          </button>
          <div className="breadcrumb">
            RutaMotor <Icon name="chevron" size={15} />
            <strong>{nav.find((n) => n[0] === view)[2]}</strong>
          </div>
          <div className="user-area">
            <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
            <span className="user-name">
              {user.name}
              <small>Miembro de la comunidad</small>
            </span>
            <button
              className="icon-button"
              aria-label="Cerrar sesión"
              onClick={logout}
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </header>
        {catalogError && (
          <div className="catalog-error" role="alert">
            No se pudo actualizar el directorio: {catalogError}
            <button
              className="text-button"
              onClick={() => reload().catch(() => {})}
            >
              Reintentar
            </button>
          </div>
        )}
        <Suspense
          fallback={
            <div className="view-loading">
              <Icon name="loading" className="spin" /> Cargando vista…
            </div>
          }
        >
          {view === "explore" && (
            <Explorer
              key={serviceSearch}
              catalogs={catalogs}
              version={version}
              reload={reload}
              afterMutation={afterMutation}
              notify={notify}
              onAdmin={() => navigate("admin")}
              initialSpecialty={serviceSearch}
            />
          )}
          {view === "admin" && (
            <Admin catalogs={catalogs} afterMutation={afterMutation} />
          )}
          {view === "guide" && (
            <Guide
              onExplore={(service) => {
                const specialty = catalogs.specialties.find(
                  (s) => s.name === service,
                );
                setServiceSearch(specialty?.id || "");
                if (!specialty)
                  notify(
                    "Esta especialidad aún no está registrada. Puedes explorar el directorio completo.",
                  );
                navigate("explore");
              }}
            />
          )}
        </Suspense>
        <footer className="app-footer">
          <span>
            ruta<strong>motor</strong> · Tu camino, con respaldo.
          </span>
          <span>Usa la app cuando estés estacionado.</span>
        </footer>
      </div>
      {menu && (
        <button
          className="menu-overlay"
          aria-label="Cerrar menú"
          onClick={() => setMenu(false)}
        />
      )}
      {toast && (
        <div
          className={"toast " + toast.type}
          role={toast.type === "error" ? "alert" : "status"}
        >
          <Icon name={toast.type === "error" ? "alert" : "check"} size={19} />
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} aria-label="Cerrar mensaje">
            <Icon name="x" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
