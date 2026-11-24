import { test, expect } from "@playwright/test";

const outageMessage = "Catálogo temporalmente no disponible";
const pathname = (request) => new URL(request.url()).pathname;

async function login(page) {
  await page.goto("/");
  await page.getByLabel("Correo electrónico").fill("browser@rutamotor.local");
  await page.getByLabel("Contraseña", { exact: true }).fill("BrowserTest2026!");
  await page.getByRole("button", { name: "Entrar a RutaMotor" }).click();
  await expect(page.locator(".result-card")).toHaveCount(11);
  await expect(
    page.getByLabel("Filtrar por categoría").locator("option"),
  ).toHaveCount(5);
}

async function blockCatalog(page) {
  await page.route("**/api/categories", (route) => {
    if (route.request().method() !== "GET") return route.continue();
    return route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: outageMessage }),
    });
  });
}

async function retryCatalog(page) {
  const response = page.waitForResponse(
    (response) => pathname(response.request()) === "/api/categories",
  );
  await page
    .locator(".catalog-error")
    .getByRole("button", { name: "Reintentar" })
    .click();
  await response;
}

async function recoverCatalog(page) {
  await page.unroute("**/api/categories");
  await retryCatalog(page);
  await expect(page.locator(".catalog-error")).not.toBeVisible();
}

function mutationResponse(page, entity, method) {
  return page.waitForResponse(
    (response) =>
      response.request().method() === method &&
      pathname(response.request()).startsWith("/api/" + entity) &&
      response.ok(),
  );
}

test("un fallo de recarga no repite el guardado ni la eliminación de una ubicación", async ({
  page,
}) => {
  await login(page);
  const name = "Ubicación con recarga fallida";
  let id;
  let posts = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && pathname(request) === "/api/locations")
      posts++;
  });
  try {
    await blockCatalog(page);
    await page.getByRole("button", { name: "Nueva ubicación" }).click();
    await page.locator(".leaflet-map").click({ position: { x: 200, y: 180 } });
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nombre de la ubicación").fill(name);
    await dialog
      .getByLabel("Descripción", { exact: true })
      .fill("El guardado y la actualización de pantalla son independientes.");
    const created = mutationResponse(page, "locations", "POST");
    await dialog.getByRole("button", { name: "Guardar ubicación" }).click();
    id = (await (await created).json()).data.id;
    await expect(dialog).not.toBeVisible();
    await expect(page.locator(".toast.success")).toContainText(
      "Ubicación registrada.",
    );
    await expect(page.locator(".catalog-error")).toContainText(outageMessage);
    await expect(
      page.locator(".result-card").filter({ hasText: name }),
    ).toHaveCount(1);
    await retryCatalog(page);
    await retryCatalog(page);
    expect(posts).toBe(1);
    const stored = await page.request.get(
      "/api/locations?search=" + encodeURIComponent(name),
    );
    expect((await stored.json()).count).toBe(1);
    await recoverCatalog(page);

    await blockCatalog(page);
    await page.locator(".result-card").filter({ hasText: name }).click();
    const popup = page.locator(".leaflet-popup");
    await popup.getByRole("button", { name: "Editar aquí" }).click();
    await popup.getByLabel("Nombre de la ubicación").fill(name + " editada");
    await popup.getByRole("button", { name: "Guardar ubicación" }).click();
    await expect(page.locator(".popup-editor")).not.toBeVisible();
    await expect(page.locator(".table-section")).toContainText(
      name + " editada",
    );
    await expect(page.locator(".catalog-error")).toContainText(outageMessage);
    expect(posts).toBe(1);

    await page
      .locator(".result-card")
      .filter({ hasText: name + " editada" })
      .click();
    await popup.getByRole("button", { name: "Eliminar", exact: true }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Eliminar registro" })
      .click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(
      page.locator(".result-card").filter({ hasText: name }),
    ).toHaveCount(0);
    expect((await page.request.get("/api/locations/" + id)).status()).toBe(404);
    await recoverCatalog(page);
  } finally {
    if (id) await page.request.delete("/api/locations/" + id);
  }
});

