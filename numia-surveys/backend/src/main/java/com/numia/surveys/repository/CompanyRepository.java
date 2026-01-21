package com.numia.surveys.repository;

import com.numia.surveys.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {
    
    Optional<Company> findBySlug(String slug);
    
    Optional<Company> findByName(String name);
    
    boolean existsByName(String name);
    
    boolean existsBySlug(String slug);
    
    List<Company> findByActiveTrue();
    
    @Query("SELECT c FROM Company c WHERE c.active = true ORDER BY c.createdAt DESC")
    List<Company> findAllActiveCompanies();
    
    @Query("SELECT c FROM Company c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Company> searchByName(String search);
}

