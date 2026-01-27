package com.calm.admin.dto;

public class PromptConfigDTO {

    private String systemPrompt;
    private String model;
    private Double temperature;
    private Integer maxTokens;

    public PromptConfigDTO() {
    }

    public PromptConfigDTO(String systemPrompt, String model, Double temperature, Integer maxTokens) {
        this.systemPrompt = systemPrompt;
        this.model = model;
        this.temperature = temperature;
        this.maxTokens = maxTokens;
    }

    public String getSystemPrompt() {
        return systemPrompt;
    }

    public void setSystemPrompt(String systemPrompt) {
        this.systemPrompt = systemPrompt;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Integer getMaxTokens() {
        return maxTokens;
    }

    public void setMaxTokens(Integer maxTokens) {
        this.maxTokens = maxTokens;
    }

    @Override
    public String toString() {
        return "PromptConfigDTO{" +
                "model='" + model + '\'' +
                ", temperature=" + temperature +
                ", maxTokens=" + maxTokens +
                '}';
    }
}

