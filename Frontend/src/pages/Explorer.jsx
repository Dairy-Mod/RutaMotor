import { useEffect, useRef, useState } from "react";
import { api, write, remove } from "../api";
import { Icon, KindIcon, kindInfo, statusInfo } from "../components/Icons";
import ServiceMap from "../components/ServiceMap";
import Modal from "../components/Modal";
import LocationForm from "../components/LocationForm";
const blank = { search: "", category: "", status: "", zone: "", specialty: "" };
function distance(point, coords) {
  const [lng, lat] = point;
  const rad = (n) => (n * Math.PI) / 180;
  const a =
    Math.sin(rad(lat - coords.latitude) / 2) ** 2 +
    Math.cos(rad(lat)) *
      Math.cos(rad(coords.latitude)) *
      Math.sin(rad(lng - coords.longitude) / 2) ** 2;
  return (6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}
const date = (v) =>
  new Intl.DateTimeFormat("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(v));
export default function Explorer({
  catalogs,
  version,
  reload,
  afterMutation,
  notify,
  onAdmin,
  initialSpecialty,
}) {
  const [filters, setFilters] = useState({
      ...blank,
      specialty: initialSpecialty || "",
    }),
    [locations, setLocations] = useState([]),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(""),
    [selected, setSelected] = useState(null),
    [modal, setModal] = useState(null),
    [deleting, setDeleting] = useState(false),
    [modalError, setModalError] = useState(""),
    [mapMode, setMapMode] = useState(null),
    [coords, setCoords] = useState(null),
    [near, setNear] = useState(false),
    [radius, setRadius] = useState("5"),
    [locating, setLocating] = useState(false);
  const mapRef = useRef();
  const geolocationRequest = useRef(0);
  useEffect(() => {
    return () => {
      // Invalida tanto el resultado como el error de una solicitud pendiente.
      geolocationRequest.current += 1;
    };
  }, []);
  const { categories, businesses, zones } = catalogs;
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v),
  );
  if (near && coords) {
    params.set("longitude", coords.longitude);
    params.set("latitude", coords.latitude);
    params.set("radius", radius);
  }
  const query = params.toString();
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setBusy(true);
      setError("");
      try {
        const { data } = await api("/locations?" + query, {
          signal: controller.signal,
        });
        setLocations(data);
      } catch (e) {
        if (e.name !== "AbortError") {
          setError(e.message);
          setLocations([]);
        }
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }, 220);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, version]);
  function selectLocation(id) {
    setSelected(id);
    mapRef.current?.focus(id);
  }
  function filter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
    setSelected(null);
  }
  async function save(id, body) {
    await write(
      "/locations" + (id ? "/" + id : ""),
      body,
      id ? "PATCH" : "POST",
    );
    setModal(null);
    afterMutation(id ? "Ubicación actualizada." : "Ubicación registrada.");
  }
  function askDelete(type, item) {
    setModalError("");
    setModal({ type: "delete", entity: type, item });
  }
  async function confirmDelete() {
    setDeleting(true);
    setModalError("");
    try {
      await remove("/" + modal.entity + "/" + modal.item.id);
      if (modal.entity === "zones" && filters.zone === modal.item.id)
        filter("zone", "");
      setModal(null);
      afterMutation("Registro eliminado.");
    } catch (e) {
      setModalError(e.message);
    } finally {
      setDeleting(false);
    }
  }
  function locate() {
    if (!navigator.geolocation) {
      notify("Tu navegador no permite obtener la ubicación.", "error");
      return;
    }
    const request = ++geolocationRequest.current;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (request !== geolocationRequest.current || !mapRef.current) return;
        setCoords(position.coords);
        mapRef.current.locate(position.coords);
        setNear(true);
        setLocating(false);
        notify(
          "Mostrando servicios por cercanía. La distancia es en línea recta.",
        );
      },
      () => {
        if (request !== geolocationRequest.current) return;
        setLocating(false);
        notify(
          "No fue posible obtener tu ubicación. Revisa el permiso del navegador.",
          "error",
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }
  async function zoneSubmit(e) {
    e.preventDefault();
    setDeleting(true);
    setModalError("");
    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name"),
      description: form.get("description"),
    };
    if (modal.geometry) body.geometry = modal.geometry;
    try {
      await write(
        "/zones" + (modal.item ? "/" + modal.item.id : ""),
        body,
        modal.item ? "PATCH" : "POST",
      );
      setModal(null);
      afterMutation("Zona guardada.");
    } catch (e) {
      setModalError(e.message);
    } finally {
      setDeleting(false);
    }
  }
  async function finishZone() {
    const geometry = mapRef.current.finishEdit();
    const id = mapMode?.id;
    setMapMode(null);
    if (!geometry) return;
    try {
      await write("/zones/" + id, { geometry }, "PATCH");
      afterMutation("Geometría de zona actualizada.");
    } catch (e) {
      notify(e.message, "error");
      await reload();
    }
  }
  async function exportGeo() {
    try {
      const result = await api("/locations/geojson?" + query);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(result, null, 2)], {
          type: "application/geo+json",
        }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "rutamotor-ubicaciones.geojson";
      a.click();
      URL.revokeObjectURL(url);
      notify("GeoJSON exportado con los filtros actuales.");
    } catch (e) {
      notify(e.message, "error");
    }
  }
  const counts = Object.entries(kindInfo).map(([kind, info]) => ({
    kind,
    ...info,
    count: locations.filter((l) => l.category?.kind === kind).length,
  }));
  return (
    <main className="content explorer">
      <div className="page-heading">
        <div>
          <span className="eyebrow">DIRECTORIO AUTOMOTRIZ / LEÓN, GTO.</span>
          <h1>Tu siguiente parada, resuelta.</h1>
          <p>Encuentra el servicio indicado y vuelve a tu camino.</p>
        </div>
        <button
          className="button primary"
          onClick={() => {
            setMapMode({ type: "point" });
            notify("Haz clic en el mapa para elegir la ubicación exacta.");
          }}
        >
          <Icon name="plus" size={18} />
          Nueva ubicación
        </button>
      </div>
      <div className="stats-row">
        {counts.map((c) => (
          <div className="stat-card" key={c.kind}>
            <KindIcon kind={c.kind} />
            <div>
              <span>
                {c.name === "Taller mecánico"
                  ? "Talleres mecánicos"
                  : c.name === "Refaccionaria"
                    ? "Refaccionarias"
                    : c.name === "Tienda de autos"
                      ? "Tiendas de autos"
                      : "Agencias automotrices"}
              </span>
              <strong>
                {busy ? "—" : c.count}
                <small>en los resultados</small>
              </strong>
            </div>
          </div>
        ))}
      </div>
      <section className="workspace" aria-label="Buscador y mapa">
        <div className="workspace-top">
          <div className="section-label">
            <Icon name="compass" size={20} />
            <h2>Explora cerca de ti</h2>
          </div>
          <span className="live-label">Directorio colaborativo</span>
        </div>
        <div className="filters">
          <label className="search-field">
            <Icon name="search" size={19} />
            <input
              aria-label="Buscar por nombre"
              placeholder="Busca un taller, tienda o agencia…"
              value={filters.search}
              onChange={(e) => filter("search", e.target.value)}
            />
          </label>
          <label className="filter-select">
            <span>Categoría</span>
            <select
              aria-label="Filtrar por categoría"
              value={filters.category}
              onChange={(e) => filter("category", e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-select">
            <span>Estado</span>
            <select
              aria-label="Filtrar por estado"
              value={filters.status}
              onChange={(e) => filter("status", e.target.value)}
            >
              <option value="">Todos los estados</option>
              {Object.entries(statusInfo).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-select">
            <span>Zona</span>
            <select
              aria-label="Filtrar por zona"
              value={filters.zone}
              onChange={(e) => filter("zone", e.target.value)}
            >
              <option value="">Todas las zonas</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {filters.specialty && (
          <div className="mode-banner">
            <Icon name="wrench" size={17} />
            <span>
              Especialidad:{" "}
              {catalogs.specialties.find((s) => s.id === filters.specialty)
                ?.name || "seleccionada"}
            </span>
            <button
              className="text-button"
              onClick={() => filter("specialty", "")}
            >
              Quitar filtro
            </button>
          </div>
        )}
        <div className="map-toolbar">
          <div className="toolbar-group">
            <button
              className={
                "button small-button " +
                (near ? "selected-button" : "secondary")
              }
              onClick={locate}
              disabled={locating}
            >
              {
                <Icon
                  name={locating ? "loading" : "locate"}
                  className={locating ? "spin" : ""}
                  size={16}
                />
              }
              Cerca de mí
            </button>
            {near && (
              <>
                <select
                  aria-label="Radio de búsqueda"
                  className="radius-select"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                >
                  {[2, 5, 10, 25, 50].map((n) => (
                    <option key={n} value={n}>
                      {n} km
                    </option>
                  ))}
                </select>
                <button
                  className="icon-button"
                  aria-label="Quitar cercanía"
                  onClick={() => setNear(false)}
                >
                  <Icon name="x" size={16} />
                </button>
              </>
            )}
            <button
              className="text-button"
              onClick={() => {
                setFilters(blank);
                setNear(false);
              }}
            >
              Limpiar filtros
            </button>
          </div>
          <div className="toolbar-group">
            <button
              className="button small-button secondary"
              onClick={() => mapRef.current.fit()}
            >
              <Icon name="layers" size={16} />
              Ver resultados
            </button>
            <button
              className="button small-button secondary"
              onClick={() => {
                setMapMode({ type: "draw" });
                mapRef.current.draw();
              }}
              disabled={!!mapMode}
            >
              <Icon name="polygon" size={16} />
              Dibujar zona
            </button>
          </div>
        </div>
        {mapMode && (
          <div className="mode-banner" role="status">
            <Icon
              name={mapMode.type === "point" ? "pin" : "polygon"}
              size={18}
            />
            <span>
              {mapMode.type === "point"
                ? "Haz clic en el mapa para registrar un lugar."
                : mapMode.type === "draw"
                  ? "Marca al menos 3 vértices y pulsa el primero para cerrar la zona."
                  : "Arrastra los vértices para ajustar la zona."}
            </span>
            {mapMode.type === "edit" && (
              <button
                className="button primary small-button"
                onClick={finishZone}
              >
                Guardar geometría
              </button>
            )}
            <button
              className="text-button"
              onClick={() => {
                mapRef.current.cancelDraw();
                mapRef.current.cancelEdit();
                setMapMode(null);
              }}
            >
              Cancelar
            </button>
          </div>
        )}
        {error && (
          <div className="inline-error" role="alert">
            {error}{" "}
            <button className="text-button" onClick={reload}>
              Reintentar
            </button>
          </div>
        )}
        <div className="map-and-results">
          <aside className="results-panel">
            <div className="results-heading">
              <strong>
                {busy ? "Buscando…" : locations.length + " lugares encontrados"}
              </strong>
              <span>{near ? "Por cercanía" : "Por nombre"}</span>
            </div>
            <div className="result-list" aria-busy={busy}>
              {!busy && !locations.length && (
                <div className="empty-state">
                  <Icon name="search" size={30} />
                  <h3>No encontramos lugares</h3>
                  <p>Prueba con otro nombre o cambia tus filtros.</p>
                </div>
              )}
              {locations.map((item) => (
                <button
                  key={item.id}
                  className={
                    "result-card " + (selected === item.id ? "selected" : "")
                  }
                  onClick={() => selectLocation(item.id)}
                >
                  <div className="result-card-top">
                    <KindIcon kind={item.category?.kind} size={20} />
                    <span className={"status " + item.status}>
                      {statusInfo[item.status]}
                    </span>
                  </div>
                  <h3>{item.name}</h3>
                  <p>{item.category?.name}</p>
                  <span className="result-address">
                    <Icon name="pin" size={13} />
                    {item.address || "Ver ubicación en mapa"}
                  </span>
                  <div className="result-bottom">
                    <span>
                      {coords
                        ? distance(item.location.coordinates, coords) +
                          " km en línea recta"
                        : "Ver detalles"}
                    </span>
                    <Icon name="chevron" size={16} />
                  </div>
                </button>
              ))}
            </div>
          </aside>
          <ServiceMap
            ref={mapRef}
            locations={locations}
            zones={zones}
            categories={categories}
            businesses={businesses}
            selectedId={selected}
            onPoint={(location) => {
              setMapMode(null);
              setModal({ type: "location", location });
            }}
            onZoneDrawn={(geometry) => {
              setMapMode(null);
              setModalError("");
              setModal({ type: "zone", geometry });
            }}
            onSave={save}
            onDelete={(item) => askDelete("locations", item)}
            onZoneDelete={(item) => askDelete("zones", item)}
            onZoneRename={(item) => {
              setModalError("");
              setModal({ type: "zone", item });
            }}
            onZoneEdit={(item) => {
              setMapMode({ type: "edit", id: item.id });
              mapRef.current.editZone(item.id);
            }}
          />
        </div>
        <div className="map-legend">
          <strong>Simbología</strong>
          {Object.entries(kindInfo).map(([kind, c]) => (
            <span key={kind}>
              <KindIcon kind={kind} size={15} />
              {c.name}
            </span>
          ))}
          <span>
            <i className="zone-swatch" />
            Zona de servicio
          </span>
          <span className="legend-tip">
            Pulsa un ícono para ver o editar el lugar
          </span>
        </div>
      </section>
      <div className="info-strip">
        <Icon name="help" size={22} />
        <div>
          <strong>Datos de demostración, decisiones informadas.</strong>
          <p>
            Los lugares con “Demo” son ficticios. Confirma la disponibilidad con
            el negocio antes de salir.
          </p>
        </div>
      </div>
      <section className="table-section">
        <div className="section-heading">
          <div>
            <h2>
              Ubicaciones registradas{" "}
              <span className="count-badge">{locations.length}</span>
            </h2>
            <p>Los cambios del mapa aparecen aquí automáticamente.</p>
          </div>
          <button className="button secondary small-button" onClick={exportGeo}>
            <Icon name="external" size={16} />
            Exportar GeoJSON
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {[
                  "Lugar",
                  "Categoría",
                  "Negocio",
                  "Estado",
                  "Descripción",
                  "Dirección",
                  "Teléfono",
                  "Horario",
                  "Especialidades",
                  "Sitio web",
                  "Tipo de geometría",
                  "Longitud",
                  "Latitud",
                  "Registrado por",
                  "Creación",
                  "Última edición",
                  "Acciones",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {locations.map((item) => (
                <tr key={item.id}>
                  <td>
                    <button
                      className="table-name"
                      onClick={() => {
                        selectLocation(item.id);
                        window.scrollTo({ top: 180, behavior: "smooth" });
                      }}
                    >
                      {item.name}
                    </button>
                  </td>
                  <td>{item.category?.name}</td>
                  <td>{item.business?.name}</td>
                  <td>
                    <span className={"status " + item.status}>
                      {statusInfo[item.status]}
                    </span>
                  </td>
                  <td className="wrap-cell">{item.description}</td>
                  <td className="wrap-cell">{item.address || "—"}</td>
                  <td>{item.business?.phone || "Sin registrar"}</td>
                  <td>{item.business?.hours || "Sin confirmar"}</td>
                  <td>
                    {item.business?.specialties
                      ?.map((s) => s.name)
                      .join(", ") || "—"}
                  </td>
                  <td>
                    {item.business?.website ? (
                      <a
                        href={item.business.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver sitio
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{item.location.type}</td>
                  <td>{item.location.coordinates[0].toFixed(6)}</td>
                  <td>{item.location.coordinates[1].toFixed(6)}</td>
                  <td>{item.createdBy?.name}</td>
                  <td>{date(item.createdAt)}</td>
                  <td>{date(item.updatedAt)}</td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={"Ver " + item.name}
                      onClick={() => selectLocation(item.id)}
                    >
                      <Icon name="eye" size={17} />
                    </button>
                    <button
                      className="icon-button danger-quiet"
                      aria-label={"Eliminar " + item.name}
                      onClick={() => askDelete("locations", item)}
                    >
                      <Icon name="trash" size={17} />
                    </button>
                  </td>
                </tr>
              ))}
              {!locations.length && !busy && (
                <tr>
                  <td colSpan={17} className="empty-row">
                    No hay ubicaciones con estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className="zone-section">
        <div className="section-heading">
          <div>
            <h2>Tus zonas de servicio</h2>
            <p>
              Dibuja un área y úsala para encontrar los servicios que contiene.
            </p>
          </div>
          <span className="count-badge">{zones.length}</span>
        </div>
        <div className="zone-grid">
          {zones.map((z) => (
            <article key={z.id} className="zone-card">
              <span className="kind-icon">
                <Icon name="polygon" />
              </span>
              <div>
                <h3>{z.name}</h3>
                <p>{z.description || "Sin descripción"}</p>
              </div>
              <div className="zone-actions">
                <button
                  className="icon-button"
                  aria-label={"Filtrar " + z.name}
                  onClick={() => filter("zone", z.id)}
                >
                  <Icon name="filter" size={17} />
                </button>
                <button
                  className="icon-button"
                  aria-label={"Editar " + z.name}
                  onClick={() => {
                    setModalError("");
                    setModal({ type: "zone", item: z });
                  }}
                >
                  <Icon name="edit" size={17} />
                </button>
                <button
                  className="icon-button danger-quiet"
                  aria-label={"Eliminar " + z.name}
                  onClick={() => askDelete("zones", z)}
                >
                  <Icon name="trash" size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
        {!zones.length && (
          <p className="muted">
            Todavía no hay zonas. Usa “Dibujar zona” sobre el mapa.
          </p>
        )}
      </section>
      {modal?.type === "location" && (
        <Modal
          title="Un nuevo lugar en el mapa"
          subtitle="Comparte una ubicación exacta con la comunidad."
          onClose={() => setModal(null)}
        >
          <LocationForm
            initial={{ location: modal.location }}
            categories={categories}
            businesses={businesses}
            onSave={(body) => save(null, body)}
            onCancel={() => setModal(null)}
          />
          <p className="form-note">
            ¿Falta un negocio o una categoría?{" "}
            <button className="text-button" onClick={onAdmin}>
              Ir a Administración
            </button>
          </p>
        </Modal>
      )}
      {modal?.type === "zone" && (
        <Modal
          title={modal.item ? "Editar zona" : "Guardar zona de servicio"}
          onClose={() => {
            if (!deleting) setModal(null);
          }}
        >
          <form className="form-grid" onSubmit={zoneSubmit}>
            <label className="full">
              Nombre de la zona
              <input
                name="name"
                autoFocus
                required
                minLength={2}
                maxLength={100}
                defaultValue={modal.item?.name || ""}
              />
            </label>
            <label className="full">
              Descripción
              <textarea
                name="description"
                maxLength={500}
                defaultValue={modal.item?.description || ""}
              />
            </label>
            <p className="form-note full">
              {modal.geometry
                ? modal.geometry.coordinates[0].length -
                  1 +
                  " vértices seleccionados."
                : "Para mover vértices, pulsa la zona en el mapa y elige “Ajustar vértices”."}
            </p>
            {modalError && (
              <p role="alert" className="inline-error full">
                {modalError}
              </p>
            )}
            <div className="form-actions full">
              <button
                type="button"
                className="button secondary"
                onClick={() => setModal(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button className="button primary" disabled={deleting}>
                Guardar zona
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal?.type === "delete" && (
        <Modal
          title="Eliminar registro"
          onClose={() => {
            if (!deleting) setModal(null);
          }}
        >
          <p>
            Se eliminará “{modal.item.name}”. Esta acción no se puede deshacer.
          </p>
          {modalError && (
            <p className="inline-error" role="alert">
              {modalError}
            </p>
          )}
          <div className="form-actions">
            <button
              className="button secondary"
              disabled={deleting}
              onClick={() => setModal(null)}
            >
              Conservar
            </button>
            <button
              className="button danger"
              disabled={deleting}
              onClick={confirmDelete}
            >
              {deleting ? "Eliminando…" : "Eliminar registro"}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
