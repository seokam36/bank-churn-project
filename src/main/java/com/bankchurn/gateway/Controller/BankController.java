package com.bankchurn.gateway.Controller;

import java.util.Map;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bankchurn.gateway.Dto.BankDto;
import com.bankchurn.gateway.Service.SseService;

import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/bank")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class BankController {

    private final SseService sseService;

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    // 고객 정보 수신 → FastAPI 호출 → SSE 응답
    @PostMapping(
        value = "/predict/stream",
        consumes = MediaType.APPLICATION_JSON_VALUE,
        produces = MediaType.TEXT_EVENT_STREAM_VALUE
    )
    public Flux<ServerSentEvent<String>> predict(
        @Valid @RequestBody BankDto request,
        ServerHttpResponse response
    ) {
        // 스트리밍 응답을 캐시하지 않도록 설정
        response.getHeaders().setCacheControl("no-cache");
        // 지원하는 프록시에 버퍼링하지 않도록 요청
        response.getHeaders().set("X-Accel-Buffering", "no");
        return sseService.predict(request);
    }
}
