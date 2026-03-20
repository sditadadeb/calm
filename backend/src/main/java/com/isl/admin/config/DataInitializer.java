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

    @Value("${admin.password:#{null}}")
    private String adminPassword;

    @Value("${viewer.username:viewer}")
    private String viewerUsername;

    @Value("${viewer.password:#{null}}")
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
        if (adminPassword != null && !adminPassword.isBlank()) {
            ensureUser(adminUsername, adminPassword, "ADMIN");
        } else {
            log.warn("⚠️ ADMIN_PASSWORD no configurado. No se creó/actualizó el usuario admin.");
        }

        if (viewerPassword != null && !viewerPassword.isBlank()) {
            ensureUser(viewerUsername, viewerPassword, "VIEWER");
        } else {
            log.warn("⚠️ VIEWER_PASSWORD no configurado. No se creó/actualizó el usuario viewer.");
        }

        ensurePromptAndModelDefaults();
    }

    private void ensureUser(String username, String rawPassword, String role) {
        User user = userRepository.findByUsername(username).orElseGet(User::new);
        boolean isNew = user.getId() == null;
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setEnabled(true);
        userRepository.save(user);
        if (isNew) {
            log.info("✅ Usuario {} creado: {}", role.toLowerCase(), username);
        } else {
            log.info("✅ Usuario {} actualizado: {}", role.toLowerCase(), username);
        }
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

