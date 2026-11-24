# RutaMotor

Directorio automotriz georreferenciado para localizar talleres, tiendas de autos, refaccionarias y agencias en León, Guanajuato. Incluye una guía ilustrada de testigos del tablero que permite buscar negocios por la especialidad relacionada.

Aplicación independiente del sistema de incidentes original. El frontend y el backend se ejecutan localmente; los datos de la configuración actual se almacenan en **MongoDB Atlas**. Conserva la organización por capas y usa **React con Vite**, **Leaflet + Geoman**, **Node.js + Express** y **Mongoose**. El despliegue y el reporte de desarrollo permanecen pendientes.

## Ejecución local

Requisitos: Node.js 22.12 o superior (probado con Node 24), npm, acceso a internet y una conexión válida a MongoDB Atlas. El usuario de base de datos debe tener permisos de lectura y escritura sobre la base elegida, y Atlas debe permitir el acceso desde la IP del equipo.

Desde esta carpeta `PF`, instala las dependencias y prepara los archivos de entorno:

```powershell
npm ci
npm run setup
```

Antes de cargar los datos, configura `MONGODB_URI` en `Backend/.env` con tu conexión a Atlas. **La plantilla `Backend/.env.example` conserva una URI local de ejemplo**; reemplázala si estás preparando una instalación nueva con Atlas. `npm run setup` conserva los archivos `.env` existentes, por lo que no reemplaza la conexión que ya configuraste.

Después ejecuta:

```powershell
npm run seed
npm run dev
```

Abre **http://127.0.0.1:5173**. API: http://127.0.0.1:3001/api/health.

- `setup` copia los ejemplos de entorno únicamente si no existe el archivo `.env`.
- `seed` agrega una cuenta, 4 categorías, 7 especialidades, 11 negocios, 11 ubicaciones y 1 zona. Se puede repetir: no limpia colecciones, no cambia contraseñas de usuarios existentes ni reemplaza registros.
- El nombre de la base de uso normal se toma de la URI configurada. El backend también admite `MONGODB_DB_NAME` para seleccionar otra base; las pruebas lo utilizan para aislar sus datos. Mantén una base exclusiva de RutaMotor, separada del sistema de incidentes.
- La carga se realiza en la base indicada por la configuración actual. Los datos de una base local no se transfieren automáticamente a Atlas: el seed crea los ejemplos faltantes; no migra los registros que hayas agregado manualmente.
- Los datos con “Demo” y sus coordenadas son ficticios, no establecimientos verificados. Los teléfonos se dejan vacíos para evitar dirigir llamadas a personas reales.
- Detén ambos servidores con Ctrl+C.
- Si cambias las dependencias del proyecto, usa `npm install` y conserva actualizado `package-lock.json`. Para instalar las versiones registradas utiliza `npm ci`, desde `PF`.

El seed crea la cuenta de demostración con `DEMO_EMAIL` y `DEMO_PASSWORD` de `Backend/.env`. Los valores públicos de ejemplo de `Backend/.env.example` son:

| Campo | Valor de ejemplo |
| --- | --- |
| Correo | demo@rutamotor.local |
| Contraseña | RutaMotor2026! |

Si cambiaste esas variables antes de crear la cuenta, usa tus valores configurados. El seed no cambia la contraseña de una cuenta existente. La contraseña mostrada aquí es pública y exclusivamente de demostración; no es la contraseña del usuario de conexión a Atlas.

## Configuración

`Backend/.env.example` documenta puerto, URI, orígenes permitidos, duración de sesión y cuenta de ejemplo. Las contraseñas se guardan con bcrypt; los archivos `.env` se excluyen mediante `.gitignore`.

### MongoDB Atlas

La configuración actual usa Atlas y su conexión, datos de demostración e índices geográficos ya fueron comprobados. Para configurar otra instalación, coloca tu URI privada en `Backend/.env`. Este es únicamente un formato de referencia, con marcadores que debes sustituir:

```dotenv
MONGODB_URI="mongodb+srv://<usuario>:<contrasena_codificada>@<cluster>/<base_de_datos>"
MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8
```

Usa las credenciales del usuario de base de datos de Atlas. El nombre después de `/` selecciona la base; si también defines `MONGODB_DB_NAME`, ese valor tiene prioridad. Reinicia el backend después de modificar el `.env`.

