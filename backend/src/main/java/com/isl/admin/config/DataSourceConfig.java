package com.isl.admin.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Convierte DATABASE_URL de Render (postgres:// o postgresql://) a JDBC
 * y configura el DataSource para producción. Solo activo cuando DATABASE_URL existe y es PostgreSQL.
 */
@Configuration
public class DataSourceConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    @Primary
    @ConditionalOnExpression("environment.getProperty('DATABASE_URL','').startsWith('postgres')")
    public DataSource dataSource() {
        HikariDataSource ds = new HikariDataSource();
        try {
            String jdbcUrl = toJdbcUrl(databaseUrl);
            ds.setJdbcUrl(jdbcUrl);
            ds.setDriverClassName("org.postgresql.Driver");
        } catch (Exception e) {
            throw new IllegalStateException("Invalid DATABASE_URL for PostgreSQL", e);
        }
        return ds;
    }

    private static String toJdbcUrl(String url) {
        // postgresql://user:password@host:port/database -> jdbc:postgresql://host:port/database?user=user&password=password
        String withoutScheme = url.substring(url.indexOf("://") + 3);
        int at = withoutScheme.indexOf('@');
        if (at < 0) {
            throw new IllegalArgumentException("DATABASE_URL: missing @ in authority");
        }
        String userPass = withoutScheme.substring(0, at);
        String hostDb = withoutScheme.substring(at + 1);
        int colon = userPass.indexOf(':');
        String user = colon >= 0 ? userPass.substring(0, colon) : userPass;
        String password = colon >= 0 ? userPass.substring(colon + 1) : "";
        try {
            password = URLEncoder.encode(password, StandardCharsets.UTF_8.toString());
        } catch (UnsupportedEncodingException e) {
            // UTF-8 is always supported
        }
        int slash = hostDb.indexOf('/');
        String hostPort = slash >= 0 ? hostDb.substring(0, slash) : hostDb;
        String database = slash >= 0 ? hostDb.substring(slash + 1) : "postgres";
        if (database.contains("?")) {
            database = database.substring(0, database.indexOf('?'));
        }
        String jdbc = "jdbc:postgresql://" + hostPort + "/" + database;
        String params = "user=" + user + "&password=" + password;
        return jdbc + (jdbc.contains("?") ? "&" : "?") + params;
    }
}
