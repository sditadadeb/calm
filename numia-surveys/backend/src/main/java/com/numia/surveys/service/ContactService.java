package com.numia.surveys.service;

import com.numia.surveys.dto.contact.*;
import com.numia.surveys.model.Company;
import com.numia.surveys.model.Contact;
import com.numia.surveys.model.ContactList;
import com.numia.surveys.model.User;
import com.numia.surveys.repository.CompanyRepository;
import com.numia.surveys.repository.ContactListRepository;
import com.numia.surveys.repository.ContactRepository;
import com.numia.surveys.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContactService {
    
    private final ContactListRepository contactListRepository;
    private final ContactRepository contactRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    
    public ContactService(ContactListRepository contactListRepository, ContactRepository contactRepository,
                          CompanyRepository companyRepository, UserRepository userRepository) {
        this.contactListRepository = contactListRepository;
        this.contactRepository = contactRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }
    
    @Transactional
    public ContactListDTO createContactList(String name, String description, Long companyId, Long userId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new RuntimeException("Compañía no encontrada"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        ContactList contactList = ContactList.builder()
                .name(name)
                .description(description)
                .company(company)
                .createdBy(user)
                .build();
        
        contactList = contactListRepository.save(contactList);
        return ContactListDTO.fromEntity(contactList);
    }
    
    public List<ContactListDTO> getContactListsByCompany(Long companyId) {
        return contactListRepository.findByCompanyIdOrderByCreatedAtDesc(companyId).stream()
                .map(ContactListDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public ContactListDTO getContactList(Long contactListId, Long companyId) {
        ContactList contactList = contactListRepository.findById(contactListId)
                .orElseThrow(() -> new RuntimeException("Lista de contactos no encontrada"));
        
        if (!contactList.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta lista de contactos");
        }
        
        return ContactListDTO.fromEntity(contactList);
    }
    
    @Transactional
    public ContactListDTO updateContactList(Long contactListId, String name, String description, Long companyId) {
        ContactList contactList = contactListRepository.findById(contactListId)
                .orElseThrow(() -> new RuntimeException("Lista de contactos no encontrada"));
        
        if (!contactList.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta lista de contactos");
        }
        
        contactList.setName(name);
        contactList.setDescription(description);
        contactList = contactListRepository.save(contactList);
        
        return ContactListDTO.fromEntity(contactList);
    }
    
    @Transactional
    public void deleteContactList(Long contactListId, Long companyId) {
        ContactList contactList = contactListRepository.findById(contactListId)
                .orElseThrow(() -> new RuntimeException("Lista de contactos no encontrada"));
        
        if (!contactList.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta lista de contactos");
        }
        
        contactListRepository.delete(contactList);
    }
    
    @Transactional
    public ContactDTO createContact(Long contactListId, CreateContactRequest request, Long companyId) {
        ContactList contactList = contactListRepository.findById(contactListId)
                .orElseThrow(() -> new RuntimeException("Lista de contactos no encontrada"));
        
        if (!contactList.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta lista de contactos");
        }
        
        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            if (contactRepository.findByContactListIdAndEmail(contactListId, request.getEmail()).isPresent()) {
                throw new RuntimeException("Ya existe un contacto con ese email en esta lista");
            }
        }
        
        Contact contact = Contact.builder()
                .email(request.getEmail())
                .phone(request.getPhone())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .customFields(request.getCustomFields())
                .contactList(contactList)
                .build();
        
        contact = contactRepository.save(contact);
        
        contactList.setContactCount(contactList.getContactCount() + 1);
        contactListRepository.save(contactList);
        
        return ContactDTO.fromEntity(contact);
    }
    
    public List<ContactDTO> getContactsByContactList(Long contactListId, Long companyId) {
        ContactList contactList = contactListRepository.findById(contactListId)
                .orElseThrow(() -> new RuntimeException("Lista de contactos no encontrada"));
        
        if (!contactList.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta lista de contactos");
        }
        
        return contactRepository.findByContactListId(contactListId).stream()
                .map(ContactDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public Page<ContactDTO> getContactsByContactListPaginated(Long contactListId, Long companyId, Pageable pageable) {
        ContactList contactList = contactListRepository.findById(contactListId)
                .orElseThrow(() -> new RuntimeException("Lista de contactos no encontrada"));
        
        if (!contactList.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta lista de contactos");
        }
        
        return contactRepository.findByContactListId(contactListId, pageable)
                .map(ContactDTO::fromEntity);
    }
    
    @Transactional
    public ContactDTO updateContact(Long contactId, CreateContactRequest request, Long companyId) {
        Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new RuntimeException("Contacto no encontrado"));
        
        if (!contact.getContactList().getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a este contacto");
        }
        
        contact.setEmail(request.getEmail());
        contact.setPhone(request.getPhone());
        contact.setFirstName(request.getFirstName());
        contact.setLastName(request.getLastName());
        contact.setCustomFields(request.getCustomFields());
        
        contact = contactRepository.save(contact);
        return ContactDTO.fromEntity(contact);
    }
    
    @Transactional
    public void deleteContact(Long contactId, Long companyId) {
        Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new RuntimeException("Contacto no encontrado"));
        
        if (!contact.getContactList().getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a este contacto");
        }
        
        ContactList contactList = contact.getContactList();
        contactRepository.delete(contact);
        
        contactList.setContactCount(Math.max(0, contactList.getContactCount() - 1));
        contactListRepository.save(contactList);
    }
    
    @Transactional
    public ImportResult importContacts(Long contactListId, ImportContactsRequest request, Long companyId) {
        ContactList contactList = contactListRepository.findById(contactListId)
                .orElseThrow(() -> new RuntimeException("Lista de contactos no encontrada"));
        
        if (!contactList.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta lista de contactos");
        }
        
        int imported = 0;
        int skipped = 0;
        int updated = 0;
        
        for (CreateContactRequest contactRequest : request.getContacts()) {
            try {
                var existingByEmail = contactRequest.getEmail() != null ? 
                        contactRepository.findByContactListIdAndEmail(contactListId, contactRequest.getEmail()) : 
                        java.util.Optional.<Contact>empty();
                
                if (existingByEmail.isPresent()) {
                    if (Boolean.TRUE.equals(request.getUpdateExisting())) {
                        Contact existing = existingByEmail.get();
                        existing.setPhone(contactRequest.getPhone());
                        existing.setFirstName(contactRequest.getFirstName());
                        existing.setLastName(contactRequest.getLastName());
                        existing.setCustomFields(contactRequest.getCustomFields());
                        contactRepository.save(existing);
                        updated++;
                    } else if (Boolean.TRUE.equals(request.getSkipDuplicates())) {
                        skipped++;
                    }
                } else {
                    Contact contact = Contact.builder()
                            .email(contactRequest.getEmail())
                            .phone(contactRequest.getPhone())
                            .firstName(contactRequest.getFirstName())
                            .lastName(contactRequest.getLastName())
                            .customFields(contactRequest.getCustomFields())
                            .contactList(contactList)
                            .build();
                    contactRepository.save(contact);
                    imported++;
                }
            } catch (Exception e) {
                skipped++;
            }
        }
        
        int currentCount = contactRepository.countActiveByContactListId(contactListId);
        contactList.setContactCount(currentCount);
        contactListRepository.save(contactList);
        
        return new ImportResult(imported, skipped, updated);
    }
    
    public List<ContactDTO> searchContacts(Long contactListId, String query, Long companyId) {
        ContactList contactList = contactListRepository.findById(contactListId)
                .orElseThrow(() -> new RuntimeException("Lista de contactos no encontrada"));
        
        if (!contactList.getCompany().getId().equals(companyId)) {
            throw new RuntimeException("No tienes acceso a esta lista de contactos");
        }
        
        return contactRepository.searchByContactListId(contactListId, query).stream()
                .map(ContactDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public record ImportResult(int imported, int skipped, int updated) {}
}
