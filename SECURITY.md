# Revisión de seguridad (estilo pentest) - ISL Admin

## Credenciales por defecto

- **Usuario:** `Admin` (configurable con `ADMIN_USERNAME`)
- **Clave por defecto (solo desarrollo):** definida en configuración. **En producción es obligatorio** definir `ADMIN_PASSWORD` por variable de entorno y no usar la por defecto.

---

## Medidas implementadas

### Autenticación y sesión

| Aspecto | Estado | Detalle |
|--------|--------|---------|
| Contraseñas | OK | BCrypt con cost 12. No se almacenan en claro. |
| JWT | OK | HS512, expiración configurable (24h por defecto). En prod `JWT_SECRET` debe ser >= 256 bits y definido por env. |
| Mensaje de error en login | OK | "Credenciales inválidas" genérico (no se revela si el usuario existe). |
| Rate limiting login | OK | 5 intentos por IP en 60 s; bloqueo temporal. |

### Autorización y endpoints

| Aspecto | Estado | Detalle |
|--------|--------|---------|
| Rutas públicas | OK | Solo `/api/auth/**` y `/actuator/health`. Resto exige JWT. |
| H2 Console | OK | Solo habilitada en desarrollo; deshabilitada en prod. |
| Actuator | OK | En prod solo se expone `health`; sin detalles sensibles. |
| Admin único | OK | No se puede eliminar o degradar al último ADMIN. |

### Datos e inyección

| Aspecto | Estado | Detalle |
|--------|--------|---------|
| SQL | OK | JPA/Hibernate con consultas parametrizadas (`@Param`). |
| Validación entrada | OK | `@Valid`, `@NotBlank`, `@Size` en login (usuario 3–50, clave 6–100). |

### Headers y CORS

| Aspecto | Estado | Detalle |
|--------|--------|---------|
| CORS | OK | Orígenes desde config; en prod no se añade localhost. |
| XSS | OK | Headers X-XSS-Protection, Content-Type-Options. |
| Clickjacking | OK | X-Frame-Options (deny en prod). |
| Referrer | OK | Strict-Origin-When-Cross-Origin. |
| CSP | OK | Content-Security-Policy restrictiva. |
| Permissions-Policy | OK | Geolocation, micrófono y cámara deshabilitados. |

### Otros

| Aspecto | Estado | Detalle |
|--------|--------|---------|
| CSRF | N/A | API stateless con JWT; no hay sesión por cookie. |
| Logs | OK | No se registran contraseñas. Solo usuario e IP en login. |
| Stack traces en prod | OK | Desactivados (`server.error.include-stacktrace=never`). |
| Secretos en repo | OK | `application-local.properties` en .gitignore; prod usa env. |

---

## Recomendaciones para producción (Render)

1. **JWT_SECRET:** Generar con `openssl rand -base64 64` y configurarlo en Render.
2. **ADMIN_PASSWORD:** Definir en Render; no usar la por defecto.
3. **CORS_ALLOWED_ORIGINS:** Solo el origen del frontend (ej. `https://isl-admin-frontend.onrender.com`).
4. **HTTPS:** Render termina TLS; no exponer el backend por HTTP público.
5. **Base de datos:** Usar PostgreSQL de Render; conexión vía `DATABASE_URL` (no credenciales en código).

---

## Resumen

El proyecto aplica buenas prácticas de seguridad para una API REST con JWT: contraseñas hasheadas, rate limiting en login, headers de seguridad, CORS restrictivo en prod, actuator limitado y sin datos sensibles en logs ni en el repositorio. En producción es crítico configurar `JWT_SECRET` y `ADMIN_PASSWORD` por variable de entorno.
