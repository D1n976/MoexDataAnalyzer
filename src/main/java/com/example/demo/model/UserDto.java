package com.example.demo.model;

import lombok.Data;
import org.jspecify.annotations.Nullable;

@Data
public class UserDto {
    private String name;
    private String email;
    private String pass;
    private String confirmPass;

    public boolean passwordsMatch() {
        return pass != null && pass.equals(confirmPass);
    }

    // Метод для проверки, что все обязательные поля заполнены (базовая проверка)
    public boolean isComplete() {
        return name != null && !name.isBlank() &&
                email != null && !email.isBlank() &&
                pass != null && !pass.isBlank();
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public @Nullable CharSequence getPass() {
        return pass;
    }
}