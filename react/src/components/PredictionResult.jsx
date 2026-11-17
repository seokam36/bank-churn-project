export default function PredictionResult({ result }) {
  if (!result) {
    return (
      <section className="card empty-result">
        <div className="empty-icon" aria-hidden="true">↗</div>
        <h2>예측 결과를 기다리고 있어요</h2>
        <p>
          고객 정보를 입력하고
          <br />
          ‘이탈 예측 시작’을 눌러 주세요.
        </p>
      </section>
    );
  }

  const isChurn = result.prediction === 1;
  const percent = result.churn_probability * 100;

  return (
    <section className="card result-card">
      <div className="section-header">
        <div>
          <span className="eyebrow">PREDICTION RESULT</span>
          <h2>고객 이탈 예측</h2>
        </div>

        <span className={`result-badge ${isChurn ? "risk" : "safe"}`}>
          {isChurn ? "이탈 예상" : "유지 예상"}
        </span>
      </div>

      {result.mock === true && (
        <p className="mock-notice">
          테스트 서버가 반환한 가짜 결과입니다. 실제 모델 성능이 아닙니다.
        </p>
      )}

      <p className="metric-label">모델 추정 이탈 확률</p>
      <div className="probability">
        {percent.toFixed(1)}
        <span>%</span>
      </div>

      <div
        className="probability-track"
        role="progressbar"
        aria-label="모델 추정 이탈 확률"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Number(percent.toFixed(1))}
      >
        <div
          className={isChurn ? "risk-fill" : "safe-fill"}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="metric-box">
        <div>
          <strong>모델 F1-Score</strong>
          <p>평가 데이터에서 측정한 성능</p>
        </div>
        <span>{result.metrics.f1.toFixed(3)}</span>
      </div>

      <p className="result-note">
        F1은 모델 전체의 평가 지표이며, 이 고객에 대한 예측 신뢰도와는 다릅니다.
      </p>
    </section>
  );
}