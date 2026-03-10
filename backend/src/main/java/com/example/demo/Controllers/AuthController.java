package com.example.demo.Controllers;

import com.example.demo.model.LoginRequest;
import com.example.demo.model.UserDto;
import com.example.demo.service.UserService;
import com.example.demo.service.VerificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.data.redis.core.RedisTemplate;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final VerificationService verificationService;
    private final RedisTemplate<String, Object> redisTemplate;

    public AuthController(
            UserService userService,
            AuthenticationManager authenticationManager,
            VerificationService verificationService,
            RedisTemplate<String, Object> redisTemplate) {

        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.verificationService = verificationService;
        this.redisTemplate = redisTemplate;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        try {

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            HttpSession session = httpRequest.getSession(true);
            session.setAttribute(
                    HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY,
                    SecurityContextHolder.getContext()
            );

            return ResponseEntity.ok("Вход выполнен успешно!");

        } catch (Exception e) {
            return ResponseEntity.status(401).body("Неверный логин или пароль");
        }
    }

    // Шаг 1: отправить код на email
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody UserDto userDto) {

        String rateKey = "register:rate:" + userDto.getEmail();

        Boolean exists = redisTemplate.hasKey(rateKey);

        if (Boolean.TRUE.equals(exists)) {
            return ResponseEntity
                    .badRequest()
                    .body("Код уже был отправлен. Подождите 60 секунд.");
        }

        try {

            verificationService.initiateRegistration(userDto);

            // блокируем повторную отправку на 60 секунд
            redisTemplate.opsForValue().set(rateKey, "1", 60, TimeUnit.SECONDS);

            return ResponseEntity.ok("Код отправлен на " + userDto.getEmail());

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Шаг 2: подтвердить код и создать аккаунт
    @PostMapping("/verify")
    public ResponseEntity<String> verify(@RequestBody VerifyRequest request) {
        try {

            UserDto userDto = verificationService.verifyCode(
                    request.getEmail(),
                    request.getCode()
            );

            userService.registerUser(userDto);
            verificationService.removePending(request.getEmail());

            return ResponseEntity.ok("Регистрация завершена! Войдите в аккаунт.");

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/account")
    public ResponseEntity<String> deleteAccount(HttpServletRequest request, Authentication authentication) {
        try {

            String email = authentication.getName();
            userService.deleteByEmail(email);

            HttpSession session = request.getSession(false);
            if (session != null) session.invalidate();

            return ResponseEntity.ok("Аккаунт удалён.");

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Ошибка при удалении аккаунта.");
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