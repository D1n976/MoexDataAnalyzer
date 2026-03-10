package com.example.demo.service;

import com.example.demo.model.UserDto;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
public class VerificationService {

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${app.mail.from}")
    private String from;

    public VerificationService(JavaMailSender mailSender,
                               UserRepository userRepository,
                               RedisTemplate<String, Object> redisTemplate) {
        this.mailSender = mailSender;
        this.userRepository = userRepository;
        this.redisTemplate = redisTemplate;
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

        PendingVerification pv = new PendingVerification(code, userDto);

        String key = "verify:" + userDto.getEmail();

        redisTemplate.opsForValue().set(key, pv, 10, TimeUnit.MINUTES);

        sendMail(userDto.getEmail(), code);
    }

    public UserDto verifyCode(String email, String code) {

        String key = "verify:" + email;

        PendingVerification pv = (PendingVerification) redisTemplate.opsForValue().get(key);

        if (pv == null) {
            throw new RuntimeException("Код не найден или истёк");
        }

        if (!pv.code.equals(code)) {
            throw new RuntimeException("Неверный код подтверждения");
        }

        return pv.userDto;
    }

    public void removePending(String email) {
        redisTemplate.delete("verify:" + email);
    }

    private void sendMail(String email, String code) {

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject("Код подтверждения регистрации");
        message.setText("Ваш код подтверждения: " + code + "\n\nКод действителен 10 минут.");

        mailSender.send(message);
    }

    public static class PendingVerification {

        public String code;
        public UserDto userDto;

        public PendingVerification(String code, UserDto userDto) {
            this.code = code;
            this.userDto = userDto;
        }
    }
}