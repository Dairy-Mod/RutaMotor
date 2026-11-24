import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { Icon, KindIcon, kindInfo, statusInfo } from "./Icons";
import LocationForm from "./LocationForm";

function LocationPopup({
  item,
  categories,
  businesses,
  onSave,
  onDelete,
  onLayout,
}) {
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    onLayout();
  }, [editing]);
  if (editing)
    return (
      <div className="popup-editor">
        <h3>Editar ubicación</h3>
        <LocationForm
          initial={item}
          categories={categories}
          businesses={businesses}
          compact
          onCancel={() => setEditing(false)}
          onSave={async (body) => {
            await onSave(item.id, body);
            setEditing(false);
          }}
        />
      </div>
    );
  return (
    <div className="place-popup">
      <div className="popup-title">
        <KindIcon kind={item.category?.kind} />
        <div>
          <span className="eyebrow">{item.category?.name}</span>
          <h3>{item.name}</h3>
        </div>
      </div>
      <span className={"status " + item.status}>{statusInfo[item.status]}</span>
      <p>{item.description}</p>
      <p className="muted">{item.address || "Sin dirección registrada"}</p>
      <p>
        <strong>{item.business?.name}</strong>
        <br />
        {item.business?.hours || "Horario sin confirmar"}
      </p>
      {item.business?.phone && (
        <a
          className="phone-link"
          href={"tel:" + item.business.phone.replace(/[^+\d]/g, "")}
        >
          <Icon name="phone" size={15} />
          {item.business.phone}
        </a>
      )}
      <div className="popup-actions">
        <button className="button secondary" onClick={() => setEditing(true)}>
          <Icon name="edit" size={15} />
          Editar aquí
        </button>
        <button className="button danger-quiet" onClick={() => onDelete(item)}>
          <Icon name="trash" size={15} />
          Eliminar
        </button>
      </div>
    </div>
  );
}
const ServiceMap = forwardRef(function ServiceMap(
  {
    locations,
    zones,
    categories,
    businesses,
    onPoint,
    onZoneDrawn,
    onSave,
    onDelete,
    onZoneDelete,
    onZoneRename,
    onZoneEdit,
    selectedId,
    onTileError,
  },
  ref,
) {
  const container = useRef(null),
    mapRef = useRef(null),
    markers = useRef(new Map()),
    zoneLayers = useRef(new Map()),
    pointLayer = useRef(null),
    userLayer = useRef(null),
    editLayer = useRef(null),
    callbacks = useRef({});
  callbacks.current = { onPoint, onZoneDrawn, onTileError };
  const [popups, setPopups] = useState([]),
    [zonePopups, setZonePopups] = useState([]);
  const [tilesFailed, setTilesFailed] = useState(false);
  useEffect(() => {
    const map = L.map(container.current, {
      center: [21.123, -101.675],
      zoom: 13,
      zoomControl: false,
    });
    mapRef.current = map;
    L.control.zoom({ position: "bottomright" }).addTo(map);
    const tile = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    tile.on("tileerror", () => setTilesFailed(true));
    map.pm.setLang("es");
    map.on("click", (e) => {
      if (
        !e.propagatedFrom &&
        !e.originalEvent?.target?.closest?.(".leaflet-interactive") &&
        !map.pm.globalDrawModeEnabled() &&
        !editLayer.current
      )
        callbacks.current.onPoint({
          type: "Point",
          coordinates: [e.latlng.lng, e.latlng.lat],
        });
    });
    map.on("pm:create", (e) => {
      const geometry = e.layer.toGeoJSON().geometry;
      map.removeLayer(e.layer);
      callbacks.current.onZoneDrawn(geometry);
    });
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(container.current);
    return () => {
      resize.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markers.current.forEach((m) => m.remove());
    markers.current.clear();
    const next = locations.map((item) => {
      const kind = kindInfo[item.category?.kind] || kindInfo.taller;
      const content = document.createElement("div");
      L.DomEvent.disableClickPropagation(content);
      L.DomEvent.disableScrollPropagation(content);
      L.DomEvent.on(content, "click", L.DomEvent.stopPropagation);
      const icon = L.divIcon({
        className: "service-marker",
        html:
          '<span style="background:' +
          kind.color +
          '">' +
          renderToStaticMarkup(<Icon name={kind.icon} size={20} />) +
          "</span>",
        iconSize: [38, 44],
        iconAnchor: [19, 42],
        popupAnchor: [0, -36],
      });
      const marker = L.marker(
        [item.location.coordinates[1], item.location.coordinates[0]],
        { icon, title: item.name, pmIgnore: true },
      )
        .addTo(map)
        .bindPopup(content, { maxWidth: 400, minWidth: 280, maxHeight: 420 });
      markers.current.set(item.id, marker);
      return { item, content, popup: marker.getPopup() };
    });
    setPopups(next);
    return () => {
      markers.current.forEach((m) => m.remove());
      markers.current.clear();
    };
  }, [locations]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    zoneLayers.current.forEach((l) => l.remove());
    zoneLayers.current.clear();
    editLayer.current = null;
    const next = zones.map((zone) => {
      const content = document.createElement("div");
      L.DomEvent.disableClickPropagation(content);
      L.DomEvent.disableScrollPropagation(content);
      L.DomEvent.on(content, "click", L.DomEvent.stopPropagation);
      const group = L.geoJSON(zone.geometry, {
        style: {
          color: "#23735d",
          weight: 2,
          dashArray: "6 6",
          fillOpacity: 0.07,
        },
        onEachFeature(feature, layer) {
          layer.bindPopup(content);
          zoneLayers.current.set(zone.id, layer);
        },
      }).addTo(map);
      return { zone, content, group };
    });
    setZonePopups(next);
    return () => {
      next.forEach(({ group }) => group.remove());
      zoneLayers.current.clear();
    };
  }, [zones]);
  useEffect(() => {
    if (!selectedId) return;
    const marker = markers.current.get(selectedId);
    if (marker) {
      mapRef.current.stop();
      mapRef.current.setView(marker.getLatLng(), 15, { animate: false });
      marker.openPopup();
    }
  }, [selectedId, locations]);
  useImperativeHandle(
    ref,
    () => ({
      focus(id) {
        const marker = markers.current.get(id);
        if (marker) {
          mapRef.current.stop();
          mapRef.current.setView(marker.getLatLng(), 15, { animate: false });
          marker.openPopup();
        }
      },
      fit() {
        const items = Array.from(markers.current.values());
        if (items.length)
          mapRef.current.fitBounds(L.featureGroup(items).getBounds(), {
            padding: [45, 45],
            maxZoom: 15,
          });
      },
      draw() {
        mapRef.current.closePopup();
        mapRef.current.pm.enableDraw("Polygon", {
          allowSelfIntersection: false,
          snappable: true,
          pathOptions: { color: "#23735d", fillOpacity: 0.1 },
        });
      },
      cancelDraw() {
        mapRef.current.pm.disableDraw();
      },
      locate(coords) {
        const map = mapRef.current;
        userLayer.current?.remove();
        userLayer.current = L.circleMarker(
          [coords.latitude, coords.longitude],
          {
            radius: 8,
            color: "#fff",
            weight: 3,
            fillColor: "#327cea",
            fillOpacity: 1,
            pmIgnore: true,
          },
        )
          .addTo(map)
          .bindTooltip("Tu ubicación");
        map.flyTo([coords.latitude, coords.longitude], 14);
      },
      editZone(id) {
        const layer = zoneLayers.current.get(id);
        if (layer) {
          mapRef.current.closePopup();
          editLayer.current = layer;
          layer.pm.enable({ allowSelfIntersection: false });
        }
      },
      finishEdit() {
        const layer = editLayer.current;
        if (!layer) return null;
        const geometry = layer.toGeoJSON().geometry;
        layer.pm.disable();
        editLayer.current = null;
        return geometry;
      },
      cancelEdit() {
        const layer = editLayer.current;
        if (!layer) return;
        layer.pm.disable();
        const zone = zones.find((z) => zoneLayers.current.get(z.id) === layer);
        if (zone)
          layer.setLatLngs(
            L.GeoJSON.coordsToLatLngs(zone.geometry.coordinates, 1),
          );
        editLayer.current = null;
      },
    }),
    [zones],
  );
  return (
    <div className="map-shell">
      <div
        className="leaflet-map"
        ref={container}
        aria-label="Mapa de servicios automotrices de León"
      />
      <div className="map-label">
        <Icon name="pin" size={14} />
        León, Guanajuato
      </div>
      {tilesFailed && (
        <div className="tile-warning" role="status">
          No se cargó el mapa base. Comprueba tu conexión; los puntos y las
          zonas siguen disponibles.
        </div>
      )}
      {popups.map(({ item, content, popup }) =>
        createPortal(
          <LocationPopup
            onLayout={() => popup.update()}
            item={item}
            categories={categories}
            businesses={businesses}
            onSave={onSave}
            onDelete={onDelete}
          />,
          content,
          item.id,
        ),
      )}
      {zonePopups.map(({ zone, content }) =>
        createPortal(
          <div className="place-popup">
            <span className="eyebrow">ZONA DE SERVICIO</span>
            <h3>{zone.name}</h3>
            <p>{zone.description || "Área delimitada en el mapa."}</p>
            <div className="popup-actions">
              <button
                className="button secondary"
                onClick={() => onZoneRename(zone)}
              >
                Editar datos
              </button>
              <button
                className="button secondary"
                onClick={() => onZoneEdit(zone)}
              >
                Ajustar vértices
              </button>
              <button
                className="button danger-quiet"
                onClick={() => onZoneDelete(zone)}
              >
                Eliminar
              </button>
            </div>
          </div>,
          content,
          zone.id,
        ),
      )}
    </div>
  );
});
export default ServiceMap;
