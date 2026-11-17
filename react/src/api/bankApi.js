import axios from "axios";
import { createParser } from "eventsource-parser";

// 서버에서 받은 최종 결과의 형식 확인
function validateResult(data) {
  const probability = data?.churn_probability;
  const f1 = data?.metrics?.f1;

  if (
    ![0, 1].includes(data?.prediction) ||
    !Number.isFinite(probability) ||
    probability < 0 ||
    probability > 1 ||
    !Number.isFinite(f1) ||
    f1 < 0 ||
    f1 > 1
  ) {
    throw new Error("서버의 예측 결과 또는 F1 형식이 올바르지 않습니다.");
  }
}

export async function predictBank(
  customer,
  { signal, onStatus, onResult }
) {
  // axios로 POST 요청하고 응답 스트림을 받음
  const response = await axios.post(
    "/api/bank/predict/stream",
    customer,
    {
      adapter: "fetch",
      responseType: "stream",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      signal,
    }
  );

  const stream = response.data;
  const contentType = String(response.headers["content-type"] ?? "");

  if (!contentType.includes("text/event-stream")) {
    await stream?.cancel?.().catch(() => {});
    throw new Error("서버가 SSE 형식으로 응답하지 않았습니다.");
  }

  if (!stream || typeof stream.getReader !== "function") {
    throw new Error("브라우저에서 응답 스트림을 읽을 수 없습니다.");
  }

  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");

  let resultReceived = false;

  const parser = createParser({
    onEvent(event) {
      // 이번 API에서 사용하는 이벤트만 처리
      if (!["status", "result", "error"].includes(event.event)) {
        return;
      }

      if (resultReceived) {
        return;
      }

      let data;

      try {
        data = JSON.parse(event.data);
      } catch {
        throw new Error("서버 이벤트의 JSON 형식이 올바르지 않습니다.");
      }

      if (event.event === "error") {
        throw new Error(
          typeof data?.message === "string"
            ? data.message
            : "예측 처리 중 오류가 발생했습니다."
        );
      }

      if (event.event === "status") {
        onStatus(
          typeof data?.message === "string"
            ? data.message
            : "예측 처리 중입니다."
        );
      }

      if (event.event === "result") {
        validateResult(data);
        resultReceived = true;
        onResult(data);
      }
    },
  });

  try {
    while (!resultReceived) {
      const { value, done } = await reader.read();

      if (done) {
        // 디코더에 남아 있는 문자 처리
        parser.feed(decoder.decode());
        break;
      }

      // 한글이나 SSE 이벤트가 청크 경계에서 잘려도 처리
      parser.feed(decoder.decode(value, { stream: true }));
    }

    if (signal.aborted) {
      throw new DOMException("요청을 취소했습니다.", "AbortError");
    }

    if (!resultReceived) {
      throw new Error("최종 예측 결과를 받기 전에 연결이 종료되었습니다.");
    }
  } finally {
    // 완료·취소·오류 시 스트림 정리
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}