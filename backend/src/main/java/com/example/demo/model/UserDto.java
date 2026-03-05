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

    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPass() { return pass; }
    public String getConfirmPass() { return confirmPass; }

    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
    public void setPass(String pass) { this.pass = pass; }
    public void setConfirmPass(String confirmPass) { this.confirmPass = confirmPass; }
}