Los caracteres reservados de la contraseña deben codificarse dentro de la URI: por ejemplo, `#` se escribe `%23` y `@` se escribe `%40`. La contraseña real del usuario no cambia. Las comillas permiten que dotenv lea el valor completo, pero no sustituyen la codificación de la URI.

`MONGODB_DNS_SERVERS` es opcional y se aplica únicamente a conexiones `mongodb+srv://`. Permite indicar servidores DNS alternativos cuando la resolución SRV del proveedor local falla.

### Alternativa con MongoDB local

Para trabajar con una base local, instala e inicia MongoDB en el puerto 27017 y configura:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/rutamotor_local
```

Esta opción también es la configuración de ejemplo del repositorio y la usada por defecto para el servidor de pruebas. Ejecutar la app con Atlas no requiere tener MongoDB local instalado; ejecutar las pruebas con su configuración predeterminada sí lo requiere.

### Frontend y conectividad

`Frontend/.env.example` contiene `VITE_API_URL=/api`. El proxy de Vite envía estas peticiones al puerto 3001. Si cambias el puerto del backend, ajusta `API_PROXY_TARGET` al iniciar Vite o el valor por defecto en `Frontend/vite.config.js`.

El frontend y el backend se ejecutan en el equipo. **Con Atlas se necesita internet para consultar y guardar datos**; la aplicación no incluye un modo de datos sin conexión. El mapa base de OpenStreetMap y la fuente tipográfica opcional de Google Fonts también requieren internet. Si falla la fuente se utiliza una del sistema; si falla el mapa base, se muestra un aviso. No se requiere una clave de Mapbox. La geolocalización pide permiso del navegador y funciona en localhost/127.0.0.1.

### Comprobar la conexión y los datos

Al ejecutar `npm run dev`, el backend conecta a MongoDB y prepara los índices antes de escuchar en el puerto 3001. Comprueba el mensaje de inicio y abre `http://127.0.0.1:3001/api/health`; una conexión activa devuelve `status: "ok"`.

En Atlas o MongoDB Compass, abre la base configurada y consulta `users`, `categories`, `specialties`, `businesses`, `locations` y `zones`. La colección `sessions` almacena las sesiones de acceso. Para comprobar la persistencia, crea o edita un lugar desde la app y actualiza la vista de documentos de `locations`.

Si aparece `bad auth : authentication failed`, revisa el usuario de base de datos, la contraseña y su codificación en la URI. Si aparece `querySrv ECONNREFUSED`, revisa `MONGODB_DNS_SERVERS`. Confirma también que Atlas permita la IP del equipo.

## Recorrido de uso

1. Inicia sesión o crea una cuenta.
2. Explora la lista y el mapa. Pulsa un lugar para ver su información y contacto.
3. Busca por nombre parcial y combina categoría, estado y zona. Los filtros se resuelven en MongoDB y actualizan mapa y tabla con la misma respuesta.
4. Usa “Cerca de mí” para consultar puntos dentro del radio seleccionado, ordenados por proximidad. La distancia mostrada es en línea recta, no una ruta de conducción.
5. Pulsa “Nueva ubicación” y elige un punto del mapa, o haz clic en un espacio libre. Completa el nombre, descripción, categoría, negocio y estado. Puedes ajustar las coordenadas.
6. Dentro del popup pulsa **“Editar aquí”**. El formulario se abre en ese mismo popup. También se puede eliminar desde allí, con confirmación.
7. En Administración crea, lista, edita y elimina **negocios**, **categorías** y **especialidades**. Son tres CRUD distintos de usuarios, ubicaciones y zonas.
8. Dibuja una zona: marca al menos tres vértices y pulsa el primero para cerrar el polígono. Asigna nombre y descripción. Desde el popup de la zona puedes modificar datos, ajustar vértices o eliminarla. Para ajustar vértices, arrástralos y pulsa “Guardar geometría”.
9. En la guía del tablero identifica un símbolo, filtra por color o nombre y busca la especialidad vinculada.
10. Exporta los resultados filtrados como GeoJSON.

Todos los usuarios autenticados participan en el mismo directorio colaborativo y pueden administrar los registros del directorio. El usuario creador queda referenciado en ubicaciones y zonas. No se implementaron roles privados ni se afirma que los negocios hayan sido verificados.

