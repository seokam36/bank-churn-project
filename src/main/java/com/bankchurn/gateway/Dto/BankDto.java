package com.bankchurn.gateway.Dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor 
@AllArgsConstructor 
@Builder 
@Data 
public class BankDto {
    // 신용점수
    @NotNull
    @PositiveOrZero
    private Integer credit_score;

    // 국가
    @NotBlank
    @Pattern(regexp = "France|Spain|Germany")
    private String country;

    // 성별
    @NotBlank
    @Pattern(regexp = "Female|Male")
    private String gender;

    // 나이
    @NotNull
    @Min(1)
    private Integer age;

    // 은행 이용 기간
    @NotNull
    @PositiveOrZero
    private Integer tenure;

    // 계좌 잔액
    @NotNull
    @PositiveOrZero
    private BigDecimal balance;

    // 이용 금융상품 수
    @NotNull
    @Min(1)
    private Integer products_number;

    // 신용카드 보유 여부: 0 또는 1
    @NotNull
    @Min(0)
    @Max(1)
    private Integer credit_card;

    // 활성 고객 여부: 0 또는 1
    @NotNull
    @Min(0)
    @Max(1)
    private Integer active_member;

    // 추정 급여
    @NotNull
    @PositiveOrZero
    private BigDecimal estimated_salary;
}

