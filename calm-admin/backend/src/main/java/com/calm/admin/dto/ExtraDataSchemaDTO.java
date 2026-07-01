package com.calm.admin.dto;

import java.util.ArrayList;
import java.util.List;

public class ExtraDataSchemaDTO {
    private Long branchId;
    private String branchName;
    private List<ExtraDataFieldDTO> fields = new ArrayList<>();

    public ExtraDataSchemaDTO() {}

    public ExtraDataSchemaDTO(List<ExtraDataFieldDTO> fields) {
        this.fields = fields != null ? fields : new ArrayList<>();
    }

    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public List<ExtraDataFieldDTO> getFields() { return fields; }
    public void setFields(List<ExtraDataFieldDTO> fields) { this.fields = fields != null ? fields : new ArrayList<>(); }
}
