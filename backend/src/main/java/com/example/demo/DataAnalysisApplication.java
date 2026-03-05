package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan("com.example.demo") // Forces Spring to look for @Entity
@EnableJpaRepositories("com.example.demo.repository")
public class DataAnalysisApplication {
	public static void main(String[] args) {
		SpringApplication.run(DataAnalysisApplication.class, args);
	}
}
