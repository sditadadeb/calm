# Employee Performance Reports — Monorepo

Proyecto de ejemplo: backend (Spring Boot) y frontend (React + Vite) para generar informes de desempeño y exportarlos como PDF.

## ¿Qué hace este repositorio?
- Backend Spring Boot con endpoint POST `/api/report/pdf` que toma un JSON con los campos del empleado y devuelve un PDF generado a partir de una plantilla HTML.
- Frontend React (Vite) con un formulario estilizado para completar solo los datos del empleado (nombre, rol, periodo, rating, comentarios, metrics) y descargar un PDF que usa la plantilla del backend.

## Cómo ejecutar (Windows PowerShell)

1) Backend

```powershell
cd .\backend
# Necesitas Java 17+ y Maven instalados
mvn -DskipTests spring-boot:run

# Si prefieres construir el jar
# mvn -DskipTests package
# java -jar target\employee-performance-backend-0.0.1-SNAPSHOT.jar
```

El backend por defecto corre en http://localhost:8081

2) Frontend

```powershell
cd .\frontend
npm install
npm run dev
```

Abre la URL que muestre Vite (ej.: http://localhost:5173) y usa el formulario para completar los datos del empleado. Presiona "Descargar PDF" para generar el reporte.

## Contenido clave
- `backend/src/main/resources/templates/report.html` — plantilla HTML utilizada para crear el PDF. Llena los placeholders con valores del request.
- `frontend/src/App.jsx` — formulario web con preview, botón para cargar ejemplo y envío al backend.

## Notas y recomendaciones
- En dev la API permite CORS desde cualquier origen. En producción ajusta los orígenes permitidos.
- El motor de generación de PDF es OpenHTMLToPDF (openhtmltopdf-pdfbox). Si necesitas un PDF absolutamente idéntico a un documento oficial, súbeme el archivo que quieres replicar y lo ajustaré para que la plantilla sea lo más parecida posible (tipografías, márgenes, idiomas, firmas, etc.).

## Siguientes pasos sugeridos
- Añadir validaciones y manejo de campos vacíos
- Añadir firmas digitales (o imagen de firma) y marca de agua
- Guardar informes en una base de datos y ofrecer historial por empleado
- Crear tests E2E que abran la UI, envíen datos y validen la descarga
# Employee Performance Reports (Java + React)

This is a starter monorepo that contains a Spring Boot backend and a React frontend used to generate employee performance reports and export them to PDF.

Folders:
- `backend/` — Spring Boot service that renders HTML -> PDF and exposes a REST endpoint.
- `frontend/` — Vite + React app with a small form to submit employee data and request PDF downloads.

## Requirements
- Java 17+ and Maven
- Node 18+ and npm / pnpm

## Running locally (Windows PowerShell)

1. Start the backend

```powershell
cd .\backend
mvn -DskipTests spring-boot:run
# or: mvn -DskipTests package; java -jar target\employee-performance-backend-0.0.1-SNAPSHOT.jar
```

Backend runs by default on port 8081.

2. Start the frontend

Open a new terminal session:

```powershell
cd .\frontend
npm install
npm run dev
```

Then open the URL shown by Vite (usually http://localhost:5173) to use the UI.

## Generate a PDF from sample data

From project root in PowerShell (requires `curl` or `Invoke-WebRequest`):

Using curl (Git for Windows / Windows 11):

```powershell
curl -X POST "http://localhost:8081/api/report/pdf" -H "Content-Type: application/json" -d @.\backend\src\main\resources\sample\report-sample.json --output report.pdf
```

Alternatively with PowerShell native Invoke-RestMethod and saving bytes:

```powershell
$body = Get-Content -Raw -Path ".\backend\src\main\resources\sample\report-sample.json"
$resp = Invoke-RestMethod -Uri "http://localhost:8081/api/report/pdf" -Method Post -ContentType "application/json" -Body $body -OutFile .\report.pdf
```

## Tests

Execute backend tests:

```powershell
cd .\backend
mvn test
```

## Next steps / improvements
- Add authentication and authorization for sensitive reports.
- Create richer templates and company branding (logos, fonts).
- Add server-side validation and better error handling.
- Add E2E tests to verify the full UI -> API -> PDF flow.
