package com.example.demo.service;

import com.example.demo.model.UserDto;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class VerificationService {

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;

    @Value("${app.mail.from}")
    private String from;

    private final Map<String, PendingVerification> pending = new ConcurrentHashMap<>();

    public VerificationService(JavaMailSender mailSender, UserRepository userRepository) {
        this.mailSender = mailSender;
        this.userRepository = userRepository;
    }

    public void initiateRegistration(UserDto userDto) {
        if (!userDto.passwordsMatch()) {
            throw new RuntimeException("Пароли не совпадают");
        }
        if (userRepository.existsByEmail(userDto.getEmail())) {
            throw new RuntimeException("Пользователь с такой почтой уже существует");
        }
        if (userRepository.existsByName(userDto.getName())) {
            throw new RuntimeException("Имя \"" + userDto.getName() + "\" уже занято");
        }

        String code = String.format("%06d", new Random().nextInt(1_000_000));
        pending.put(userDto.getEmail(), new PendingVerification(code, LocalDateTime.now().plusMinutes(10), userDto));

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(userDto.getEmail());
        message.setSubject("Код подтверждения регистрации");
        message.setText("Ваш код подтверждения: " + code + "\n\nКод действителен 10 минут.");
        mailSender.send(message);
    }

    public UserDto verifyCode(String email, String code) {
        PendingVerification pv = pending.get(email);
        if (pv == null) {
            throw new RuntimeException("Код не найден. Начните регистрацию заново.");
        }
        if (LocalDateTime.now().isAfter(pv.expiry)) {
            pending.remove(email);
            throw new RuntimeException("Код истёк. Начните регистрацию заново.");
        }
        if (!pv.code.equals(code)) {
            throw new RuntimeException("Неверный код подтверждения.");
        }
        return pv.userDto;
    }

    public void removePending(String email) {
        pending.remove(email);
    }

    public static class PendingVerification {
        public final String code;
        public final LocalDateTime expiry;
        public final UserDto userDto;

        public PendingVerification(String code, LocalDateTime expiry, UserDto userDto) {
            this.code = code;
            this.expiry = expiry;
            this.userDto = userDto;
        }
    }
}
