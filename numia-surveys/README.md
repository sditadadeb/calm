# Numia Surveys

Plataforma de encuestas empresarial estilo Qualtrics.

## Características

### 🎯 Gestión de Encuestas
- Builder de encuestas drag & drop
- +15 tipos de preguntas (NPS, CSAT, CES, opciones múltiples, escalas, etc.)
- Lógica condicional y bifurcación
- Personalización de branding
- Mensajes de bienvenida y agradecimiento

### 👥 Multi-tenancy
- Gestión de compañías
- Usuarios con roles (Admin, Manager, Analyst, Viewer)
- Límites por plan

### 📊 Analytics y Métricas
- Dashboard con KPIs en tiempo real
- NPS, CSAT, CES automáticos
- Análisis por pregunta
- Exportación de datos

### 📧 Distribución Multicanal
- **Email**: Integración con Mailgun
- **SMS**: Integración con Bulk SMS
- **WhatsApp**: Próximamente
- Tracking de entregas, aperturas y respuestas

### 📋 Gestión de Contactos
- Listas de contactos
- Importación masiva
- Tracking de engagement

## Tecnologías

### Backend
- Java 17 + Spring Boot 3.2
- Spring Security + JWT
- Spring Data JPA
- PostgreSQL / H2

### Frontend
- React 18 + Vite
- Tailwind CSS
- Zustand (state management)
- Recharts (visualizaciones)
- dnd-kit (drag & drop)

## Inicio Rápido

### Desarrollo Local

1. **Clonar repositorio**
```bash
cd numia-surveys
```

2. **Backend**
```bash
cd backend
./mvnw spring-boot:run
```

3. **Frontend**
```bash
cd frontend
npm install
npm run dev
```

4. **Acceder**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- H2 Console: http://localhost:8080/h2-console

### Docker

```bash
# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Levantar servicios
docker-compose up -d
```

## Configuración

### Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `JWT_SECRET` | Clave secreta para JWT (min 32 chars) |
| `MAILGUN_API_KEY` | API Key de Mailgun |
| `MAILGUN_DOMAIN` | Dominio configurado en Mailgun |
| `MAILGUN_FROM` | Email de envío |
| `BULKSMS_TOKEN_ID` | Token ID de Bulk SMS |
| `BULKSMS_TOKEN_SECRET` | Token Secret de Bulk SMS |
| `SURVEY_BASE_URL` | URL base para encuestas públicas |

### Configurar Mailgun

1. Crear cuenta en [Mailgun](https://www.mailgun.com/)
2. Verificar dominio
3. Obtener API Key
4. Configurar webhooks para tracking

### Configurar Bulk SMS

1. Crear cuenta en [BulkSMS](https://www.bulksms.com/)
2. Obtener credenciales API
3. Cargar créditos

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Usuario actual

### Encuestas
- `GET /api/surveys` - Listar encuestas
- `POST /api/surveys` - Crear encuesta
- `GET /api/surveys/{id}` - Obtener encuesta
- `PUT /api/surveys/{id}` - Actualizar encuesta
- `POST /api/surveys/{id}/publish` - Publicar
- `POST /api/surveys/{id}/close` - Cerrar

### Preguntas
- `POST /api/surveys/{id}/questions` - Agregar pregunta
- `PUT /api/surveys/questions/{id}` - Actualizar pregunta
- `DELETE /api/surveys/questions/{id}` - Eliminar pregunta

### Respuestas
- `POST /api/responses/submit/{publicId}` - Enviar respuesta (público)
- `GET /api/responses/survey/{id}` - Obtener respuestas

### Analytics
- `GET /api/analytics/dashboard` - Métricas generales
- `GET /api/analytics/surveys/{id}` - Analytics de encuesta

### Distribuciones
- `POST /api/distributions` - Crear distribución
- `GET /api/distributions` - Listar distribuciones
- `POST /api/distributions/{id}/send` - Enviar

### Contactos
- `GET /api/contacts/lists` - Listas de contactos
- `POST /api/contacts/lists` - Crear lista
- `POST /api/contacts/lists/{id}/contacts` - Agregar contacto
- `POST /api/contacts/lists/{id}/import` - Importar contactos

## Despliegue

### Render.com

1. Fork del repositorio
2. Crear nuevo Blueprint en Render
3. Seleccionar repositorio
4. Configurar variables de entorno
5. Deploy

### Docker Production

```bash
docker-compose -f docker-compose.yml up -d --build
```

## Licencia

MIT