“Disponible”, “Por confirmar” y “Cerrado” son estados registrados manualmente. La app no deduce horarios de apertura ni certifica disponibilidad.

## Correspondencia con los requisitos funcionales

| Requisito | Implementación |
| --- | --- |
| Login y registro | Vistas propias, correo único normalizado, bcrypt, sesión de servidor y protección de API/vistas |
| 3 CRUD internos | Negocios, categorías y especialidades con formularios y tablas |
| Relaciones | Ubicación → categoría, negocio y usuario; negocio → especialidades; zona → usuario, con ObjectId y populate |
| Ubicación exacta | Clic en Leaflet, GeoJSON Point, validación e índice 2dsphere |
| Edición/eliminación | Acciones y edición dentro del popup; confirmación para borrar |
| Tabla actualizada | Misma consulta que alimenta al mapa; actualización React después de cada mutación, sin recargar |
| Búsqueda y filtros | Nombre literal parcial sin distinguir mayúsculas, categoría y estado; adicionalmente zona, cercanía y especialidad |
| Zonas | Dibujo Geoman, Polygon persistente, carga al entrar, ajuste de geometría y eliminación |
| Interfaz | Acceso/registro, mapa con tabla, administración y guía del tablero; diseño adaptable y mensajes visibles |
| Backend en capas | config, models, routes, services, middlewares, utils y data |
| MongoDB Atlas | Conexión configurada y comprobada, datos de demostración cargados e índices 2dsphere verificados |
| Despliegue | Pendiente; el frontend y el backend se ejecutan localmente |
| Repositorio público y reporte | Entregables pendientes; el reporte se pospuso por indicación del usuario |

La tabla muestra nombre, descripción, categoría por nombre, negocio por nombre, estado, dirección, contacto, horario, especialidades, sitio, tipo de geometría, longitud, latitud, usuario creador por nombre y fechas. Los IDs técnicos no aparecen.

La actualización inmediata cubre los cambios realizados desde la sesión actual. No se implementó sincronización por WebSocket entre varios navegadores; vuelve a entrar al mapa o usa “Reintentar” tras errores para consultar cambios externos.

## Arquitectura

```text
PF/
  Backend/
    src/
      config/       Conexión y catálogos de valores
      models/       Esquemas, referencias e índices
      routes/       HTTP: auth y fábrica de routers CRUD
      services/     Un servicio por entidad; lógica, consultas y relaciones
      middlewares/  Autenticación, validación y errores centralizados
      utils/        AppError, validación de campos y geometrías
      data/         Carga de datos ficticios idempotente
      app.js        Configura Express sin abrir el puerto
      index.js      Conecta MongoDB e inicia el servidor
    test/           Pruebas con bases temporales
    request/        Ejemplos para REST Client
  Frontend/
    src/
      components/   Mapa, formularios, diálogo y simbología
      pages/        Auth, Explorer, Admin y Guide
      data/         Guía del tablero y fuentes
      api.js        Cliente fetch con cookie y errores
      App.jsx       Sesión, navegación y catálogos
  e2e/              Pruebas reales de navegador
  scripts/          Entorno, arranque y servidor aislado de pruebas
```

El router CRUD compartido reduce repetición; cada entidad conserva su servicio y modelo propios. Las rutas solo reciben datos y devuelven HTTP. Los servicios validan relaciones, aplican filtros y consultan MongoDB. `AppError` y el middleware final unifican los errores.

GeoJSON usa siempre **[longitud, latitud]**. Leaflet recibe **[latitud, longitud]**; la conversión ocurre en el componente de mapa. Las zonas admiten un anillo exterior cerrado, entre 3 y 500 vértices, sin repeticiones, cruces ni superficie nula.

Las eliminaciones con referencias activas devuelven 409: primero se reasignan/eliminan ubicaciones o se retira la especialidad del negocio. Esto evita referencias huérfanas durante las operaciones habituales. Las comprobaciones no constituyen transacciones distribuidas para escrituras simultáneas.

## API REST

Todas las rutas de entidades requieren la cookie de sesión.

