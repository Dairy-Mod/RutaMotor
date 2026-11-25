# RutaMotor

Directorio automotriz georreferenciado para localizar talleres, tiendas de autos, refaccionarias y agencias en León, Guanajuato. Incluye una guía ilustrada de testigos del tablero que permite buscar negocios por la especialidad relacionada.

Aplicación independiente del sistema de incidentes original, desarrollada con **React + Vite**, **Leaflet + Geoman**, **Node.js + Express** y **MongoDB Atlas con Mongoose**. El frontend está publicado en **Netlify** y el backend en **Render**. También se puede ejecutar en un entorno local. El reporte de desarrollo permanece pendiente.

## Enlaces del proyecto

| Recurso | Dirección |
| --- | --- |
| Aplicación web | [rutamotor.netlify.app](https://rutamotor.netlify.app) |
| Salud de la API a través del frontend | [rutamotor.netlify.app/api/health](https://rutamotor.netlify.app/api/health) |
| Backend | [rutamotor.onrender.com](https://rutamotor.onrender.com) |
| Salud del backend | [rutamotor.onrender.com/api/health](https://rutamotor.onrender.com/api/health) |
| Repositorio | [Dairy-Mod/RutaMotor](https://github.com/Dairy-Mod/RutaMotor) |

La ruta `/api/health` es pública y devuelve `status: "ok"` cuando el backend está conectado a MongoDB. Las rutas de datos requieren iniciar sesión. La raíz del backend no tiene una página de bienvenida; usa `/api/health` para comprobar su estado.

## Ejecución local

Requisitos: Node.js 22.12 o superior (probado con Node 24), npm, acceso a internet y una conexión válida a MongoDB Atlas. El usuario de base de datos debe tener permisos de lectura y escritura sobre la base elegida, y Atlas debe permitir el acceso desde la IP del equipo.

Para obtener el proyecto desde el repositorio:

```powershell
git clone https://github.com/Dairy-Mod/RutaMotor.git
cd RutaMotor
```

La raíz del repositorio corresponde a la carpeta `PF` dentro del proyecto de incidentes. Si ya tienes esa carpeta, ejecuta los comandos desde `PF`; si clonaste el repositorio, ejecútalos desde `RutaMotor`.

Instala las dependencias y prepara los archivos de entorno:

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

Abre **http://127.0.0.1:5173**. Salud de la API local: http://127.0.0.1:3001/api/health. Para HTTP local, conserva `COOKIE_SECURE=false` y permite los orígenes locales en `FRONTEND_ORIGINS`, como indica `Backend/.env.example`.

- `setup` copia los ejemplos de entorno únicamente si no existe el archivo `.env`.
- `seed` agrega una cuenta, 4 categorías, 7 especialidades, 11 negocios, 11 ubicaciones y 1 zona. Se puede repetir: no limpia colecciones, no cambia contraseñas de usuarios existentes ni reemplaza registros.
- El nombre de la base de uso normal se toma de la URI configurada. El backend también admite `MONGODB_DB_NAME` para seleccionar otra base; las pruebas lo utilizan para aislar sus datos. Mantén una base exclusiva de RutaMotor, separada del sistema de incidentes.
- La carga se realiza en la base indicada por la configuración actual. Los datos de una base local no se transfieren automáticamente a Atlas: el seed crea los ejemplos faltantes; no migra los registros que hayas agregado manualmente.
- Los datos con “Demo” y sus coordenadas son ficticios, no establecimientos verificados. Los teléfonos se dejan vacíos para evitar dirigir llamadas a personas reales.
- Detén ambos servidores con Ctrl+C.
- Al iniciar, el backend muestra en consola el host, puerto, base conectada y listado de rutas de autenticación, CRUD y GeoJSON.
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

En desarrollo local, el frontend y el backend se ejecutan en el equipo. En la versión publicada, se ejecutan en Netlify y Render respectivamente. **Con Atlas se necesita internet para consultar y guardar datos**; la aplicación no incluye un modo de datos sin conexión. El mapa base de OpenStreetMap y la fuente tipográfica opcional de Google Fonts también requieren internet. Si falla la fuente se utiliza una del sistema; si falla el mapa base, se muestra un aviso. No se requiere una clave de Mapbox. La geolocalización pide permiso del navegador y funciona en localhost/127.0.0.1 y en el sitio publicado mediante HTTPS.

### Comprobar la conexión y los datos

Al ejecutar `npm run dev`, el backend conecta a MongoDB y prepara los índices antes de escuchar en el puerto 3001. Comprueba el mensaje de inicio y abre `http://127.0.0.1:3001/api/health`; una conexión activa devuelve `status: "ok"`.

En Atlas o MongoDB Compass, abre la base configurada y consulta `users`, `categories`, `specialties`, `businesses`, `locations` y `zones`. La colección `sessions` almacena las sesiones de acceso. Para comprobar la persistencia, crea o edita un lugar desde la app y actualiza la vista de documentos de `locations`.

Si aparece `bad auth : authentication failed`, revisa el usuario de base de datos, la contraseña y su codificación en la URI. Si aparece `querySrv ECONNREFUSED`, revisa `MONGODB_DNS_SERVERS`. Confirma también que Atlas permita la IP del equipo.

## Despliegue actual

```text
Navegador → Netlify: React y archivos estáticos
                    /api/* → Render: API Express → MongoDB Atlas
```

El navegador utiliza rutas relativas `/api`. En desarrollo las redirige el proxy de Vite; en producción las redirige `netlify.toml` hacia Render. Esto permite que las solicitudes y la cookie de sesión usen el dominio del frontend desde el navegador.

### Frontend en Netlify

La configuración está en `netlify.toml`, en la raíz del repositorio:

| Opción | Valor |
| --- | --- |
| Rama de despliegue | `main` |
| Directorio base | Raíz del repositorio |
| Comando de compilación | `npm run build` |
| Directorio publicado | `Frontend/dist` |
| Node.js | `24` |
| `VITE_API_URL` | `/api` |

`NODE_VERSION` y `VITE_API_URL` ya se declaran en `[build.environment]`. La regla `/api/*` apunta a `https://rutamotor.onrender.com/api/:splat` con estado 200 y `force = true`; debe permanecer antes de la regla general que sirve `index.html`. Si cambia el dominio del backend, actualiza esa dirección y vuelve a desplegar el frontend.

El backend se aloja en Render, por lo que este proyecto no requiere Netlify Functions. Las credenciales privadas de MongoDB se configuran en Render. Las variables `VITE_*` forman parte de la configuración pública del frontend.

### Backend en Render

El servicio utiliza la raíz del repositorio, con estos comandos:

| Opción | Valor |
| --- | --- |
| Comando de compilación/instalación | `npm ci` |
| Comando de inicio | `npm run start -w @rutamotor/backend` |
| Comprobación de salud | `/api/health` |

Configura las variables de entorno en el servicio de Render:

| Variable | Valor o propósito |
| --- | --- |
| `NODE_VERSION` | `24` |
| `HOST` | `0.0.0.0`, para aceptar conexiones del servicio publicado |
| `MONGODB_URI` | URI privada de Atlas con las credenciales codificadas y la base elegida |
| `FRONTEND_ORIGINS` | `https://rutamotor.netlify.app`, sin diagonal final |
| `COOKIE_SECURE` | `true`, para la sesión mediante HTTPS |
| `SESSION_HOURS` | Opcional; duración de sesión, 12 horas por defecto |
| `MONGODB_DNS_SERVERS` | Opcional; servidores alternativos si falla la resolución SRV |

El backend utiliza el `PORT` proporcionado por Render. Los `.env` locales no se suben al repositorio ni se copian automáticamente al servicio publicado.

Atlas debe permitir los rangos de IP de salida del servicio de Render. Se consultan en **Connect → Outbound** y se agregan a la **IP Access List** del proyecto de Atlas, conservando la notación CIDR. La IP del equipo local y los rangos de Render se autorizan por separado.

Si vas a trabajar también desde el equipo local, puedes usar esta lista de orígenes:

```dotenv
FRONTEND_ORIGINS=https://rutamotor.netlify.app,http://127.0.0.1:5173,http://localhost:5173
```

Después de cambiar variables del servicio, vuelve a desplegarlo. Para aplicar cambios del código, súbelos al repositorio y utiliza **Manual Deploy → Deploy latest commit**, o el despliegue automático si está habilitado.

### Comprobación de la versión publicada

1. Abre el sitio de Netlify desde una ventana de incógnito para comprobar su acceso público. Si Netlify muestra una página de acceso privado, configura la visibilidad del proyecto como pública con **Make public**.
2. Consulta `/api/health` desde el dominio de Netlify y desde Render; ambas respuestas deben ser JSON con `status: "ok"`.
3. Inicia sesión o crea una cuenta y verifica que la sesión se conserve al recargar la página.
4. Crea una ubicación de prueba, edítala desde su popup, comprueba su persistencia y elimina el registro de prueba.

Si `/api/health` responde con HTML en lugar de JSON, revisa la visibilidad de Netlify, las reglas de redirección y que `netlify.toml` esté incluido en el despliegue. Un error 403 de la API puede indicar que `FRONTEND_ORIGINS` no incluye el origen exacto del sitio.

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

## Negocios y ubicaciones

Un **negocio** representa al establecimiento o empresa y guarda su nombre, teléfono, horario, sitio web y especialidades. Se administra desde **Administración → Negocios**.

Una **ubicación** es un punto concreto del mapa asociado a un negocio. Guarda nombre del lugar, descripción, dirección, categoría, estado, coordenadas y referencia al usuario creador. Se registra haciendo clic en el mapa y seleccionando un negocio existente.

Un negocio puede tener varias ubicaciones, por ejemplo una sucursal Centro y otra Norte. En el modelo actual, teléfono, horario, sitio web y especialidades pertenecen al negocio y se comparten entre sus ubicaciones. Los ejemplos iniciales utilizan nombres parecidos para ambas entidades porque se cargó una ubicación por negocio.

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
| Despliegue | Frontend publicado en Netlify, backend en Render y datos en Atlas |
| Repositorio público | Creado y publicado en GitHub; enlace al inicio de este README |

La tabla muestra nombre, descripción, categoría por nombre, negocio por nombre, estado, dirección, contacto, horario, especialidades, sitio, tipo de geometría, longitud, latitud, usuario creador por nombre y fechas. Los IDs técnicos no aparecen.

La actualización inmediata cubre los cambios realizados desde la sesión actual. No se implementó sincronización por WebSocket entre varios navegadores; vuelve a entrar al mapa o usa “Reintentar” tras errores para consultar cambios externos.

Si una operación se guarda correctamente pero después falla la recarga de catálogos, se confirma el guardado y se cierra el formulario. El aviso **Reintentar** repite la lectura de datos, sin volver a crear el registro. Los errores de la escritura conservan el formulario abierto para corregirlo. Las respuestas y errores de geolocalización pendientes se ignoran al salir de la vista del mapa.

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
    public/         Archivos estáticos
    dist/           Compilación generada para Netlify; ignorada en Git
    index.html      Entrada del frontend
    vite.config.js  React, servidor local y proxy /api
  e2e/
    app.spec.mjs          Recorridos principales de la aplicación
    regressions.spec.mjs  Fallos de recarga y respuestas tardías de ubicación
    teardown.mjs         Limpieza de la base temporal de navegador
  scripts/          Entorno, arranque y servidor aislado de pruebas
  package.json      Workspaces Backend/Frontend y comandos generales
  netlify.toml      Compilación y redirecciones de producción
  playwright.config.mjs  Configuración de pruebas de navegador
```

El router CRUD compartido reduce repetición; cada entidad conserva su servicio y modelo propios. Las rutas solo reciben datos y devuelven HTTP. Los servicios validan relaciones, aplican filtros y consultan MongoDB. `AppError` y el middleware final unifican los errores.

`Backend/src/app.js` configura Express sin abrir un puerto. `Backend/src/index.js` conecta la base de datos, prepara los índices, inicia la escucha y muestra las rutas disponibles. El código editable de la interfaz está en `Frontend/src/`; `npm run build` genera `Frontend/dist/`.

GeoJSON usa siempre **[longitud, latitud]**. Leaflet recibe **[latitud, longitud]**; la conversión ocurre en el componente de mapa. Las zonas admiten un anillo exterior cerrado, entre 3 y 500 vértices, sin repeticiones, cruces ni superficie nula.

Las eliminaciones con referencias activas devuelven 409: primero se reasignan/eliminan ubicaciones o se retira la especialidad del negocio. Esto evita referencias huérfanas durante las operaciones habituales. Las comprobaciones no constituyen transacciones distribuidas para escrituras simultáneas.

## API REST

Todas las rutas de entidades requieren la cookie de sesión.

Direcciones base según el entorno:

| Entorno | Base de la API |
| --- | --- |
| Local | `http://127.0.0.1:3001/api` |
| Publicado, a través del frontend | `https://rutamotor.netlify.app/api` |
| Backend directo | `https://rutamotor.onrender.com/api` |

| Ruta | Métodos |
| --- | --- |
| /api/health | GET, público |
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

### Probar en Thunder Client o REST Client

1. Envía `GET /api/health` para comprobar la conexión.
2. Envía `POST /api/auth/login` con un cuerpo JSON que incluya `email` y `password` de una cuenta de RutaMotor.
3. Conserva la cookie `rutamotor_session` recibida y envía `GET /api/auth/me`.
4. Consulta `/api/locations`, `/api/categories`, `/api/businesses`, `/api/specialties` y `/api/zones` con la sesión activa.
5. Para cerrar esa sesión, envía `POST /api/auth/logout` con un cuerpo JSON `{}`.

Mantén el mismo dominio para el login y las demás solicitudes. Si necesitas enviar la cookie manualmente, utiliza el encabezado `Cookie: rutamotor_session=<valor_recibido>`. La API usa autenticación por cookie; no requiere un token Bearer. Hay ejemplos completos de solicitudes en `Backend/request/rutamotor.http`, cuyo `baseUrl` puedes cambiar para probar la versión publicada.

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
- `e2e/app.spec.mjs` cubre acceso, sesión, CRUD, mapa y tabla, polígonos, guía, vista móvil, cercanía y exportación GeoJSON.
- `e2e/regressions.spec.mjs` comprueba que los fallos de recarga no repitan operaciones guardadas, que los errores de escritura permitan corregir el formulario y que las respuestas tardías de geolocalización se ignoren al cambiar de vista.

## Fuentes técnicas y guía

- [Vite](https://vite.dev/guide/), [Leaflet](https://leafletjs.com/reference.html), [Geoman](https://geoman.io/docs/leaflet/modes/draw-mode).
- [GeoJSON en Mongoose](https://mongoosejs.com/docs/geojson.html) y [referencias con populate](https://mongoosejs.com/docs/populate.html).
- Los textos e ilustraciones de la guía son orientativos, elaborados para esta app. Las referencias del fabricante están accesibles dentro de la vista Guía. No sustituyen el manual del vehículo ni una revisión profesional.

## Estado de entrega

| Elemento | Estado |
| --- | --- |
| Frontend | Publicado en Netlify; enlace al inicio del documento |
| Backend | Publicado en Render, con `/api/health` disponible |
| Base de datos | MongoDB Atlas configurado para la aplicación |
| Repositorio | Creado y publicado en GitHub, con frontend, backend, README y `.env.example` |
| Cuenta de demostración | Se carga mediante el seed y sus valores de ejemplo están documentados; entrega las credenciales que correspondan a la cuenta existente en la base de revisión |
| Reporte PDF | Pendiente; pospuesto por indicación del usuario |

El reporte de desarrollo debe incluir portada institucional, problemática y solución, desarrollo paso a paso, estructura del backend, modelos y relaciones, capturas de cada requisito funcionando y una conclusión por integrante. Los `.env` reales y sus credenciales quedan excluidos mediante `.gitignore`.

Las capturas generadas durante las pruebas son material de verificación y no sustituyen el reporte de desarrollo. Para la revisión, los integrantes deben conocer y poder explicar el código y los complementos utilizados.
