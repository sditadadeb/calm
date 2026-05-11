package com.bancooccidente.admin.config;

import com.bancooccidente.admin.model.User;
import com.bancooccidente.admin.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.DatabaseMetaData;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;
    private final Environment environment;

    @Value("${admin.username:admin}")
    private String adminUsername;

    @Value("${admin.password:admin123}")
    private String adminPassword;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder,
                           JdbcTemplate jdbcTemplate, DataSource dataSource, Environment environment) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.dataSource = dataSource;
        this.jdbcTemplate = jdbcTemplate;
        this.environment = environment;
    }

    @Override
    public void run(String... args) {
        ensureTranscriptionSchema();
        syncAdminUser();
        
        syncOptionalViewerUser();

        applyTimezoneCorrection();
    }

    private void syncOptionalViewerUser() {
        String viewerUsername = environment.getProperty("viewer.username");
        String viewerPassword = environment.getProperty("viewer.password");

        if (viewerUsername == null || viewerUsername.isBlank() || viewerPassword == null || viewerPassword.isBlank()) {
            userRepository.findByUsername("viewer").ifPresent(existingViewer -> {
                if (Boolean.TRUE.equals(existingViewer.getEnabled())) {
                    existingViewer.setEnabled(false);
                    userRepository.save(existingViewer);
                    log.warn("Usuario viewer por defecto deshabilitado; configure viewer.username/viewer.password si necesita un viewer");
                }
            });
            log.info("Usuario viewer no configurado por variables de entorno; se omite creación automática");
            return;
        }

        if (!userRepository.existsByUsername(viewerUsername)) {
            User viewer = new User();
            viewer.setUsername(viewerUsername);
            viewer.setPassword(passwordEncoder.encode(viewerPassword));
            viewer.setRole("VIEWER");
            viewer.setEnabled(true);
            userRepository.save(viewer);
            log.info("Usuario viewer creado desde configuración: {}", viewerUsername);
        } else {
            log.info("Usuario viewer configurado ya existe: {}", viewerUsername);
        }
    }

    private void ensureTranscriptionSchema() {
        addColumnIfMissing("sale_status", "VARCHAR(255)");
        addColumnIfMissing("analysis_confidence", "INTEGER");
        addColumnIfMissing("confidence_trace", "TEXT");
        addColumnIfMissing("sale_evidence", "TEXT");
        addColumnIfMissing("sale_evidence_meta", "TEXT");
        addColumnIfMissing("motivo_visita", "VARCHAR(255)");
        addColumnIfMissing("estado_emocional", "VARCHAR(255)");
        addColumnIfMissing("csat_score", "INTEGER");
        addColumnIfMissing("escucha_activa_score", "INTEGER");
        addColumnIfMissing("cumplimiento_protocolo", "BOOLEAN");
        addColumnIfMissing("protocolo_score", "INTEGER");
        addColumnIfMissing("protocolo_detalle", "TEXT");
        addColumnIfMissing("producto_ofrecido", "BOOLEAN");
        addColumnIfMissing("monto_ofrecido", "BIGINT");
        addColumnIfMissing("cumplimiento_lineamiento", "BOOLEAN");
        addColumnIfMissing("grabacion_cortada_cliente", "BOOLEAN");
        addColumnIfMissing("grabacion_cortada_manual", "BOOLEAN");
    }

    private void addColumnIfMissing(String columnName, String columnDefinition) {
        try {
            jdbcTemplate.execute("ALTER TABLE transcriptions ADD COLUMN IF NOT EXISTS " + columnName + " " + columnDefinition);
        } catch (Exception e) {
            log.warn("No se pudo asegurar columna transcriptions.{}: {}", columnName, e.getMessage());
        }
    }

    private void syncAdminUser() {
        User admin = userRepository.findByUsername(adminUsername).orElse(null);

        if (admin == null) {
            admin = new User();
            admin.setUsername(adminUsername);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole("ADMIN");
            admin.setEnabled(true);
            userRepository.save(admin);
            log.info("Usuario admin creado: {}", adminUsername);
            return;
        }

        boolean changed = false;
        if (!passwordEncoder.matches(adminPassword, admin.getPassword())) {
            admin.setPassword(passwordEncoder.encode(adminPassword));
            changed = true;
        }
        if (!"ADMIN".equals(admin.getRole())) {
            admin.setRole("ADMIN");
            changed = true;
        }
        if (!Boolean.TRUE.equals(admin.getEnabled())) {
            admin.setEnabled(true);
            changed = true;
        }

        if (changed) {
            userRepository.save(admin);
            log.info("Usuario admin sincronizado con variables de entorno: {}", adminUsername);
        } else {
            log.info("Usuario admin ya existe y esta sincronizado");
        }
    }

    private void applyTimezoneCorrection() {
        try {
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS applied_migrations (migration_id VARCHAR(100) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
            );

            Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM applied_migrations WHERE migration_id = ?",
                Integer.class,
                "timezone_minus_3h"
            );

            if (count != null && count == 0) {
                String updateSql = buildDateSubtractSql();
                int updated = jdbcTemplate.update(updateSql);
                jdbcTemplate.update(
                    "INSERT INTO applied_migrations (migration_id) VALUES (?)",
                    "timezone_minus_3h"
                );
                log.info("Migracion timezone aplicada: {} registros actualizados (-3 horas)", updated);
            } else {
                log.info("Migracion timezone ya fue aplicada previamente");
            }
        } catch (Exception e) {
            log.error("Error aplicando migracion timezone: {}", e.getMessage());
        }
    }

    private String buildDateSubtractSql() {
        try (var conn = dataSource.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            String dbName = meta.getDatabaseProductName().toLowerCase();
            if (dbName.contains("postgresql") || dbName.contains("postgres")) {
                return "UPDATE transcriptions SET recording_date = recording_date - INTERVAL '3 hours' WHERE recording_date IS NOT NULL";
            }
        } catch (Exception e) {
            log.warn("No se pudo detectar el tipo de base de datos, usando sintaxis H2: {}", e.getMessage());
        }
        // H2 syntax (default / fallback)
        return "UPDATE transcriptions SET recording_date = DATEADD(HOUR, -3, recording_date) WHERE recording_date IS NOT NULL";
    }
}

