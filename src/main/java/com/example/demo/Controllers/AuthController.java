package com.example.demo.Controllers;

import com.example.demo.model.LoginRequest;
import com.example.demo.model.UserDto;
import com.example.demo.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

@RestController // МЕНЯЕМ ТУТ
@RequestMapping("/api/auth") // Группируем эндпоинты
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true") // Разрешаем фронтенду доступ
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuthenticationManager authenticationManager;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            return ResponseEntity.ok("Вход выполнен успешно!");
        } catch (Exception e) {
            System.out.println("Ошибка аутентификации: " + e.getMessage());
            return ResponseEntity.status(401).body("Неверный логин или пароль");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody UserDto userDto) {
        userService.registerUser(userDto);
        return ResponseEntity.ok("Пользователь успешно зарегистрирован");
    }
}