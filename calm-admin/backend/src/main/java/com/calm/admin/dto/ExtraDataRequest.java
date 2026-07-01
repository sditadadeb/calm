package com.calm.admin.dto;

import java.util.HashMap;
import java.util.Map;

public class ExtraDataRequest {
    private Map<String, Object> values = new HashMap<>();

    // Legacy fields — still accepted for backward compatibility
    private Boolean saleCompleted;
    private String noSaleReason;

    public Map<String, Object> getValues() { return values; }
    public void setValues(Map<String, Object> values) { this.values = values != null ? values : new HashMap<>(); }

    public Boolean getSaleCompleted() { return saleCompleted; }
    public void setSaleCompleted(Boolean saleCompleted) { this.saleCompleted = saleCompleted; }

    public String getNoSaleReason() { return noSaleReason; }
    public void setNoSaleReason(String noSaleReason) { this.noSaleReason = noSaleReason; }
}
