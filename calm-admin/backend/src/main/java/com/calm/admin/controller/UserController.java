package com.calm.admin.controller;

import com.calm.admin.model.User;
import com.calm.admin.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Lista todos los usuarios (solo ADMIN)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<Map<String, Object>> users = userRepository.findAll().stream()
                .map(user -> {
                    Map<String, Object> dto = new HashMap<>();
                    dto.put("id", user.getId());
                    dto.put("username", user.getUsername());
                    dto.put("role", user.getRole());
                    dto.put("enabled", user.getEnabled());
                    dto.put("createdAt", user.getCreatedAt());
                    dto.put("lastLogin", user.getLastLogin());
                    return dto;
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(users);
    }

    /**
     * Crea un nuevo usuario (solo ADMIN)
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        String role = request.getOrDefault("role", "USER");

        // Validaciones
        if (username == null || username.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El nombre de usuario es requerido"));
        }
        if (password == null || password.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "La contraseña debe tener al menos 6 caracteres"));
        }
        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body(Map.of("error", "El nombre de usuario ya existe"));
        }

        // Validar rol
        if (!role.equals("ADMIN") && !role.equals("USER")) {
            role = "USER";
        }

        User user = new User();
        user.setUsername(username.trim());
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setEnabled(true);

        userRepository.save(user);
        log.info("Usuario creado: {} con rol {}", username, role);

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("role", user.getRole());
        response.put("message", "Usuario creado exitosamente");

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Elimina un usuario (solo ADMIN)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElse(null);

        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        // No permitir eliminar al único admin
        if (user.getRole().equals("ADMIN")) {
            long adminCount = userRepository.findAll().stream()
                    .filter(u -> u.getRole().equals("ADMIN"))
                    .count();
            if (adminCount <= 1) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "No se puede eliminar el único administrador"));
            }
        }

        userRepository.delete(user);
        log.info("Usuario eliminado: {}", user.getUsername());

        return ResponseEntity.ok(Map.of("message", "Usuario eliminado exitosamente"));
    }

    /**
     * Actualiza el rol de un usuario (solo ADMIN)
     */
    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String newRole = request.get("role");

        if (newRole == null || (!newRole.equals("ADMIN") && !newRole.equals("USER"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Rol inválido. Use ADMIN o USER"));
        }

        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        // No permitir degradar al único admin
        if (user.getRole().equals("ADMIN") && newRole.equals("USER")) {
            long adminCount = userRepository.findAll().stream()
                    .filter(u -> u.getRole().equals("ADMIN"))
                    .count();
            if (adminCount <= 1) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "No se puede degradar al único administrador"));
            }
        }

        user.setRole(newRole);
        userRepository.save(user);
        log.info("Rol actualizado para {}: {}", user.getUsername(), newRole);

        return ResponseEntity.ok(Map.of(
                "message", "Rol actualizado",
                "username", user.getUsername(),
                "role", user.getRole()
        ));
    }
}
