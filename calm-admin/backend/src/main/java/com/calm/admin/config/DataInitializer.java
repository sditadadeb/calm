package com.calm.admin.config;

import com.calm.admin.model.Transcription;
import com.calm.admin.model.User;
import com.calm.admin.repository.TranscriptionRepository;
import com.calm.admin.repository.UserRepository;
import com.calm.admin.service.TranscriptionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private static final Set<Long> EXCLUDED_BRANCH_IDS = Set.of(4476L, 4495L, 4496L);

    private final UserRepository userRepository;
    private final TranscriptionRepository transcriptionRepository;
    private final TranscriptionService transcriptionService;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Value("${admin.username:admin}")
    private String adminUsername;

    @Value("${admin.password:admin123}")
    private String adminPassword;

    public DataInitializer(UserRepository userRepository, TranscriptionRepository transcriptionRepository,
                           TranscriptionService transcriptionService, PasswordEncoder passwordEncoder,
                           JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.transcriptionRepository = transcriptionRepository;
        this.transcriptionService = transcriptionService;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername(adminUsername)) {
            User admin = new User();
            admin.setUsername(adminUsername);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole("ADMIN");
            admin.setEnabled(true);
            userRepository.save(admin);
            log.info("Usuario admin creado: {}", adminUsername);
        } else {
            log.info("Usuario admin ya existe");
        }
        
        String viewerUsername = "viewer";
        String viewerPassword = "calm2026!";
        if (!userRepository.existsByUsername(viewerUsername)) {
            User viewer = new User();
            viewer.setUsername(viewerUsername);
            viewer.setPassword(passwordEncoder.encode(viewerPassword));
            viewer.setRole("VIEWER");
            viewer.setEnabled(true);
            userRepository.save(viewer);
            log.info("Usuario viewer creado");
        } else {
            log.info("Usuario viewer ya existe");
        }

        applyTimezoneCorrection();
        purgeExcludedBranches();
        purgeMetadataAsText();
        dedupeFlatRecordingIds();
        runMigrationRefresh();
        applyCsvOriginalDates();
        runParseErrorSweep();
    }

    private void ensureMigrationsTable() {
        jdbcTemplate.execute(
            "CREATE TABLE IF NOT EXISTS applied_migrations (migration_id VARCHAR(100) PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
        );
    }

    private boolean isMigrationApplied(String migrationId) {
        ensureMigrationsTable();
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM applied_migrations WHERE migration_id = ?",
            Integer.class,
            migrationId
        );
        return count != null && count > 0;
    }

    private void markMigrationApplied(String migrationId) {
        jdbcTemplate.update("INSERT INTO applied_migrations (migration_id) VALUES (?)", migrationId);
    }

    private void dedupeFlatRecordingIds() {
        try {
            if (isMigrationApplied("dedupe_flat_recording_ids")) {
                return;
            }

            List<String> flatIds = jdbcTemplate.queryForList(
                "SELECT recording_id FROM transcriptions WHERE recording_id NOT LIKE '%/%'",
                String.class
            );

            int deleted = 0;
            for (String flatId : flatIds) {
                Integer fullPathCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM transcriptions WHERE recording_id LIKE ?",
                    Integer.class,
                    "%/" + flatId
                );
                if (fullPathCount != null && fullPathCount > 0) {
                    jdbcTemplate.update("DELETE FROM transcriptions WHERE recording_id = ?", flatId);
                    deleted++;
                }
            }

            markMigrationApplied("dedupe_flat_recording_ids");
            if (deleted > 0) {
                log.info("Migracion dedupe: eliminadas {} transcripciones con ID plano duplicado", deleted);
            }
        } catch (Exception e) {
            log.error("Error en migracion dedupe flat IDs: {}", e.getMessage());
        }
    }

    private void runMigrationRefresh() {
        try {
            if (isMigrationApplied("bucket_migration_refresh_v1")) {
                return;
            }

            int datesFixed = transcriptionService.fixMigrationPeriodDates();
            int refreshed = transcriptionService.refreshStaleTranscriptions();

            markMigrationApplied("bucket_migration_refresh_v1");
            log.info("Migracion bucket refresh: {} fechas corregidas (Jun 9-11), {} transcripciones actualizadas",
                    datesFixed, refreshed);
        } catch (Exception e) {
            log.error("Error en migracion bucket refresh: {}", e.getMessage());
        }
    }

    private void applyCsvOriginalDates() {
        try {
            if (isMigrationApplied("csv_original_dates_v1")) {
                return;
            }

            int datesFixed = transcriptionService.fixMigrationPeriodDates();
            markMigrationApplied("csv_original_dates_v1");
            log.info("Migracion CSV fechas originales: {} registros actualizados (Jun 9-11)", datesFixed);
        } catch (Exception e) {
            log.error("Error aplicando fechas originales desde CSV: {}", e.getMessage());
        }
    }

    private void runParseErrorSweep() {
        try {
            if (isMigrationApplied("parse_error_sweep_v1")) {
                return;
            }

            var result = transcriptionService.reanalyzeParseErrors(2);
            markMigrationApplied("parse_error_sweep_v1");
            log.info("Migracion parse error sweep (2 meses): found={}, fixed={}, errors={}",
                    result.get("found"), result.get("fixed"), result.get("errors"));
        } catch (Exception e) {
            log.error("Error en migracion parse error sweep: {}", e.getMessage());
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
                int updated = jdbcTemplate.update(
                    "UPDATE transcriptions SET recording_date = recording_date - INTERVAL '3 hours' WHERE recording_date IS NOT NULL"
                );
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
    
    private void purgeExcludedBranches() {
        try {
            List<Transcription> toRemove = transcriptionRepository.findByBranchIdIn(EXCLUDED_BRANCH_IDS);
            if (!toRemove.isEmpty()) {
                log.info("Eliminando {} transcripciones de sucursales excluidas (IDs: {})", toRemove.size(), EXCLUDED_BRANCH_IDS);
                transcriptionRepository.deleteAll(toRemove);
                log.info("Transcripciones de sucursales excluidas eliminadas correctamente");
            }
        } catch (Exception e) {
            log.error("Error purgando sucursales excluidas: {}", e.getMessage());
        }
    }

    private void purgeMetadataAsText() {
        try {
            int deleted = jdbcTemplate.update(
                "DELETE FROM transcriptions WHERE transcription_text LIKE '{\"user\":%' OR transcription_text LIKE '{\"branch\":%'"
            );
            if (deleted > 0) {
                log.info("Eliminadas {} transcripciones corruptas (metadata como texto)", deleted);
            }
        } catch (Exception e) {
            log.error("Error purgando transcripciones con metadata como texto: {}", e.getMessage());
        }
    }
}
