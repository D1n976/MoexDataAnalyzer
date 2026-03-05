package com.example.demo.model;

import lombok.Data;

@Data
public class UserDto {
    private String name;
    private String email;
    private String pass;
    private String confirmPass;

    public boolean passwordsMatch() {
        return pass != null && pass.equals(confirmPass);
    }
}