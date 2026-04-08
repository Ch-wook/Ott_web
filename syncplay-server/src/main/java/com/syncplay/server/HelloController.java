package com.syncplay.server;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    @GetMapping("/api/test")
    public String testApi() {
        return "SyncPlay 스프링 부트 서버가 정상적으로 작동 중입니다!";
    }
}