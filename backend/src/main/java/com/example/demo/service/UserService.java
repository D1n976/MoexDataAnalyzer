package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.model.UserDto;
import com.example.demo.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // Рекомендуемый способ: всё через конструктор, убираем @Autowired с полей
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> getUsers() {
        return userRepository.findAll();
    }

    public void registerUser(UserDto userDto) {
        // 1. Проверяем совпадение паролей через метод в DTO
        if (!userDto.passwordsMatch()) {
            throw new RuntimeException("Пароли не совпадают!");
        }

        // 2. Ищем только по Email (через existsByEmail в репозитории)
        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new RuntimeException("Пользователь с почтой " + userDto.getEmail() + " уже существует");
        }

        // 3. Создаем сущность
        User user = new User();
        user.setName(userDto.getName());
        user.setEmail(userDto.getEmail());
        user.setPass(passwordEncoder.encode(userDto.getPass()));

        userRepository.save(user);
    }

    public void deleteByEmail(String email) {
        userRepository.findByEmail(email).ifPresent(userRepository::delete);
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Пользователь с Email: " + email + " не найден"));
    }
}