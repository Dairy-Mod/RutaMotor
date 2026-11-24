export const dashboard = [
  {
    id: "oil",
    name: "Presión de aceite",
    level: "red",
    meaning: "Puede indicar una pérdida de presión de lubricación.",
    action: "Detente con seguridad, apaga el motor y solicita revisión.",
    search: "",
    service: "Mecánica general",
  },
  {
    id: "temperature",
    name: "Temperatura del motor",
    level: "red",
    meaning: "La temperatura del refrigerante puede ser excesiva.",
    action:
      "Detente con seguridad y apaga el motor. No abras el depósito en caliente.",
    search: "",
    service: "Mecánica general",
  },
  {
    id: "brake",
    name: "Sistema de frenos",
    level: "red",
    meaning: "Puede señalar freno de estacionamiento activo o una falla.",
    action:
      "Si persiste al liberarlo, detente con seguridad y pide asistencia.",
    search: "",
    service: "Frenos y suspensión",
  },
  {
    id: "battery",
    name: "Sistema de carga",
    level: "red",
    meaning: "Posible anomalía del sistema que carga la batería.",
    action: "Solicita una revisión del sistema eléctrico lo antes posible.",
    search: "",
    service: "Sistema eléctrico",
  },
  {
    id: "engine",
    name: "Revisar motor",
    level: "amber",
    meaning: "El sistema de control del motor detectó una anomalía.",
    action:
      "Solicita diagnóstico. Si parpadea o el motor falla, reduce la marcha y busca asistencia.",
    search: "",
    service: "Diagnóstico electrónico",
  },
  {
    id: "abs",
    name: "Frenos ABS",
    level: "amber",
    meaning: "Posible falla de la función antibloqueo.",
    action:
      "Solicita revisión; si también aparece la alerta roja de frenos, detente con seguridad.",
    search: "",
    service: "Frenos y suspensión",
  },
  {
    id: "tire",
    name: "Presión de neumáticos",
    level: "amber",
    meaning: "Puede haber presión baja en una o varias llantas.",
    action: "Revisa las llantas y la presión recomendada por el fabricante.",
    search: "",
    service: "Llantas y alineación",
  },
  {
    id: "airbag",
    name: "Bolsa de aire",
    level: "amber",
    meaning: "El sistema de retención suplementaria requiere revisión.",
    action: "Agenda un diagnóstico del sistema de seguridad.",
    search: "",
    service: "Diagnóstico electrónico",
  },
  {
    id: "belt",
    name: "Cinturón de seguridad",
    level: "red",
    meaning: "Un ocupante puede no llevar el cinturón abrochado.",
    action: "Antes de continuar, verifica los cinturones de los ocupantes.",
  },
  {
    id: "highbeam",
    name: "Luces altas",
    level: "blue",
    meaning: "Indica que las luces de carretera están encendidas.",
    action: "Cambia a luces bajas al acercarte a otros vehículos.",
  },
];
export const dashboardSources = [
  {
    name: "Ford · Guía de testigos e indicadores",
    url: "https://www.ford.co.uk/support/how-tos/more-vehicle-topics/lights-and-bulbs/what-do-the-lights-on-my-dashboard-mean",
  },
  {
    name: "Ford · Manual de propietario: advertencias y mantenimiento",
    url: "https://www.fordservicecontent.com/Ford_Content/catalog/owner_guides/13378om1e.pdf",
  },
  {
    name: "Ford · Manual: neumáticos y refrigerante",
    url: "https://www.fordservicecontent.com/Ford_Content/catalog/owner_guides/04231og3s.pdf",
  },
];
