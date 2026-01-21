package com.numia.surveys.repository;

import com.numia.surveys.model.Contact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {
    
    List<Contact> findByContactListId(Long contactListId);
    
    Page<Contact> findByContactListId(Long contactListId, Pageable pageable);
    
    List<Contact> findByContactListIdAndActiveTrue(Long contactListId);
    
    Optional<Contact> findByContactListIdAndEmail(Long contactListId, String email);
    
    Optional<Contact> findByContactListIdAndPhone(Long contactListId, String phone);
    
    @Query("SELECT c FROM Contact c WHERE c.contactList.id = :contactListId AND " +
           "(LOWER(c.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "c.phone LIKE CONCAT('%', :search, '%'))")
    List<Contact> searchByContactListId(Long contactListId, String search);
    
    @Query("SELECT COUNT(c) FROM Contact c WHERE c.contactList.id = :contactListId AND c.active = true")
    int countActiveByContactListId(Long contactListId);
    
    @Query("SELECT c FROM Contact c WHERE c.contactList.id = :contactListId AND c.active = true AND c.emailOptOut = false")
    List<Contact> findEmailableByContactListId(Long contactListId);
    
    @Query("SELECT c FROM Contact c WHERE c.contactList.id = :contactListId AND c.active = true AND c.smsOptOut = false AND c.phone IS NOT NULL")
    List<Contact> findSmsableByContactListId(Long contactListId);
}

