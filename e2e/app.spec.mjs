import { test, expect } from "@playwright/test";
async function login(page) {
  await page.goto("/");
  await page.getByLabel("Correo electrónico").fill("browser@rutamotor.local");
  await page.getByLabel("Contraseña", { exact: true }).fill("BrowserTest2026!");
  await page.getByRole("button", { name: "Entrar a RutaMotor" }).click();
  await expect(
    page.getByRole("heading", { name: "Tu siguiente parada, resuelta." }),
  ).toBeVisible();
  await expect(page.locator(".result-card")).toHaveCount(11);
}
test("acceso, registro, sesión persistente, error visible y cierre", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.screenshot({ path: "tmp/qa/acceso.png", fullPage: true });
  await page.getByLabel("Correo electrónico").fill("browser@rutamotor.local");
  await page.getByLabel("Contraseña", { exact: true }).fill("Incorrecta123!");
  await page.getByRole("button", { name: "Entrar a RutaMotor" }).click();
  await expect(page.getByRole("alert")).toContainText("incorrectos");
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await page.getByLabel("Tu nombre").fill("Persona nueva");
  await page
    .getByLabel("Correo electrónico")
    .fill("persona" + Date.now() + "@example.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("NuevaCuenta123!");
  await page.getByRole("button", { name: "Crear mi cuenta" }).click();
  await expect(
    page.getByRole("heading", { name: "Tu siguiente parada, resuelta." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Tu siguiente parada, resuelta." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(
    page.getByRole("button", { name: "Entrar a RutaMotor" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("mapa, filtros de servidor, creación por clic, edición y eliminación en popup y tabla sincronizada", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page);
  await page.screenshot({ path: "tmp/qa/mapa.png", fullPage: true });
  await page.getByLabel("Buscar por nombre").fill("refacciones");
  await expect(page.locator(".result-card")).toHaveCount(2);
  await page.getByLabel("Filtrar por estado").selectOption("disponible");
  await expect(page.locator(".result-card")).toHaveCount(1);
  await expect(page.locator(".table-section tbody tr")).toHaveCount(1);
  await page.getByRole("button", { name: "Limpiar filtros" }).click();
  await expect(page.locator(".result-card")).toHaveCount(11);
  await page
    .getByRole("button", { name: "Nueva ubicación", exact: true })
    .click();
  await page.locator(".leaflet-map").click({ position: { x: 200, y: 180 } });
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Nombre de la ubicación").fill("Ubicación navegador");
  await dialog
    .getByLabel("Descripción", { exact: true })
    .fill("Servicio creado desde el mapa");
  await dialog.getByRole("button", { name: "Guardar ubicación" }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator(".result-card")).toHaveCount(12);
  await expect(page.locator(".table-section")).toContainText(
    "Ubicación navegador",
  );
  await page
    .locator(".result-card")
    .filter({ hasText: "Ubicación navegador" })
    .click();
  const popup = page.locator(".leaflet-popup");
  await popup.locator(".leaflet-popup-close-button").click();
  await page
    .locator(".result-card")
    .filter({ hasText: "Ubicación navegador" })
    .click();
  await expect(popup).toBeVisible();
  await popup.getByRole("button", { name: "Editar aquí" }).click();
  await popup.getByLabel("Nombre de la ubicación").fill("Ubicación editada");
  await popup.getByRole("button", { name: "Guardar ubicación" }).click();
  await expect(page.locator(".table-section")).toContainText(
    "Ubicación editada",
  );
  await page
    .locator(".result-card")
    .filter({ hasText: "Ubicación editada" })
    .click();
  await popup.getByRole("button", { name: "Eliminar", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Eliminar registro" })
    .click();
  await expect(page.locator(".result-card")).toHaveCount(11);
  await expect(page.locator(".table-section")).not.toContainText(
    "Ubicación editada",
  );
  expect(errors).toEqual([]);
});
test("CRUD de negocios, categorías y especialidades con relaciones", async ({
  page,
}) => {
  await login(page);
  await page
    .getByRole("button", { name: "Administración", exact: true })
    .click();
  for (const [tab, singular, name] of [
    ["Especialidades", "especialidad", "Especialidad navegador"],
    ["Categorías", "categoría", "Categoría navegador"],
    ["Negocios", "negocio", "Negocio navegador"],
  ]) {
    await page.getByRole("tab", { name: new RegExp(tab) }).click();
    await page
      .getByRole("button", { name: "Crear " + singular, exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByLabel("Nombre", { exact: true })
      .fill(name);
    if (tab === "Negocios")
      await page
        .getByRole("dialog")
        .getByLabel("Especialidad navegador editado", { exact: true })
        .check();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Guardar cambios" })
      .click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.locator("tbody")).toContainText(name);
    await page
      .getByRole("button", { name: "Editar " + name, exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByLabel("Nombre", { exact: true })
      .fill(name + " editado");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Guardar cambios" })
      .click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.locator("tbody")).toContainText(name + " editado");
  }
  await page.screenshot({ path: "tmp/qa/administracion.png", fullPage: true });
  for (const [tab, name] of [
    ["Negocios", "Negocio navegador editado"],
    ["Categorías", "Categoría navegador editado"],
    ["Especialidades", "Especialidad navegador editado"],
  ]) {
    await page.getByRole("tab", { name: new RegExp(tab) }).click();
    await page
      .getByRole("button", { name: "Eliminar " + name, exact: true })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Eliminar registro" })
      .click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.locator("tbody")).not.toContainText(name);
  }
});
test("polígonos: dibujo, persistencia, filtro y eliminación", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: "Dibujar zona", exact: true }).click();
  const map = page.locator(".leaflet-map");
  for (const p of [
    { x: 190, y: 130 },
    { x: 350, y: 130 },
    { x: 350, y: 270 },
    { x: 190, y: 270 },
    { x: 190, y: 130 },
  ])
    await map.click({ position: p });
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Nombre de la zona").fill("Zona navegador");
  await dialog
    .getByRole("button", { name: "Guardar zona", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(
    page.locator(".zone-card").filter({ hasText: "Zona navegador" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Filtrar Zona navegador", exact: true })
    .click();
  await expect(page.getByLabel("Filtrar por zona")).not.toHaveValue("");
  await page
    .getByRole("button", { name: "Editar Zona navegador", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Nombre de la zona")
    .fill("Zona modificada");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Guardar zona", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.locator(".zone-card").filter({ hasText: "Zona modificada" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Eliminar Zona modificada", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Eliminar registro" })
    .click();
  await expect(
    page.locator(".zone-card").filter({ hasText: "Zona modificada" }),
  ).toHaveCount(0);
});
test("guía, búsqueda por especialidad y vista móvil sin desbordamiento", async ({
  page,
}) => {
  await login(page);
  await page
    .getByRole("button", { name: "Guía del tablero", exact: true })
    .click();
  await expect(page.locator(".warning-card")).toHaveCount(10);
  await page.screenshot({ path: "tmp/qa/guia.png", fullPage: true });
  await page.getByLabel("Buscar testigo").fill("aceite");
  await expect(page.locator(".warning-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Buscar mecánica general" }).click();
  await expect(page.locator(".mode-banner")).toContainText("Mecánica general");
  await expect(page.locator(".result-card")).toHaveCount(4);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "tmp/qa/movil.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page
    .getByRole("button", { name: "Guía del tablero", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Tu tablero te está hablando." }),
  ).toBeVisible();
});

test("geolocalización, radio y exportación de resultados filtrados", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 21.12, longitude: -101.68 });
  await login(page);
  await page.getByRole("button", { name: "Cerca de mí", exact: true }).click();
  await expect(page.getByLabel("Radio de búsqueda")).toBeVisible();
  await page.getByLabel("Radio de búsqueda").selectOption("2");
  await expect
    .poll(async () => page.locator(".result-card").count())
    .toBeGreaterThan(0);
  await expect
    .poll(async () => page.locator(".result-card").count())
    .toBeLessThan(11);
  const count = await page.locator(".result-card").count();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar GeoJSON" }).click();
  const download = await downloadEvent;
  const { readFile } = await import("node:fs/promises");
  const data = JSON.parse(await readFile(await download.path(), "utf8"));
  expect(data.type).toBe("FeatureCollection");
  expect(data.features).toHaveLength(count);
  expect(data.features.every((f) => f.geometry.type === "Point")).toBeTruthy();
});
