package com.example.demo.Controllers;

import com.example.demo.model.LoginRequest;
import com.example.demo.model.UserDto;
import com.example.demo.service.UserService;
import com.example.demo.service.VerificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private VerificationService verificationService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);

            HttpSession session = httpRequest.getSession(true);
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

            return ResponseEntity.ok("Вход выполнен успешно!");
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Неверный логин или пароль");
        }
    }

    // Шаг 1: отправить код на email
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody UserDto userDto) {
        try {
            verificationService.initiateRegistration(userDto);
            return ResponseEntity.ok("Код отправлен на " + userDto.getEmail());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Шаг 2: подтвердить код и создать аккаунт
    @PostMapping("/verify")
    public ResponseEntity<String> verify(@RequestBody VerifyRequest request) {
        try {
            UserDto userDto = verificationService.verifyCode(request.getEmail(), request.getCode());
            userService.registerUser(userDto);
            verificationService.removePending(request.getEmail());
            return ResponseEntity.ok("Регистрация завершена! Войдите в аккаунт.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public static class VerifyRequest {
        private String email;
        private String code;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
    }
}
