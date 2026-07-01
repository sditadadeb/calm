package com.calm.admin.dto;

import java.util.ArrayList;
import java.util.List;

public class ExtraDataFieldDTO {
    private String id;
    private String label;
    private String type;
    private int order;
    private boolean required;
    private String systemKey;
    private List<ExtraDataFieldOptionDTO> options = new ArrayList<>();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public int getOrder() { return order; }
    public void setOrder(int order) { this.order = order; }

    public boolean isRequired() { return required; }
    public void setRequired(boolean required) { this.required = required; }

    public String getSystemKey() { return systemKey; }
    public void setSystemKey(String systemKey) { this.systemKey = systemKey; }

    public List<ExtraDataFieldOptionDTO> getOptions() { return options; }
    public void setOptions(List<ExtraDataFieldOptionDTO> options) { this.options = options != null ? options : new ArrayList<>(); }
}