| Ruta | Métodos |
| --- | --- |
| /api/auth/register | POST |
| /api/auth/login | POST |
| /api/auth/me | GET |
| /api/auth/logout | POST |
| /api/categories | GET, POST |
| /api/specialties | GET, POST |
| /api/businesses | GET, POST |
| /api/locations | GET, POST |
| /api/zones | GET, POST |
| /api/{entidad}/:id | GET, PATCH, DELETE |
| /api/locations/geojson | GET |
| /api/zones/geojson | GET |

Listado: `{ count, data }`; documento: `{ data }`; error: `{ message }`. Crear devuelve 201; lecturas, cambios y eliminaciones, 200. Validación 400, credenciales/sesión 401, origen 403, no encontrado 404, conflicto de duplicados o referencias 409 y error inesperado 500.

Ejemplo de consulta:

```text
/api/locations?search=taller&category=<ObjectId>&status=disponible
/api/locations?zone=<ObjectId>
/api/locations?longitude=-101.68&latitude=21.12&radius=5
/api/locations?specialty=<ObjectId>
```

El radio se expresa en kilómetros, mayor que cero y máximo 100. La cercanía usa `$near` y el filtro de zona usa `$geoWithin`. La búsqueda escapa expresiones regulares para tratar el texto literalmente.

Seguridad: cookie HttpOnly y SameSite=Strict, token aleatorio de 256 bits cuyo hash se almacena en MongoDB, expiración comprobada en cada petición y TTL de limpieza, logout con revocación, límite de intentos de acceso, CORS/origin en escrituras, Helmet, cuerpos JSON limitados, listas de campos permitidos y contraseñas de 10 caracteres como mínimo y 72 bytes como máximo. No se guardan tokens ni contraseñas en localStorage. `COOKIE_SECURE=false` permite HTTP local; para HTTPS se debe configurar true.

## Verificación

```powershell
npm test
npm run build
npm run test:e2e
```

- Las pruebas de API crean una base `pf_test_*`, prueban flujos HTTP reales y eliminan únicamente esa base al terminar. No utilizan ni eliminan la base de uso normal de la aplicación.
- Las de navegador levantan sus propios servidores en 3002/5174 y una base `pf_test_e2e_*`, cargan sus propios datos y eliminan esa base al terminar.
- En Windows se usa Microsoft Edge instalado. En otros sistemas instala Chromium con `npx playwright install chromium`. Puede seleccionarse otro canal con `PW_CHANNEL`.
- `MONGODB_TEST_URI` selecciona el servidor de pruebas y es independiente de `MONGODB_URI`. Su valor de ejemplo es `mongodb://127.0.0.1:27017`: para ejecutar las pruebas con ese valor, el servicio MongoDB local debe estar activo, aunque la app use Atlas. El usuario del servidor de pruebas necesita permisos para crear y eliminar las bases temporales.
- Las capturas y trazas de verificación se guardan en carpetas ignoradas; no son el reporte del proyecto.

## Fuentes técnicas y guía

- [Vite](https://vite.dev/guide/), [Leaflet](https://leafletjs.com/reference.html), [Geoman](https://geoman.io/docs/leaflet/modes/draw-mode).
- [GeoJSON en Mongoose](https://mongoosejs.com/docs/geojson.html) y [referencias con populate](https://mongoosejs.com/docs/populate.html).
- Los textos e ilustraciones de la guía son orientativos, elaborados para esta app. Las referencias del fabricante están accesibles dentro de la vista Guía. No sustituyen el manual del vehículo ni una revisión profesional.

## Pendientes de entrega

- Publicar el frontend y el backend para la revisión del proyecto. La base de datos de la configuración actual ya está en Atlas.
- Preparar el repositorio público con frontend, backend, este README y los archivos `.env.example`, y entregar su enlace. Los `.env` reales y sus credenciales deben quedar excluidos; `.gitignore` ya los contempla.
- Entregar las credenciales de una cuenta de demostración existente con datos cargados. Si se usan los valores públicos de ejemplo, comprueba que coincidan con la cuenta creada en la base de revisión.
- Elaborar el reporte de desarrollo en PDF con portada institucional, problemática y solución, desarrollo paso a paso, estructura del backend, modelos y relaciones, capturas de cada requisito funcionando y una conclusión por integrante. Este reporte permanece pospuesto por indicación del usuario.

Las capturas generadas durante las pruebas son material de verificación y no sustituyen el reporte de desarrollo. Para la revisión, los integrantes deben conocer y poder explicar el código y los complementos utilizados.
