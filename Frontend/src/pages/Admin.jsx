import { useState } from "react";
import { write, remove } from "../api";
import { Icon, kindInfo } from "../components/Icons";
import Modal from "../components/Modal";
const tabs = {
  businesses: {
    title: "Negocios",
    singular: "negocio",
    icon: "store",
    description: "Datos de contacto y especialidades de cada negocio.",
  },
  categories: {
    title: "Categorías",
    singular: "categoría",
    icon: "layers",
    description: "Organiza los lugares y define su simbología en el mapa.",
  },
  specialties: {
    title: "Especialidades",
    singular: "especialidad",
    icon: "wrench",
    description: "Servicios que ofrece cada negocio automotriz.",
  },
};
function EntityForm({ entity, item, specialties, onSave, onCancel }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    let body = Object.fromEntries(form);
    if (entity === "businesses") body.specialties = form.getAll("specialties");
    try {
      await onSave(body);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-grid" onSubmit={submit}>
      <label className="full">
        Nombre
        <input
          name="name"
          autoFocus
          required
          minLength={2}
          maxLength={entity === "businesses" ? 120 : 80}
          defaultValue={item?.name || ""}
        />
      </label>
      {entity === "categories" && (
        <label className="full">
          Tipo de lugar y símbolo
          <select name="kind" defaultValue={item?.kind || "taller"}>
            {Object.entries(kindInfo).map(([k, v]) => (
              <option key={k} value={k}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {entity !== "businesses" && (
        <label className="full">
          Descripción
          <textarea
            name="description"
            maxLength={500}
            defaultValue={item?.description || ""}
          />
        </label>
      )}
      {entity === "businesses" && (
        <>
          <label>
            Teléfono
            <input
              name="phone"
              type="tel"
              maxLength={25}
              placeholder="Ej. +52 477 123 4567"
              defaultValue={item?.phone || ""}
            />
          </label>
          <label>
            Horario
            <input
              name="hours"
              maxLength={160}
              placeholder="Ej. Lun–vie 09:00–18:00"
              defaultValue={item?.hours || ""}
            />
          </label>
          <label className="full">
            Sitio web
            <input
              name="website"
              type="url"
              maxLength={300}
              placeholder="https://"
              defaultValue={item?.website || ""}
            />
          </label>
          <fieldset className="full">
            <legend>Especialidades</legend>
            <div className="checkbox-grid">
              {specialties.map((s) => (
                <label key={s.id} className="checkbox-label">
                  <input
                    name="specialties"
                    type="checkbox"
                    value={s.id}
                    defaultChecked={item?.specialties?.some(
                      (i) => i.id === s.id,
                    )}
                  />
                  {s.name}
                </label>
              ))}
            </div>
            {!specialties.length && (
              <p className="muted">
                Registra especialidades en la pestaña correspondiente.
              </p>
            )}
          </fieldset>
        </>
      )}
      {error && (
        <p className="inline-error full" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions full">
        <button
          type="button"
          className="button secondary"
          onClick={onCancel}
          disabled={busy}
        >
          Cancelar
        </button>
        <button className="button primary" disabled={busy}>
          <Icon
            name={busy ? "loading" : "check"}
            size={17}
            className={busy ? "spin" : ""}
          />
          {busy ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
export default function Admin({ catalogs, reload, notify }) {
  const [tab, setTab] = useState("businesses"),
    [modal, setModal] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [search, setSearch] = useState("");
  const config = tabs[tab];
  const items = catalogs[tab].filter((i) =>
    i.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
  );
  async function save(body) {
    await write(
      "/" + tab + (modal.item ? "/" + modal.item.id : ""),
      body,
      modal.item ? "PATCH" : "POST",
    );
    await reload();
    notify("Cambios guardados.");
    setModal(null);
  }
  async function confirmDelete() {
    setBusy(true);
    setError("");
    try {
      await remove("/" + tab + "/" + modal.item.id);
      await reload();
      setModal(null);
      notify("Registro eliminado.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="content">
      <div className="page-heading">
        <div>
          <span className="eyebrow">UN DIRECTORIO QUE CRECE CONTIGO</span>
          <h1>Todo en su lugar.</h1>
          <p>
            Administra los negocios y los servicios detrás de cada punto del
            mapa.
          </p>
        </div>
      </div>
      <div
        className="admin-tabs"
        role="tablist"
        aria-label="Entidades del directorio"
      >
        {Object.entries(tabs).map(([key, c]) => (
          <button
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? "active" : ""}
            key={key}
            onClick={() => {
              setTab(key);
              setSearch("");
            }}
          >
            <Icon name={c.icon} size={19} />
            {c.title}
            <span>{catalogs[key].length}</span>
          </button>
        ))}
      </div>
      <section className="admin-section">
        <div className="section-heading">
          <div>
            <h2>{config.title}</h2>
            <p>{config.description}</p>
          </div>
          <button
            className="button primary"
            onClick={() => setModal({ type: "edit" })}
          >
            <Icon name="plus" size={18} />
            Crear {config.singular}
          </button>
        </div>
        <label className="search-field admin-search">
          <Icon name="search" size={18} />
          <input
            aria-label={"Buscar " + config.title.toLowerCase()}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={"Buscar " + config.title.toLowerCase() + "…"}
          />
        </label>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                {tab === "businesses" ? (
                  <>
                    <th>Contacto</th>
                    <th>Horario</th>
                    <th>Especialidades</th>
                    <th>Sitio web</th>
                  </>
                ) : (
                  <>
                    <th>Descripción</th>
                    {tab === "categories" && <th>Tipo y símbolo</th>}
                  </>
                )}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="strong">{item.name}</td>
                  {tab === "businesses" ? (
                    <>
                      <td>{item.phone || "Sin teléfono"}</td>
                      <td>{item.hours || "Por confirmar"}</td>
                      <td className="wrap-cell">
                        <div className="tags">
                          {item.specialties.map((s) => (
                            <span key={s.id}>{s.name}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        {item.website ? (
                          <a
                            href={item.website}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Visitar sitio
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="wrap-cell">{item.description || "—"}</td>
                      {tab === "categories" && (
                        <td>
                          <span className="inline-icon">
                            <Icon name={kindInfo[item.kind]?.icon} />
                            {kindInfo[item.kind]?.name}
                          </span>
                        </td>
                      )}
                    </>
                  )}
                  <td>
                    <div className="inline-icon">
                      <button
                        className="icon-button"
                        aria-label={"Editar " + item.name}
                        onClick={() => setModal({ type: "edit", item })}
                      >
                        <Icon name="edit" size={17} />
                      </button>
                      <button
                        className="icon-button danger-quiet"
                        aria-label={"Eliminar " + item.name}
                        onClick={() => {
                          setError("");
                          setModal({ type: "delete", item });
                        }}
                      >
                        <Icon name="trash" size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={7} className="empty-row">
                    No hay registros. Crea el primero o ajusta tu búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <div className="info-strip">
        <Icon name="layers" size={24} />
        <div>
          <strong>Información conectada.</strong>
          <p>
            Los negocios se relacionan con especialidades; las ubicaciones, con
            negocios y categorías. Los registros en uso se protegen contra
            eliminaciones accidentales.
          </p>
        </div>
      </div>
      {modal?.type === "edit" && (
        <Modal
          title={(modal.item ? "Editar " : "Crear ") + config.singular}
          onClose={() => setModal(null)}
        >
          <EntityForm
            entity={tab}
            item={modal.item}
            specialties={catalogs.specialties}
            onSave={save}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
      {modal?.type === "delete" && (
        <Modal
          title={"Eliminar " + config.singular}
          onClose={() => {
            if (!busy) setModal(null);
          }}
        >
          <p>
            Se eliminará “{modal.item.name}”. Si tiene referencias activas,
            primero deberás retirarlas.
          </p>
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setModal(null)}
            >
              Conservar
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={confirmDelete}
            >
              {busy ? "Eliminando…" : "Eliminar registro"}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
