# Deploy en Render — Banco de Occidente Admin

## Variables de entorno necesarias

### Backend (`banco-occidente-api`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `ADMIN_PASSWORD` | Contraseña del usuario admin | `cambiar_esto_seguro` |
| `AWS_S3_METADATA_ACCESS_KEY` | Access key para bucket metadata | `AKIAT...` |
| `AWS_S3_METADATA_SECRET_KEY` | Secret key para bucket metadata | `...` |
| `AWS_S3_TRANSCRIPTIONS_ACCESS_KEY` | Access key para bucket transcripciones | `AKIAT...` |
| `AWS_S3_TRANSCRIPTIONS_SECRET_KEY` | Secret key para bucket transcripciones | `...` |
| `OPENAI_API_KEY` | API key de OpenAI | `sk-proj-...` |
| `CORS_ALLOWED_ORIGINS` | URL del frontend en Render | `https://banco-occidente-frontend.onrender.com` |
| `JWT_SECRET` | Se genera automáticamente | *(auto)* |

> Variables opcionales:
> - `OPENAI_MODEL` — modelo a usar (default: `gpt-4o-mini`)
> - `ADMIN_USERNAME` — (default: `admin`)

### Frontend (`banco-occidente-frontend`)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_API_URL` | URL completa del backend + `/api` | `https://banco-occidente-api.onrender.com/api` |

---

## Pasos para hacer el deploy

### 1. Deploy via Blueprint (recomendado)

1. Ir a [render.com](https://render.com) → **New +** → **Blueprint**
2. Conectar el repositorio `sditadadeb/calm`
3. Render detecta el `render.yaml` en la raíz
4. Completar las variables marcadas como `sync: false`
5. Click **Apply**

### 2. Deploy manual (alternativa)

#### Backend

1. Render → **New +** → **Web Service**
2. Conectar repo `sditadadeb/calm`
3. Configurar:
   - **Root Directory:** *(vacío, usar raíz)*
   - **Environment:** `Docker`
   - **Dockerfile Path:** `./calm-admin/backend/Dockerfile`
   - **Docker Context:** `./calm-admin/backend`
4. Agregar variables de entorno del backend (tabla arriba)
5. Click **Create Web Service**
6. Esperar ~5-10 min. Copiar la URL (`https://banco-occidente-api.onrender.com`)

#### Frontend

1. Render → **New +** → **Static Site**
2. Conectar el mismo repo
3. Configurar:
   - **Root Directory:** `calm-admin/frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Agregar variable `VITE_API_URL=https://banco-occidente-api.onrender.com/api`
5. Click **Create Static Site**

### 3. Actualizar CORS del backend

Una vez tengas la URL del frontend, ir al backend en Render:
- Configuración → Environment → `CORS_ALLOWED_ORIGINS` = `https://banco-occidente-frontend.onrender.com`

---

## Base de datos

Por defecto se usa **H2 en memoria** (los datos se pierden al reiniciar el servicio).

Para persistencia real, agregar un **PostgreSQL** de Render:
1. Render → **New +** → **PostgreSQL**
2. Copiar el **Internal Database URL**
3. Agregar en el backend:
   - `SPRING_DATASOURCE_URL` = `jdbc:postgresql://...` (reemplazar `postgres://` por `jdbc:postgresql://`)
   - `DATABASE_USERNAME` = usuario de la DB
   - `DATABASE_PASSWORD` = contraseña de la DB
   - `HIBERNATE_DIALECT` = `org.hibernate.dialect.PostgreSQLDialect`

---

## Notas importantes

- **Free tier:** Los servicios se duermen tras 15 min sin actividad. El primer request tarda ~30 seg en "despertar".
- **Datos vacíos:** Después de cada deploy, hacer click en **Sincronizar S3** desde el dashboard.
- **CORS:** Verificar que `CORS_ALLOWED_ORIGINS` tenga exactamente la URL del frontend (sin `/` al final).