for (const [entity, tab, singular] of [
  ["businesses", "Negocios", "negocio"],
  ["categories", "Categorías", "categoría"],
  ["specialties", "Especialidades", "especialidad"],
]) {
  test(`${tab}: conserva el resultado del CRUD si falla la recarga`, async ({
    page,
  }) => {
    await login(page);
    await page
      .getByRole("button", { name: "Administración", exact: true })
      .click();
    await page.getByRole("tab", { name: new RegExp(tab) }).click();
    const name = "Prueba recarga " + entity;
    let id;
    let posts = 0;
    page.on("request", (request) => {
      if (request.method() === "POST" && pathname(request) === "/api/" + entity)
        posts++;
    });
    try {
      await blockCatalog(page);
      await page.getByRole("button", { name: "Crear " + singular }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel("Nombre", { exact: true }).fill(name);
      const created = mutationResponse(page, entity, "POST");
      await dialog.getByRole("button", { name: "Guardar cambios" }).click();
      id = (await (await created).json()).data.id;
      await expect(dialog).not.toBeVisible();
      await expect(page.locator(".catalog-error")).toContainText(outageMessage);
      await retryCatalog(page);
      expect(posts).toBe(1);
      const records = (await (await page.request.get("/api/" + entity)).json())
        .data;
      expect(records.filter((record) => record.name === name)).toHaveLength(1);
      await recoverCatalog(page);
      await expect(page.locator("tbody")).toContainText(name);

      await blockCatalog(page);
      await page
        .getByRole("button", { name: "Editar " + name, exact: true })
        .click();
      await dialog
        .getByLabel("Nombre", { exact: true })
        .fill(name + " editado");
      await dialog.getByRole("button", { name: "Guardar cambios" }).click();
      await expect(dialog).not.toBeVisible();
      await expect(page.locator(".catalog-error")).toContainText(outageMessage);
      expect(posts).toBe(1);
      await recoverCatalog(page);
      await expect(page.locator("tbody")).toContainText(name + " editado");

      await blockCatalog(page);
      await page
        .getByRole("button", {
          name: "Eliminar " + name + " editado",
          exact: true,
        })
        .click();
      await dialog.getByRole("button", { name: "Eliminar registro" }).click();
      await expect(dialog).not.toBeVisible();
      expect(
        (await page.request.get("/api/" + entity + "/" + id)).status(),
      ).toBe(404);
      await expect(page.locator(".catalog-error")).toContainText(outageMessage);
      await recoverCatalog(page);
      await expect(page.locator("tbody")).not.toContainText(name);
    } finally {
      if (id) await page.request.delete("/api/" + entity + "/" + id);
    }
  });
}

test("un error del guardado mantiene el formulario abierto para corregirlo", async ({
  page,
}) => {
  await login(page);
  await page
    .getByRole("button", { name: "Administración", exact: true })
    .click();
  await page.route("**/api/businesses", (route) => {
    if (route.request().method() !== "POST") return route.continue();
    return route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ message: "Datos del negocio rechazados" }),
    });
  });
  await page.getByRole("button", { name: "Crear negocio" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nombre", { exact: true }).fill("Negocio rechazado");
  await dialog.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("alert")).toContainText(
    "Datos del negocio rechazados",
  );
  await expect(dialog.getByLabel("Nombre", { exact: true })).toHaveValue(
    "Negocio rechazado",
  );
  await expect(
    dialog.getByRole("button", { name: "Guardar cambios" }),
  ).toBeEnabled();
});

for (const result of ["success", "error"]) {
  test(`ignora la respuesta de geolocalización ${result} al salir del mapa`, async ({
    page,
  }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: {
          getCurrentPosition(success, error) {
            window.pendingGeolocation = { success, error };
          },
        },
      });
    });
    await login(page);
    await page.getByRole("button", { name: "Cerca de mí" }).click();
    await expect(
      page.getByRole("button", { name: "Cerca de mí" }),
    ).toBeDisabled();
    await page
      .getByRole("button", { name: "Guía del tablero", exact: true })
      .click();
    await expect(page.locator(".warning-card")).toHaveCount(10);
    await page.evaluate((result) => {
      if (result === "success")
        window.pendingGeolocation.success({
          coords: { latitude: 21.12, longitude: -101.68 },
        });
      else window.pendingGeolocation.error({ code: 1 });
    }, result);
    await expect(page.locator(".toast")).not.toBeVisible();
    expect(errors).toEqual([]);

    await page
      .getByRole("button", { name: "Explorar mapa", exact: true })
      .click();
    await expect(page.locator(".result-card")).toHaveCount(11);
    await page.getByRole("button", { name: "Cerca de mí" }).click();
    await page.evaluate(() =>
      window.pendingGeolocation.success({
        coords: { latitude: 21.12, longitude: -101.68 },
      }),
    );
    await expect(page.getByLabel("Radio de búsqueda")).toBeVisible();
    expect(errors).toEqual([]);
  });
}
