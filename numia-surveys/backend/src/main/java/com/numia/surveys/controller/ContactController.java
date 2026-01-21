package com.numia.surveys.controller;

import com.numia.surveys.dto.contact.*;
import com.numia.surveys.service.ContactService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {
    
    private final ContactService contactService;
    
    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }
    
    // Contact Lists
    
    @PostMapping("/lists")
    public ResponseEntity<ContactListDTO> createContactList(
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        Long userId = (Long) httpRequest.getAttribute("userId");
        return ResponseEntity.ok(contactService.createContactList(
                request.get("name"),
                request.get("description"),
                companyId,
                userId
        ));
    }
    
    @GetMapping("/lists")
    public ResponseEntity<List<ContactListDTO>> getContactLists(HttpServletRequest httpRequest) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(contactService.getContactListsByCompany(companyId));
    }
    
    @GetMapping("/lists/{id}")
    public ResponseEntity<ContactListDTO> getContactList(
            @PathVariable Long id,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(contactService.getContactList(id, companyId));
    }
    
    @PutMapping("/lists/{id}")
    public ResponseEntity<ContactListDTO> updateContactList(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(contactService.updateContactList(
                id,
                request.get("name"),
                request.get("description"),
                companyId
        ));
    }
    
    @DeleteMapping("/lists/{id}")
    public ResponseEntity<Void> deleteContactList(
            @PathVariable Long id,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        contactService.deleteContactList(id, companyId);
        return ResponseEntity.noContent().build();
    }
    
    // Contacts
    
    @PostMapping("/lists/{listId}/contacts")
    public ResponseEntity<ContactDTO> createContact(
            @PathVariable Long listId,
            @RequestBody CreateContactRequest request,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(contactService.createContact(listId, request, companyId));
    }
    
    @GetMapping("/lists/{listId}/contacts")
    public ResponseEntity<List<ContactDTO>> getContacts(
            @PathVariable Long listId,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(contactService.getContactsByContactList(listId, companyId));
    }
    
    @GetMapping("/lists/{listId}/contacts/paginated")
    public ResponseEntity<Page<ContactDTO>> getContactsPaginated(
            @PathVariable Long listId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(contactService.getContactsByContactListPaginated(
                listId, companyId, PageRequest.of(page, size)));
    }
    
    @GetMapping("/lists/{listId}/contacts/search")
    public ResponseEntity<List<ContactDTO>> searchContacts(
            @PathVariable Long listId,
            @RequestParam String q,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(contactService.searchContacts(listId, q, companyId));
    }
    
    @PutMapping("/{contactId}")
    public ResponseEntity<ContactDTO> updateContact(
            @PathVariable Long contactId,
            @RequestBody CreateContactRequest request,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(contactService.updateContact(contactId, request, companyId));
    }
    
    @DeleteMapping("/{contactId}")
    public ResponseEntity<Void> deleteContact(
            @PathVariable Long contactId,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        contactService.deleteContact(contactId, companyId);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/lists/{listId}/import")
    public ResponseEntity<ContactService.ImportResult> importContacts(
            @PathVariable Long listId,
            @RequestBody ImportContactsRequest request,
            HttpServletRequest httpRequest
    ) {
        Long companyId = (Long) httpRequest.getAttribute("companyId");
        return ResponseEntity.ok(contactService.importContacts(listId, request, companyId));
    }
}
