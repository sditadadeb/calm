package com.numia.surveys.dto.contact;

import java.util.List;

public class ImportContactsRequest {
    private List<CreateContactRequest> contacts;
    private Boolean skipDuplicates = true;
    private Boolean updateExisting = false;
    
    public ImportContactsRequest() {}
    
    public List<CreateContactRequest> getContacts() { return contacts; }
    public void setContacts(List<CreateContactRequest> contacts) { this.contacts = contacts; }
    public Boolean getSkipDuplicates() { return skipDuplicates; }
    public void setSkipDuplicates(Boolean skipDuplicates) { this.skipDuplicates = skipDuplicates; }
    public Boolean getUpdateExisting() { return updateExisting; }
    public void setUpdateExisting(Boolean updateExisting) { this.updateExisting = updateExisting; }
}
