package com.numia.surveys.config;

import com.numia.surveys.model.Company;
import com.numia.surveys.model.User;
import com.numia.surveys.model.enums.UserRole;
import com.numia.surveys.repository.CompanyRepository;
import com.numia.surveys.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    
    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    
    public DataInitializer(UserRepository userRepository, CompanyRepository companyRepository, 
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            log.info("Creando usuario admin por defecto...");
            
            // Crear compañía demo
            Company company = Company.builder()
                    .name("Numia Demo")
                    .description("Compañía de demostración")
                    .plan("ENTERPRISE")
                    .maxUsers(100)
                    .maxSurveys(1000)
                    .maxResponsesPerMonth(100000)
                    .active(true)
                    .build();
            company = companyRepository.save(company);
            
            // Crear usuario admin
            User admin = User.builder()
                    .email("admin@numia.com")
                    .password(passwordEncoder.encode("admin123"))
                    .firstName("Admin")
                    .lastName("Numia")
                    .role(UserRole.SUPER_ADMIN)
                    .company(company)
                    .active(true)
                    .emailVerified(true)
                    .build();
            userRepository.save(admin);
            
            log.info("✅ Usuario admin creado:");
            log.info("   Email: admin@numia.com");
            log.info("   Password: admin123");
        } else {
            log.info("Ya existen usuarios en la base de datos");
        }
    }
}

