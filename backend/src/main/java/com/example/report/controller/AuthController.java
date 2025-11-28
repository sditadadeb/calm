package com.example.report.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    // Usuarios hardcodeados
    private static final Map<String, UserInfo> USERS = new HashMap<>();

    static {
        USERS.put("people", new UserInfo("people", "NumiaPeople2025!", "People", "Recursos Humanos"));
        USERS.put("gerencia", new UserInfo("gerencia", "NumiaGerencia2025!", "Gerencia", "Dirección General"));
        USERS.put("lider", new UserInfo("lider", "NumiaLider2025!", "Líder", "Team Lead"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        UserInfo user = USERS.get(request.getUsername());
        
        if (user == null || !user.password.equals(request.getPassword())) {
            return ResponseEntity.status(401).body(Map.of(
                "success", false,
                "message", "Usuario o contraseña incorrectos"
            ));
        }

        return ResponseEntity.ok(Map.of(
            "success", true,
            "user", Map.of(
                "username", user.username,
                "displayName", user.displayName,
                "role", user.role
            )
        ));
    }

    // Request DTO
    public static class LoginRequest {
        private String username;
        private String password;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    // User info
    private static class UserInfo {
        String username;
        String password;
        String displayName;
        String role;

        UserInfo(String username, String password, String displayName, String role) {
            this.username = username;
            this.password = password;
            this.displayName = displayName;
            this.role = role;
        }
    }
}

