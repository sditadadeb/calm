package com.isl.admin.config;

import com.isl.admin.model.SystemConfig;
import com.isl.admin.model.User;
import com.isl.admin.repository.SystemConfigRepository;
import com.isl.admin.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final SystemConfigRepository systemConfigRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.username:Admin}")
    private String adminUsername;

    @Value("${admin.password:Numi@2026!}")
    private String adminPassword;

    @Value("${viewer.username:viewer}")
    private String viewerUsername;

    @Value("${viewer.password:Num1a2026!}")
    private String viewerPassword;

    public DataInitializer(
            UserRepository userRepository,
            SystemConfigRepository systemConfigRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.systemConfigRepository = systemConfigRepository;
        this.passwordEncoder = passwordEncoder;
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
            log.info("✅ Usuario admin creado: {}", adminUsername);
            log.info("⚠️  IMPORTANTE: Cambiá la contraseña por defecto en producción!");
        } else {
            log.info("Usuario admin ya existe");
        }

        // Create viewer user if not exists
        if (!userRepository.existsByUsername(viewerUsername)) {
            User viewer = new User();
            viewer.setUsername(viewerUsername);
            viewer.setPassword(passwordEncoder.encode(viewerPassword));
            viewer.setRole("VIEWER");
            viewer.setEnabled(true);
            userRepository.save(viewer);
            log.info("✅ Usuario viewer creado: {}", viewerUsername);
        } else {
            log.info("Usuario viewer ya existe");
        }

        ensurePromptAndModelDefaults();
    }

    private void ensurePromptAndModelDefaults() {
        SystemConfig promptConfig = systemConfigRepository.findByConfigKey("analysis_prompt")
                .orElse(new SystemConfig("analysis_prompt", "", "System prompt for ChatGPT analysis"));

        String currentPrompt = promptConfig.getConfigValue();
        boolean shouldReplacePrompt = currentPrompt == null
                || currentPrompt.isBlank()
                || currentPrompt.contains("organismo de seguridad laboral (ISL)");

        if (shouldReplacePrompt) {
            promptConfig.setConfigValue(PromptDefaults.DEFAULT_ANALYSIS_PROMPT);
            systemConfigRepository.save(promptConfig);
            log.info("✅ Prompt de análisis actualizado al nuevo esquema CX bancario");
        }

        SystemConfig modelConfig = systemConfigRepository.findByConfigKey("openai_model")
                .orElse(new SystemConfig("openai_model", "gpt-5.2", "OpenAI model to use"));
        if (modelConfig.getConfigValue() == null || modelConfig.getConfigValue().isBlank()) {
            modelConfig.setConfigValue("gpt-5.2");
            systemConfigRepository.save(modelConfig);
        }
    }
}

