# Deploy en Render - CALM Admin

## Paso 1: Subir código a GitHub

```bash
cd calm-admin
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

## Paso 2: Deploy del Backend (Web Service)

1. Ir a [render.com](https://render.com) y crear cuenta
2. Click en **New +** → **Web Service**
3. Conectar tu repositorio de GitHub
4. Configurar:
   - **Name:** `calm-admin-api`
   - **Root Directory:** `backend`
   - **Environment:** `Docker`
   - **Instance Type:** Free (o el que prefieras)

5. **Environment Variables** (agregar todas estas):

| Variable | Valor |
|----------|-------|
| `JWT_SECRET` | (generar uno largo y random) |
| `ADMIN_PASSWORD` | `tu_password_seguro` |
| `AWS_S3_METADATA_ACCESS_KEY` | `tu_access_key_metadata` |
| `AWS_S3_METADATA_SECRET_KEY` | `tu_secret_key_metadata` |
| `AWS_S3_TRANSCRIPTIONS_ACCESS_KEY` | `tu_access_key_transcriptions` |
| `AWS_S3_TRANSCRIPTIONS_SECRET_KEY` | `tu_secret_key_transcriptions` |
| `OPENAI_API_KEY` | `tu_openai_api_key` |
| `CORS_ALLOWED_ORIGINS` | `https://calm-admin-frontend.onrender.com` |

6. Click **Create Web Service**
7. Esperar que buildee (~5-10 min)
8. Copiar la URL del backend (ej: `https://calm-admin-api.onrender.com`)

## Paso 3: Deploy del Frontend (Static Site)

1. En Render, click **New +** → **Static Site**
2. Conectar el mismo repositorio
3. Configurar:
   - **Name:** `calm-admin-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. **Environment Variables**:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://calm-admin-api.onrender.com/api` |

5. Click **Create Static Site**

## Paso 4: Actualizar CORS del Backend

Una vez tengas la URL del frontend, volvé al backend y actualizá:
- `CORS_ALLOWED_ORIGINS` = `https://calm-admin-frontend.onrender.com`

## Paso 5: Verificar

1. Ir a `https://calm-admin-frontend.onrender.com`
2. Login con `admin` / `tu_password_seguro`
3. Click en "Sincronizar S3" para importar datos

## Notas Importantes

- **Free tier:** Los servicios se duermen después de 15 min de inactividad. El primer request tarda ~30 seg en despertar.
- **Base de datos:** Usamos H2 file-based. Los datos persisten pero se pierden si el servicio se reconstruye. Para producción real, usá PostgreSQL.
- **JWT Secret:** Generá uno seguro con: `openssl rand -base64 64`

## Troubleshooting

- **CORS error:** Verificá que `CORS_ALLOWED_ORIGINS` tenga la URL exacta del frontend
- **401 Unauthorized:** El JWT expiró, volvé a loguearte
- **Datos vacíos:** Hacé click en "Sincronizar S3" después del deploy
