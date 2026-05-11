package com.bancooccidente.admin.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:5176}")
    private String allowedOrigins;

    private final Environment environment;

    public CorsConfig(Environment environment) {
        this.environment = environment;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // No allowCredentials — usamos JWT en Authorization header, no cookies.
        // Sin allowCredentials=true se puede usar wildcard en allowedOrigins.

        // Origins from config file / env var
        for (String origin : allowedOrigins.split(",")) {
            String trimmed = origin.trim();
            if (!trimmed.isEmpty()) {
                config.addAllowedOriginPattern(trimmed);
            }
        }
        if (!isProd()) {
            config.addAllowedOriginPattern("http://localhost:*");
            config.addAllowedOriginPattern("http://127.0.0.1:*");
        }

        // Allow all headers (Authorization, Content-Type, etc.)
        config.setAllowedHeaders(List.of(
            "Authorization", "Content-Type", "X-Requested-With",
            "Accept", "Origin", "Access-Control-Request-Method",
            "Access-Control-Request-Headers", "Cache-Control"
        ));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setExposedHeaders(List.of("Authorization", "Content-Type"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    private boolean isProd() {
        return Arrays.asList(environment.getActiveProfiles()).contains("prod");
    }
}
