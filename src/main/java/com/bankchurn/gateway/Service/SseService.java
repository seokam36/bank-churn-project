package com.bankchurn.gateway.Service;

import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.bankchurn.gateway.Dto.BankDto;

import reactor.core.publisher.Flux;

@Service("bankSseService")
public class SseService {

    private static final Logger log = LoggerFactory.getLogger(SseService.class);

    // FastAPI의 응답을 SSE 이벤트로 읽기 위한 타입
    private static final ParameterizedTypeReference<ServerSentEvent<String>>
    SSE_TYPE = new ParameterizedTypeReference<ServerSentEvent<String>>() {};

    private final WebClient webClient;
    private final String predictPath;

    public SseService(
        WebClient.Builder builder,
        @Value("${ai.base-url}") String baseUrl,
        @Value("${ai.predict-path}") String predictPath
    ) {
        this.webClient = builder
                .baseUrl(baseUrl)
                .build();
        this.predictPath = predictPath;
    }

    public Flux<ServerSentEvent<String>> predict(BankDto request) {
        return webClient.post()
                .uri(predictPath)

                // 고객 정보를 JSON으로 보냄
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)

                // FastAPI에 SSE 응답을 요청
                .accept(MediaType.TEXT_EVENT_STREAM)
                .retrieve()

                // SSE 이벤트를 하나씩 읽음
                .bodyToFlux(SSE_TYPE)

                // 첫 이벤트 또는 다음 이벤트를 30초 동안 못 받으면 오류
                .timeout(Duration.ofSeconds(30))

                // FastAPI 통신 실패 시 오류 이벤트 반환
                .onErrorResume(error -> {
                    log.warn(
                            "FastAPI 통신 오류: {}",
                            error.getClass().getSimpleName()
                    );
                    ServerSentEvent<String> errorEvent =
                            ServerSentEvent.<String>builder()
                                .event("error")
                                .data(
                                "{\"message\":\"AI 서버 통신 실패\"}"
                                )
                                .build();
                    return Flux.just(errorEvent);
                });
    }
}