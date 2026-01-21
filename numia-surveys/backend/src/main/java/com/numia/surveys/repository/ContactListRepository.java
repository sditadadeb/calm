package com.numia.surveys.repository;

import com.numia.surveys.model.ContactList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactListRepository extends JpaRepository<ContactList, Long> {
    
    List<ContactList> findByCompanyId(Long companyId);
    
    List<ContactList> findByCompanyIdOrderByCreatedAtDesc(Long companyId);
    
    @Query("SELECT cl FROM ContactList cl WHERE cl.company.id = :companyId AND " +
           "LOWER(cl.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<ContactList> searchByCompanyId(Long companyId, String search);
    
    @Query("SELECT COUNT(cl) FROM ContactList cl WHERE cl.company.id = :companyId")
    int countByCompanyId(Long companyId);
}

