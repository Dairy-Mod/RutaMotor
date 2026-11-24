import {
  Wrench,
  Store,
  CarFront,
  MapPin,
  Compass,
  BookOpen,
  Settings2,
  Plus,
  Search,
  X,
  LocateFixed,
  Layers,
  Pencil,
  Trash2,
  LogOut,
  ChevronRight,
  Phone,
  ExternalLink,
  Map,
  List,
  Check,
  AlertTriangle,
  LoaderCircle,
  Navigation,
  Hexagon,
  SlidersHorizontal,
  ArrowUpRight,
  CircleHelp,
  Clock3,
  Menu,
  Eye,
  RefreshCw,
  Battery,
  Thermometer,
  Droplet,
  CircleAlert,
  Lightbulb,
  ShieldAlert,
  CircleGauge,
} from "lucide-react";
const icons = {
  wrench: Wrench,
  store: Store,
  car: CarFront,
  pin: MapPin,
  compass: Compass,
  book: BookOpen,
  settings: Settings2,
  plus: Plus,
  search: Search,
  x: X,
  locate: LocateFixed,
  layers: Layers,
  edit: Pencil,
  trash: Trash2,
  logout: LogOut,
  chevron: ChevronRight,
  phone: Phone,
  external: ExternalLink,
  map: Map,
  list: List,
  check: Check,
  alert: AlertTriangle,
  loading: LoaderCircle,
  navigate: Navigation,
  polygon: Hexagon,
  filter: SlidersHorizontal,
  arrow: ArrowUpRight,
  help: CircleHelp,
  clock: Clock3,
  menu: Menu,
  eye: Eye,
  refresh: RefreshCw,
  battery: Battery,
  temperature: Thermometer,
  oil: Droplet,
  brake: CircleAlert,
  lights: Lightbulb,
  airbag: ShieldAlert,
  engine: CircleGauge,
};
export function Icon({ name, size = 20, ...props }) {
  const Component = icons[name] || MapPin;
  return (
    <Component size={size} strokeWidth={1.8} aria-hidden="true" {...props} />
  );
}
export const kindInfo = {
  taller: {
    name: "Taller mecánico",
    icon: "wrench",
    color: "#29745e",
    bg: "#e7f3ed",
  },
  refacciones: {
    name: "Refaccionaria",
    icon: "store",
    color: "#b97024",
    bg: "#fff2df",
  },
  agencia: {
    name: "Agencia automotriz",
    icon: "car",
    color: "#5b62b2",
    bg: "#efeffc",
  },
  tienda: {
    name: "Tienda de autos",
    icon: "car",
    color: "#287c9a",
    bg: "#e8f4fa",
  },
};
export const statusInfo = {
  disponible: "Disponible",
  por_confirmar: "Por confirmar",
  cerrado: "Cerrado",
};
export function KindIcon({ kind, size = 22 }) {
  const c = kindInfo[kind] || kindInfo.taller;
  return (
    <span className="kind-icon" style={{ color: c.color, background: c.bg }}>
      <Icon name={c.icon} size={size} />
    </span>
  );
}
