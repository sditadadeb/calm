package com.bancooccidente.admin.config;

import com.bancooccidente.admin.model.User;
import com.bancooccidente.admin.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Value("${admin.username:admin}")
    private String adminUsername;

    @Value("${admin.password:admin123}")
    private String adminPassword;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        // Create admin user if not exists
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
        
        // Create viewer user (always exists)
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
}

