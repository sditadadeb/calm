# Deploy ISL Admin en Render (con PostgreSQL)

Render proporciona **PostgreSQL** y lo conecta al backend mediante `DATABASE_URL`. El blueprint define todo en un solo archivo.

## Opción A: Deploy con Blueprint (recomendado)

1. **Subir el código** a GitHub (branch `ISL` en el repo que uses).
2. En [render.com](https://render.com): **Dashboard** → **New +** → **Blueprint**.
3. Conectar el repositorio y seleccionar el branch **ISL**.
4. Render detectará `render.yaml` y creará:
   - **PostgreSQL** (`isl-db`)
   - **Web Service** backend (`isl-admin-api`) con Docker
   - **Static Site** frontend (`isl-admin-frontend`)
5. En el backend, configurar **Environment Variables** (secretos):
   - `ADMIN_PASSWORD`: contraseña del usuario admin.
   - `AWS_S3_METADATA_ACCESS_KEY` / `AWS_S3_METADATA_SECRET_KEY` (si usás S3).
   - `AWS_S3_TRANSCRIPTIONS_ACCESS_KEY` / `AWS_S3_TRANSCRIPTIONS_SECRET_KEY` (si usás S3).
   - `OPENAI_API_KEY`: clave de OpenAI.
   - `CORS_ALLOWED_ORIGINS`: URL del frontend en Render (ej: `https://isl-admin-frontend.onrender.com`).
6. En el frontend, configurar:
   - `VITE_API_URL`: URL del backend (ej: `https://isl-admin-api.onrender.com/api`).
7. **Deploy**: Render construye y levanta todo. La primera vez puede tardar varios minutos.

## Opción B: Crear servicios a mano

### 1. Base de datos PostgreSQL

1. **New +** → **PostgreSQL**.
2. Nombre: `isl-db`, plan Free.
3. Crear y anotar la **Internal Database URL** (o usar la que Render muestra en el panel).

### 2. Backend (Web Service)

1. **New +** → **Web Service**.
2. Repo y branch **ISL**, root: (dejar por defecto).
3. **Environment**: Docker.
4. **Dockerfile Path**: `./backend/Dockerfile`.
5. **Variables de entorno**:
   - `DATABASE_URL`: pegar la **Internal Database URL** del paso 1 (o enlazar desde el panel de la DB).
   - `SPRING_JPA_DATABASE_PLATFORM`: `org.hibernate.dialect.PostgreSQLDialect`
   - `JWT_SECRET`: generar con `openssl rand -base64 64`.
   - `ADMIN_PASSWORD`: tu contraseña.
   - Resto (S3, OpenAI, CORS) según necesites.
6. **Health Check Path**: `/actuator/health`.
7. Crear el servicio.

### 3. Frontend (Static Site)

1. **New +** → **Static Site**.
2. Mismo repo, branch **ISL**.
3. **Root Directory**: `frontend`.
4. **Build Command**: `npm install && npm run build`.
5. **Publish Directory**: `dist`.
6. **Variable**: `VITE_API_URL` = URL del backend + `/api` (ej: `https://isl-admin-api.onrender.com/api`).

### 4. CORS

En el backend, en variables de entorno, poner:
`CORS_ALLOWED_ORIGINS` = URL del frontend (ej: `https://isl-admin-frontend.onrender.com`).

## Base de datos

- **PostgreSQL** se crea automáticamente con el Blueprint o manualmente.
- El backend usa `DATABASE_URL` (formato `postgres://` o `postgresql://`) y lo convierte a JDBC.
- Con `spring.jpa.hibernate.ddl-auto=update`, las tablas se crean o actualizan al arrancar.

## Notas

- **Plan Free**: el backend puede dormirse tras ~15 min sin uso; el primer request puede tardar ~30 s.
- **JWT_SECRET**: en producción usar un valor largo y aleatorio (`openssl rand -base64 64`).
- **Credenciales**: no subas `application-local.properties` ni claves al repo.
