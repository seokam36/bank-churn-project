import { useEffect, useRef, useState } from "react";

import { predictBank } from "./api/bankApi";
import CustomerForm from "./components/CustomerForm";
import PredictionResult from "./components/PredictionResult";

import "./App.css";

const EMPTY_FORM = {
  credit_score: "",
  country: "",
  gender: "",
  age: "",
  tenure: "",
  balance: "",
  products_number: "",
  credit_card: "",
  active_member: "",
  estimated_salary: "",
};

const SAMPLE_FORM = {
  credit_score: "650",
  country: "France",
  gender: "Female",
  age: "40",
  tenure: "5",
  balance: "100000",
  products_number: "2",
  credit_card: "1",
  active_member: "1",
  estimated_salary: "60000",
};

const STATUS_LABELS = {
  idle: "대기",
  loading: "진행 중",
  success: "완료",
  error: "오류",
  cancelled: "취소",
};

function toPayload(form) {
  // 빈 값이 숫자 0으로 바뀌는 것을 방지
  if (Object.values(form).some((value) => value.trim() === "")) {
    throw new Error("모든 입력 항목을 작성해 주세요.");
  }

  const payload = {
    ...form,
    credit_score: Number(form.credit_score),
    age: Number(form.age),
    tenure: Number(form.tenure),
    balance: Number(form.balance),
    products_number: Number(form.products_number),
    credit_card: Number(form.credit_card),
    active_member: Number(form.active_member),
    estimated_salary: Number(form.estimated_salary),
  };

  for (const [key, value] of Object.entries(payload)) {
    if (key !== "country" && key !== "gender" && !Number.isFinite(value)) {
      throw new Error("숫자 입력값을 확인해 주세요.");
    }
  }

  return payload;
}

function getErrorMessage(error) {
  const status = error?.response?.status;

  if (status === 400) {
    return "입력값이 올바르지 않습니다. 각 항목을 확인해 주세요.";
  }

  if (status === 401 || status === 403) {
    return "API 접근이 거부되었습니다. 서버의 인증·접근 설정을 확인해 주세요.";
  }

  if (status === 404) {
    return "예측 API를 찾을 수 없습니다. Spring의 경로를 확인해 주세요.";
  }

  if (status >= 500) {
    return "서버 연결 또는 처리에 실패했습니다. Spring 실행 상태를 확인해 주세요.";
  }

  if (error?.code === "ERR_NETWORK") {
    return "서버에 연결할 수 없습니다. 네트워크와 서버 실행 상태를 확인해 주세요.";
  }

  return error?.message || "예측 중 알 수 없는 오류가 발생했습니다.";
}

export default function App() {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [status, setStatus] = useState("idle");
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const abortRef = useRef(null);
  const loading = status === "loading";

  // 화면을 떠나면 진행 중 요청 취소
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  function addLog(message) {
    setLogs((previous) => [
      ...previous.slice(-19),
      {
        message,
        time: new Date().toLocaleTimeString("ko-KR"),
      },
    ]);
  }

  function clearOutput() {
    setStatus("idle");
    setLogs([]);
    setResult(null);
    setError("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    // 입력이 바뀌면 이전 고객의 결과를 지움
    clearOutput();
  }

  function handleSample() {
    setForm({ ...SAMPLE_FORM });
    clearOutput();
  }

  function handleReset() {
    setForm({ ...EMPTY_FORM });
    clearOutput();
  }

  function handleCancel() {
    abortRef.current?.abort();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // 빠르게 여러 번 눌러도 중복 요청 방지
    if (abortRef.current) {
      return;
    }

    let customer;

    try {
      customer = toPayload(form);
    } catch (validationError) {
      setError(validationError.message);
      setStatus("error");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setError("");
    setResult(null);
    setLogs([]);

    addLog("예측 요청을 전송했습니다.");

    try {
      await predictBank(customer, {
        signal: controller.signal,

        onStatus(message) {
          addLog(message);
        },

        onResult(data) {
          setResult(data);
          addLog("최종 예측 결과를 수신했습니다.");
        },
      });

      setStatus("success");
    } catch (requestError) {
      setResult(null);

      if (controller.signal.aborted) {
        setStatus("cancelled");
        addLog("요청을 취소했습니다.");
      } else {
        setStatus("error");
        setError(getErrorMessage(requestError));
        addLog("예측 요청을 완료하지 못했습니다.");
      }
    } finally {
      abortRef.current = null;
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">B</span>
          <span>Bank Insight</span>
        </div>
        <span className="topbar-label">고객 이탈 예측</span>
      </header>

      <main className="page">
        <section className="hero">
          <span className="eyebrow">CUSTOMER ANALYTICS</span>
          <h1>고객 데이터를 바탕으로<br />이탈 가능성을 확인하세요.</h1>
          <p>
            고객 특성을 입력하고 실시간 진행 상태와 예측 결과를 확인해 보세요.
          </p>
        </section>

        <div className="dashboard">
          <CustomerForm
            form={form}
            loading={loading}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onSample={handleSample}
            onReset={handleReset}
            onCancel={handleCancel}
          />

          <div className="right-column">
            <section className="card status-card">
              <div className="section-header">
                <h2>예측 진행 상태</h2>
                <span
                  className={`status-badge ${status}`}
                  role="status"
                  aria-live="polite"
                >
                  {loading && <span className="spinner" />}
                  {STATUS_LABELS[status]}
                </span>
              </div>

              <ol className="log-list" role="log" aria-live="polite">
                {logs.length === 0 ? (
                  <li className="log-empty">
                    예측을 시작하면 진행 상태가 표시됩니다.
                  </li>
                ) : (
                  logs.map((log, index) => (
                    <li key={index}>
                      <span className="log-dot" aria-hidden="true" />
                      <span>{log.message}</span>
                      <time>{log.time}</time>
                    </li>
                  ))
                )}
              </ol>
            </section>

            {error && (
              <div className="error-alert" role="alert">
                <strong>요청을 확인해 주세요</strong>
                <p>{error}</p>
              </div>
            )}

            <PredictionResult result={result} />
          </div>
        </div>

        <footer>
          LightGBM 기반 고객 이탈 예측 · 모델 평가는 F1-Score를 사용합니다.
        </footer>
      </main>
    </div>
  );
}