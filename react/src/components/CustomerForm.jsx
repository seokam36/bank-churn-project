const numberFields = [
  {
    name: "credit_score",
    label: "신용점수",
    placeholder: "350 ~ 850 (예: 650)",
    min: 350,
    max: 850,
    step: 1,
  },
  {
    name: "age",
    label: "나이",
    placeholder: "18 ~ 92 (예: 40)",
    min: 18,
    max: 92,
    step: 1,
  },
  {
    name: "balance",
    label: "계좌 잔액",
    placeholder: "0 ~ 250,898 (예: 100000)",
    min: 0,
    max: 250898,
    step: "any",
  },
  {
    name: "estimated_salary",
    label: "추정 급여",
    placeholder: "0 ~ 199,992 (예: 60000)",
    min: 0,
    max: 199992,
    step: "any",
  },
];
// min / max : 학습 데이터 범위 (범위 밖 값은 모델이 본 적 없어서 예측을 믿기 어려움)

const selectFields = [
  {
    name: "tenure",
    label: "은행 이용 기간",
    options: Array.from({ length: 11 }, (_, i) => [String(i), `${i}년`]),
  },
  {
    name: "products_number",
    label: "이용 금융상품 수",
    options: [
      ["1", "1개"],
      ["2", "2개"],
      ["3", "3개"],
      ["4", "4개"],
    ],
  },
  {
    name: "country",
    label: "국가",
    options: [
      ["France", "프랑스"],
      ["Spain", "스페인"],
      ["Germany", "독일"],
    ],
  },
  {
    name: "gender",
    label: "성별",
    options: [
      ["Female", "여성"],
      ["Male", "남성"],
    ],
  },
  {
    name: "credit_card",
    label: "신용카드 보유",
    options: [
      ["1", "보유"],
      ["0", "미보유"],
    ],
  },
  {
    name: "active_member",
    label: "활성 고객 여부",
    options: [
      ["1", "활성 고객"],
      ["0", "비활성 고객"],
    ],
  },
];

export default function CustomerForm({
  form,
  loading,
  onChange,
  onSubmit,
  onSample,
  onReset,
  onCancel,
}) {
  return (
    <section className="card">
      <div className="section-header">
        <div>
          <span className="eyebrow">CUSTOMER PROFILE</span>
          <h2>고객 정보 입력</h2>
        </div>
        <span className="small-badge">10개 항목</span>
      </div>

      <p className="description">
        고객 정보를 입력하면 이탈 여부와 모델 추정 확률을 확인할 수 있습니다.
      </p>

      <form onSubmit={onSubmit}>
        <fieldset disabled={loading}>
          <legend className="sr-only">고객 정보</legend>

          <div className="form-grid">
            {numberFields.map((field) => (
              <label className="field" key={field.name}>
                <span>{field.label}</span>
                <input
                  name={field.name}
                  type="number"
                  value={form[field.name]}
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  required
                  onChange={onChange}
                />
              </label>
            ))}

            {selectFields.map((field) => (
              <label className="field" key={field.name}>
                <span>{field.label}</span>
                <select
                  name={field.name}
                  value={form[field.name]}
                  required
                  onChange={onChange}
                >
                  <option value="">선택해 주세요</option>
                  {field.options.map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <p className="input-note">
            금액은 데이터셋의 기준 단위로 입력해 주세요.
          </p>

          <div className="secondary-actions">
            <button
              type="button"
              className="button secondary"
              onClick={onSample}
            >
              샘플 입력
            </button>

            <button
              type="button"
              className="button secondary"
              onClick={onReset}
            >
              초기화
            </button>
          </div>
        </fieldset>

        <div className="submit-actions">
          <button
            type="submit"
            className="button primary"
            disabled={loading}
          >
            {loading ? "예측 진행 중…" : "이탈 예측 시작"}
          </button>

          {loading && (
            <button
              type="button"
              className="button cancel"
              onClick={onCancel}
            >
              요청 취소
            </button>
          )}
        </div>
      </form>
    </section>
  );
}