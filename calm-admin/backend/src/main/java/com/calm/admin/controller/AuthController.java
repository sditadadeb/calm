package com.calm.admin.controller;

import com.calm.admin.dto.LoginRequest;
import com.calm.admin.dto.LoginResponse;
import com.calm.admin.model.User;
import com.calm.admin.repository.UserRepository;
import com.calm.admin.security.JwtUtil;
import com.calm.admin.security.RateLimitingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final RateLimitingService rateLimitingService;

    public AuthController(AuthenticationManager authenticationManager, JwtUtil jwtUtil,
                         UserRepository userRepository, RateLimitingService rateLimitingService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.rateLimitingService = rateLimitingService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        String clientIp = getClientIp(request);
        String rateLimitKey = "login:" + clientIp;

        // Check if IP is rate limited
        if (rateLimitingService.isBlocked(rateLimitKey)) {
            log.warn("Rate limit exceeded for IP: {}", clientIp);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "Demasiados intentos fallidos. Intentá de nuevo en 1 minuto.");
            error.put("blockedUntil", rateLimitingService.getBlockedUntil(rateLimitKey));
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(error);
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = userRepository.findByUsername(loginRequest.getUsername())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            // Update last login
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            // Reset rate limit on successful login
            rateLimitingService.resetAttempts(rateLimitKey);

            String token = jwtUtil.generateToken(user.getUsername(), user.getRole(), user.getSellerId());

            log.info("Successful login for user: {} from IP: {}", user.getUsername(), clientIp);

            LoginResponse response = new LoginResponse(
                    token,
                    user.getUsername(),
                    user.getRole(),
                    user.getSellerId(),
                    user.getSellerName(),
                    86400000 // 24 hours in milliseconds
            );

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException e) {
            // Record failed attempt
            rateLimitingService.recordAttempt(rateLimitKey);
            int remaining = rateLimitingService.getRemainingAttempts(rateLimitKey);

            log.warn("Failed login attempt for user: {} from IP: {}. Remaining attempts: {}",
                    loginRequest.getUsername(), clientIp, remaining);

            Map<String, Object> error = new HashMap<>();
            error.put("error", "Credenciales inválidas");
            error.put("remainingAttempts", remaining);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "No autenticado"));
        }

        String username = auth.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Map<String, Object> response = new HashMap<>();
        response.put("username", user.getUsername());
        response.put("role", user.getRole());
        response.put("sellerId", user.getSellerId());
        response.put("sellerName", user.getSellerName());
        response.put("lastLogin", user.getLastLogin());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("valid", false));
        }

        String token = authHeader.substring(7);
        boolean valid = jwtUtil.validateToken(token);

        return ResponseEntity.ok(Map.of("valid", valid));
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}
