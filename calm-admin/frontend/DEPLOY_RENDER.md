# Despliegue en Render - Banca Analytics

## Opción 1: Static Site (Recomendado)

### Pasos:

1. **Ir a Render Dashboard**
   - https://dashboard.render.com

2. **Crear nuevo Static Site**
   - Click en "New +" → "Static Site"

3. **Conectar repositorio**
   - Conecta tu repositorio de GitHub/GitLab
   - O usa "Public Git repository" con la URL del repo

4. **Configurar el build**
   - **Name:** `banca-analytics`
   - **Root Directory:** `calm-admin/frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

5. **Configurar Redirects (importante para SPA)**
   - En la pestaña "Redirects/Rewrites"
   - Agregar regla:
     - **Source:** `/*`
     - **Destination:** `/index.html`
     - **Action:** `Rewrite`

6. **Deploy**
   - Click en "Create Static Site"

---

## Opción 2: Deploy manual (sin repositorio)

Si solo quieres subir los archivos estáticos:

1. La carpeta `dist/` contiene todos los archivos necesarios
2. Puedes subir estos archivos a cualquier hosting estático:
   - Netlify (drag & drop)
   - Vercel
   - GitHub Pages
   - Cloudflare Pages

---

## Credenciales de Demo

- **Usuario:** `admin`
- **Contraseña:** `admin123`

Otros usuarios disponibles:
- `usuario` / `user123`
- `ejecutivo` / `ejecutivo123`

---

## Notas

- Esta es una demo con **datos fake** - no requiere backend
- Todos los datos son generados localmente en el frontend
- El favicon es un icono de banco en azul
