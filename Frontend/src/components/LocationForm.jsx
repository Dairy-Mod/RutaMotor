import { useState } from "react";
import { Icon, statusInfo } from "./Icons";
export default function LocationForm({
  initial,
  categories,
  businesses,
  onSave,
  onCancel,
  compact = false,
}) {
  const [form, setForm] = useState(() => ({
    name: initial?.name || "",
    description: initial?.description || "",
    address: initial?.address || "",
    category: initial?.category?.id || categories[0]?.id || "",
    business: initial?.business?.id || businesses[0]?.id || "",
    status: initial?.status || "por_confirmar",
    longitude: initial?.location?.coordinates[0] ?? -101.68,
    latitude: initial?.location?.coordinates[1] ?? 21.122,
  }));
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { longitude, latitude, ...data } = form;
      await onSave({
        ...data,
        location: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        },
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className={"form-grid " + (compact ? "compact" : "")}
      onSubmit={submit}
    >
      <label className="full">
        Nombre de la ubicación
        <input
          autoFocus
          required
          minLength={2}
          maxLength={120}
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Ej. Taller de confianza"
        />
      </label>
      <label>
        Categoría
        <select
          required
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
        >
          <option value="" disabled>
            Selecciona
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Negocio
        <select
          required
          value={form.business}
          onChange={(e) => set("business", e.target.value)}
        >
          <option value="" disabled>
            Selecciona
          </option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>
      <label className="full">
        Descripción
        <textarea
          required
          minLength={3}
          maxLength={1000}
          rows={2}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </label>
      <label className="full">
        Dirección
        <input
          maxLength={250}
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
        />
      </label>
      <label className="full">
        Estado del servicio
        <select
          value={form.status}
          onChange={(e) => set("status", e.target.value)}
        >
          {Object.entries(statusInfo).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label>
        Longitud
        <input
          required
          type="number"
          min="-180"
          max="180"
          step="any"
          value={form.longitude}
          onChange={(e) => set("longitude", e.target.value)}
        />
      </label>
      <label>
        Latitud
        <input
          required
          type="number"
          min="-90"
          max="90"
          step="any"
          value={form.latitude}
          onChange={(e) => set("latitude", e.target.value)}
        />
      </label>
      {!compact && (
        <p className="form-note full">
          El punto seleccionado en el mapa usa el orden GeoJSON: longitud,
          latitud. Puedes ajustar sus coordenadas.
        </p>
      )}
      {(!categories.length || !businesses.length) && (
        <p className="inline-error full">
          Primero registra una categoría y un negocio en Administración.
        </p>
      )}
      {error && (
        <p role="alert" className="inline-error full">
          {error}
        </p>
      )}
      <div className="form-actions full">
        <button type="button" className="button secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button
          className="button primary"
          disabled={busy || !categories.length || !businesses.length}
        >
          {busy ? (
            <Icon name="loading" className="spin" />
          ) : (
            <Icon name="check" size={17} />
          )}
          Guardar ubicación
        </button>
      </div>
    </form>
  );
}
