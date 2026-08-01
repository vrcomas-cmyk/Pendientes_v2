# Conectar Google Calendar (time-blocking / vista Agenda)

La app ya tiene todo el backend desplegado (tabla `pnp_google_calendar` con RLS
deny-all + la Edge Function `google-calendar` en el proyecto Supabase
`fiplfsuhsqibzrpvjvbx`). Lo único que falta son las credenciales de Google Cloud,
que **no se pueden generar automáticamente** — hay que crearlas una vez desde la
consola de Google.

Mientras no estén configuradas, la vista **Agenda** (dentro de Pendientes) funciona
en modo degradado: solo local, sin bloques de "ocupado" ni eventos reales.

## 1. Crear el proyecto y habilitar la API

1. Ve a [Google Cloud Console](https://console.cloud.google.com/) e inicia sesión con la
   cuenta de Google que quieras usar (puede ser una nueva, "sin costo": la API de
   Calendar es gratuita para este volumen de uso).
2. Crea un proyecto nuevo (o usa uno existente).
3. En el menú, ve a **APIs y servicios → Biblioteca**, busca **Google Calendar API**
   y haz clic en **Habilitar**.

## 2. Configurar la pantalla de consentimiento OAuth

1. **APIs y servicios → Pantalla de consentimiento de OAuth**.
2. Tipo de usuario: **Externo** (a menos que uses Google Workspace).
3. Rellena nombre de la app, correo de soporte y correo de contacto del desarrollador.
4. En **Alcances (scopes)**, añade:
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/userinfo.email`
5. En **Usuarios de prueba** (mientras la app no esté "publicada"), añade tu propio
   correo de Google — si no, Google bloqueará el login con "app no verificada".

## 3. Crear las credenciales OAuth

1. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**.
2. Tipo de aplicación: **Aplicación web**.
3. **Orígenes autorizados de JavaScript**: la URL donde corre la PWA
   (ej. `https://tu-dominio.com`, y también `http://localhost:5173` si pruebas en local).
4. **URI de redirección autorizados**: exactamente la misma URL raíz de la app
   (ej. `https://tu-dominio.com/` y `http://localhost:5173/`) — la app vuelve a la
   misma página tras el consentimiento y lee el `?code=` de la URL.
5. Al crear, Google te muestra el **Client ID** y el **Client Secret**. Guárdalos.

## 4. Dónde pegar cada credencial

- **Client ID** (no es secreto, es público): pégalo en
  `src/lib/googleCalendarConfig.ts`, en la constante `HARDCODED_CLIENT_ID`, y
  vuelve a desplegar la app. (Alternativa sin tocar código: se puede exponer una
  pantalla de configuración similar a la de Supabase que lo guarde en
  `localStorage` bajo la clave `google_client_id` — hoy ese `localStorage` ya es
  el *fallback* si `HARDCODED_CLIENT_ID` queda vacío.)
- **Client Secret** (NUNCA debe ir en el código ni en el repo): se configura como
  *secret* de la Edge Function `google-calendar` en Supabase:
  - Dashboard de Supabase → tu proyecto → **Edge Functions → google-calendar → Secrets**,
    añade `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.
  - O con la CLI de Supabase (si tienes el proyecto enlazado localmente):
    ```
    supabase secrets set GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
    supabase secrets set GOOGLE_CLIENT_SECRET=xxxxxxxxxxxx
    ```

No hace falta volver a desplegar la función tras cambiar los secrets — los lee en
cada invocación con `Deno.env.get(...)`.

## 5. Probar la conexión (una cuenta o varias)

La app soporta conectar **varias cuentas de Google a la vez**: todo lo que se agenda desde
la Agenda se crea/actualiza/borra como evento real en **todas** las cuentas conectadas (espejo),
no en una sola elegida.

1. En la app (con sincronización/sesión de Supabase activa, no en "modo local"),
   abre el menú de sincronización y pulsa **Google Calendar**.
2. En el diálogo, pulsa **Conectar cuenta de Google** y acepta los permisos.
3. Vuelves a la app; debería aparecer un mensaje "Google Calendar conectado: tu@correo.com"
   y esa cuenta queda listada en el diálogo.
4. Para añadir una **segunda cuenta**: vuelve a abrir el diálogo y pulsa
   **Conectar otra cuenta** — Google te mostrará el selector de cuentas (gracias a
   `prompt=consent select_account`) para que elijas la otra, en vez de reusar la
   primera en silencio.
5. Ve a **Pendientes → Agenda**, arrastra un pendiente de hoy a una franja horaria
   y confirma que el evento se creó en **ambos** Google Calendar reales. Cada bloque
   de "ocupado" en la Agenda muestra un punto de color distinto según de qué cuenta viene.
6. Para quitar una cuenta, ábrela en el diálogo y pulsa la "X" de esa fila — las
   demás cuentas y los eventos ya creados en ellas no se ven afectados.

## Notas de seguridad

- El `refresh_token` y el `access_token` de Google nunca llegan al navegador: se
  guardan en la tabla `pnp_google_calendar`, que tiene RLS activo **sin políticas**
  (deny-all) — ni siquiera el propio usuario dueño de la fila puede leerla
  directamente; solo la Edge Function (que usa la `service_role` key) puede.
- Si alguna vez quieres revocar el acceso por completo (además de "Desconectar" en
  la app), puedes hacerlo desde <https://myaccount.google.com/permissions>.
