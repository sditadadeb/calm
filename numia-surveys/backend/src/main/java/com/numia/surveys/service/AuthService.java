package com.numia.surveys.service;

import com.numia.surveys.dto.auth.AuthResponse;
import com.numia.surveys.dto.auth.LoginRequest;
import com.numia.surveys.dto.auth.RegisterRequest;
import com.numia.surveys.dto.user.UserDTO;
import com.numia.surveys.model.Company;
import com.numia.surveys.model.User;
import com.numia.surveys.model.enums.UserRole;
import com.numia.surveys.repository.CompanyRepository;
import com.numia.surveys.repository.UserRepository;
import com.numia.surveys.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {
    
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    
    public AuthService(UserRepository userRepository, CompanyRepository companyRepository,
                       PasswordEncoder passwordEncoder, JwtService jwtService,
                       AuthenticationManager authenticationManager, UserDetailsService userDetailsService) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
    }
    
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }
        
        Company company;
        UserRole role;
        
        if (request.getCompanyName() != null && !request.getCompanyName().isEmpty()) {
            if (companyRepository.existsByName(request.getCompanyName())) {
                throw new RuntimeException("Ya existe una compañía con ese nombre");
            }
            
            company = Company.builder()
                    .name(request.getCompanyName())
                    .plan("FREE")
                    .maxUsers(5)
                    .maxSurveys(10)
                    .maxResponsesPerMonth(1000)
                    .build();
            company = companyRepository.save(company);
            role = UserRole.COMPANY_ADMIN;
        } else {
            throw new RuntimeException("Debe proporcionar un nombre de compañía o código de invitación");
        }
        
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .role(role)
                .company(company)
                .active(true)
                .emailVerified(false)
                .build();
        
        user = userRepository.save(user);
        
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateTokenWithClaims(
                userDetails,
                user.getId(),
                company.getId(),
                user.getRole().name()
        );
        
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(86400000L)
                .user(UserDTO.fromEntity(user))
                .build();
    }
    
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        if (!user.getActive()) {
            throw new RuntimeException("La cuenta está desactivada");
        }
        
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateTokenWithClaims(
                userDetails,
                user.getId(),
                user.getCompany() != null ? user.getCompany().getId() : null,
                user.getRole().name()
        );
        
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .expiresIn(86400000L)
                .user(UserDTO.fromEntity(user))
                .build();
    }
    
    public UserDTO getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return UserDTO.fromEntity(user);
    }
}
