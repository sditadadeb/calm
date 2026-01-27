package com.calm.admin.model;

import jakarta.persistence.*;

@Entity
@Table(name = "system_config")
public class SystemConfig {

    @Id
    private String configKey;

    @Column(columnDefinition = "TEXT")
    private String configValue;

    @Column(length = 500)
    private String description;

    public SystemConfig() {
    }

    public SystemConfig(String configKey, String configValue, String description) {
        this.configKey = configKey;
        this.configValue = configValue;
        this.description = description;
    }

    public String getConfigKey() {
        return configKey;
    }

    public void setConfigKey(String configKey) {
        this.configKey = configKey;
    }

    public String getConfigValue() {
        return configValue;
    }

    public void setConfigValue(String configValue) {
        this.configValue = configValue;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    @Override
    public String toString() {
        return "SystemConfig{" +
                "configKey='" + configKey + '\'' +
                ", description='" + description + '\'' +
                '}';
    }
}

