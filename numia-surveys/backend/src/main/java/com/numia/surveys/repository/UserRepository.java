package com.numia.surveys.repository;

import com.numia.surveys.model.User;
import com.numia.surveys.model.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    List<User> findByCompanyId(Long companyId);
    
    List<User> findByCompanyIdAndActiveTrue(Long companyId);
    
    List<User> findByRole(UserRole role);
    
    Optional<User> findByVerificationToken(String token);
    
    Optional<User> findByResetToken(String token);
    
    @Query("SELECT u FROM User u WHERE u.company.id = :companyId AND u.role = :role")
    List<User> findByCompanyIdAndRole(Long companyId, UserRole role);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.company.id = :companyId AND u.active = true")
    int countActiveUsersByCompanyId(Long companyId);
    
    @Query("SELECT u FROM User u WHERE u.company.id = :companyId AND " +
           "(LOWER(u.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<User> searchByCompanyId(Long companyId, String search);
}

