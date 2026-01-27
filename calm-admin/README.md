# CALM Admin - Panel de Análisis de Ventas

Panel de administración para análisis de transcripciones de atenciones físicas de vendedores en sucursales de CALM (empresa de colchones).

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    CALM ADMIN DASHBOARD                      │
├─────────────────────────────────────────────────────────────┤
│  S3 Buckets          Backend (Spring Boot)      Frontend    │
│  ┌──────────┐       ┌─────────────────────┐   ┌──────────┐ │
│  │vonage-   │──────▶│ • S3 Service        │   │ React +  │ │
│  │pruebas   │       │ • ChatGPT Analyzer  │◀─▶│ Vite     │ │
│  │(metadata)│       │ • REST API          │   │          │ │
│  └──────────┘       │ • Cache DB (H2)     │   │ Dashboard│ │
│  ┌──────────┐       └─────────────────────┘   │ Métricas │ │
│  │poc-video │              │                   │ Filtros  │ │
│  │-aws      │──────────────┘                   └──────────┘ │
│  │(transcr.)│                                               │
│  └──────────┘                                               │
└─────────────────────────────────────────────────────────────┘
```

## ✨ Funcionalidades

### Dashboard
- Métricas generales: total atenciones, ventas, sin venta, conversión
- Gráficos de rendimiento por vendedor y sucursal
- Razones de no venta (gráfico de torta)
- Rankings de vendedores y sucursales

### Transcripciones
- Listado completo con filtros avanzados
- Detalle con análisis de IA
- Análisis individual o masivo

### Análisis con IA (ChatGPT)
- Determinación automática de venta/no venta
- Razón de no venta categorizada
- Productos discutidos
- Objeciones del cliente
- Puntuación del vendedor (1-10)
- Fortalezas y debilidades
- Sugerencias de mejora

### Filtros disponibles
- Por vendedor
- Por sucursal
- Por resultado (venta/sin venta)
- Por rango de fechas
- Por puntuación mínima

## 🚀 Instalación

### Requisitos
- Java 17+
- Node.js 18+
- Maven 3.8+

### Backend

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

El backend estará disponible en `http://localhost:8080`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

## ⚙️ Configuración

### Variables de entorno

Edita `backend/src/main/resources/application.properties`:

```properties
# OpenAI API Key para análisis con ChatGPT
openai.api.key=sk-tu-api-key-aqui

# O usa variable de entorno
# export OPENAI_API_KEY=sk-tu-api-key
```

### Credenciales AWS S3

Las credenciales de S3 ya están configuradas en `application.properties`:
- Bucket metadata: `vonage-pruebas`
- Bucket transcripciones: `poc-video-aws`

## 📊 API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/dashboard` | Métricas del dashboard |
| GET | `/api/transcriptions` | Lista transcripciones (con filtros) |
| GET | `/api/transcriptions/{id}` | Detalle de transcripción |
| POST | `/api/transcriptions/{id}/analyze` | Analizar con ChatGPT |
| POST | `/api/sync` | Sincronizar desde S3 |
| GET | `/api/sellers` | Lista de vendedores |
| GET | `/api/branches` | Lista de sucursales |

## 🎯 Categorías de No Venta

El sistema categoriza automáticamente las razones de no venta:
- Precio alto
- Comparando opciones
- Indecisión
- Sin stock
- Financiación
- Tiempo de entrega
- Medidas
- Solo mirando
- Otro

## 📱 Screenshots

El dashboard incluye:
- Vista principal con KPIs
- Gráficos interactivos
- Tabla de transcripciones
- Detalle con análisis completo
- Vistas por vendedor y sucursal

## 🔄 Sincronización automática

El sistema sincroniza automáticamente:
- Cada 30 minutos: nuevas transcripciones desde S3
- Cada 1 hora: análisis de transcripciones pendientes

También puedes forzar sincronización manual desde el botón "Sincronizar S3" en el sidebar.

## 📄 Licencia

Proyecto interno CALM - Todos los derechos reservados.

