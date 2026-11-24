import { copyFile, access } from "node:fs/promises";
for (const folder of ["Backend", "Frontend"]) {
  const file = new URL(`../${folder}/.env`, import.meta.url);
  try {
    await access(file);
    console.log(`${folder}/.env ya existe; se conserva.`);
  } catch {
    await copyFile(new URL(`../${folder}/.env.example`, import.meta.url), file);
    console.log(`${folder}/.env creado.`);
  }
}
