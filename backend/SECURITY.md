# 🔒 Guía de Seguridad - CALM Admin

## Variables de Entorno para Producción

Para ejecutar en producción, configurá las siguientes variables de entorno:

```bash
# Server
PORT=8080

# Database (usar PostgreSQL en producción)
DATABASE_URL=jdbc:postgresql://localhost:5432/calm_admin
DATABASE_DRIVER=org.postgresql.Driver
DATABASE_USERNAME=calm_user
DATABASE_PASSWORD=your_secure_database_password

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_METADATA_BUCKET=vonage-pruebas
AWS_METADATA_PREFIX=in-person-recording/
AWS_TRANSCRIPTIONS_BUCKET=poc-video-aws
AWS_TRANSCRIPTIONS_PREFIX=calm/transcripciones/

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini

# JWT Secret (generar con: openssl rand -base64 64)
JWT_SECRET=your_very_long_and_random_jwt_secret_at_least_256_bits
JWT_EXPIRATION=86400000

# Admin User
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password

# CORS - Tu dominio de producción
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_LOGIN=5
RATE_LIMIT_DURATION=60
```

## Ejecutar en Producción

```bash
# Con variables de entorno
export JWT_SECRET=$(openssl rand -base64 64)
export ADMIN_PASSWORD=tu_password_seguro
# ... más variables ...

# Ejecutar con perfil de producción
java -jar -Dspring.profiles.active=prod calm-admin.jar
```

## Checklist de Seguridad

- [ ] H2 Console deshabilitada (automático con perfil `prod`)
- [ ] JWT Secret fuerte y único (mínimo 256 bits)
- [ ] Password de admin cambiado del default
- [ ] CORS configurado solo para tu dominio
- [ ] HTTPS habilitado (via reverse proxy)
- [ ] Base de datos PostgreSQL o MySQL
- [ ] Credenciales NO hardcodeadas

## Headers de Seguridad Implementados

- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Content-Security-Policy
- ✅ Permissions-Policy

## Rate Limiting

El login tiene protección contra brute force:
- 5 intentos por minuto por IP
- Bloqueo temporal de 60 segundos

## Validación de Inputs

- Recording IDs validados contra path traversal
- Parámetros de filtro validados
- Request bodies validados con Jakarta Validation

