/**
 * FSRS v4.5 / v5 (Free Spaced Repetition Scheduler) Engine
 * Thay thế thuật toán SM-2 (1987) bằng mô hình Trí nhớ 3 Thành phần DSR:
 * - D (Difficulty): Độ khó nội tại của thẻ (1.0 -> 10.0)
 * - S (Stability): Độ bền trí nhớ tính bằng số ngày để xác suất nhớ giảm xuống 90%
 * - R (Retrievability): Xác suất gợi nhớ thành công tại thời điểm hiện tại (0% -> 100%)
 */

const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

export function formatFsrsInterval(days, isAgain = false, isDayMinimum = false) {
  if (isAgain && !isDayMinimum) {
    return '10 phút';
  }
  const d = Math.max(1, Math.round(days || 1));
  if (d === 1) return '1 ngày';
  if (d < 30) return `${d} ngày`;
  if (d < 365) {
    const months = Math.round((d / 30) * 10) / 10;
    return `${months} tháng`;
  }
  const years = Math.round((d / 365) * 10) / 10;
  return `${years} năm`;
}

export function calculateRetrievability(stabilityDays, lastReviewedAt) {
  if (!lastReviewedAt || !stabilityDays || stabilityDays <= 0) return 100;
  const lastMs = new Date(lastReviewedAt).getTime();
  if (isNaN(lastMs)) return 100;
  const elapsedDays = Math.max(0, (Date.now() - lastMs) / (1000 * 3600 * 24));
  // FSRS v4.5 power forgetting curve: R(t, S) = (1 + (19/81) * (t / S))^(-0.5)
  const r = Math.pow(1 + (19 / 81) * (elapsedDays / Math.max(0.4, stabilityDays)), -0.5);
  return clamp(Math.round(r * 100), 1, 100);
}

export function getCardFsrsMetrics(cardState) {
  if (!cardState) {
    return {
      stability: 0,
      difficulty: 5.0,
      retrievability: 100,
      reviewCount: 0,
      statusLabel: 'Thẻ mới',
      statusColor: 'blue',
      isDue: true
    };
  }

  const reviewCount = cardState.reviewCount ?? cardState.consecutiveCorrect ?? 0;
  const rawStability = cardState.stability ?? (reviewCount > 0 ? Math.max(0.5, cardState.intervalDays || 1) : 0);
  const rawDifficulty = cardState.difficulty ?? 5.0;
  const stability = Math.round(rawStability * 10) / 10;
  const difficulty = clamp(Math.round(rawDifficulty * 10) / 10, 1.0, 10.0);
  const retrievability =
    cardState.retrievability != null
      ? Math.round(cardState.retrievability)
      : reviewCount === 0
      ? 100
      : calculateRetrievability(stability, cardState.lastReviewedAt);

  let statusLabel = 'Thẻ mới';
  let statusColor = 'blue';
  if (reviewCount > 0) {
    if (stability >= 21) {
      statusLabel = 'Siêu trí nhớ';
      statusColor = 'emerald';
    } else if (stability >= 5) {
      statusLabel = 'Trí nhớ ổn định';
      statusColor = 'indigo';
    } else {
      statusLabel = 'Đang củng cố';
      statusColor = 'amber';
    }
  }

  const nextDueMs = cardState.nextReviewDate ? new Date(cardState.nextReviewDate).getTime() : 0;
  const isDue = !nextDueMs || isNaN(nextDueMs) || nextDueMs <= Date.now();

  return {
    stability,
    difficulty,
    retrievability,
    reviewCount,
    statusLabel,
    statusColor,
    isDue
  };
}

/**
 * Tính toán trạng thái FSRS tiếp theo khi người học chọn mức độ nhớ:
 * grade: 0 = Quên hẳn (Again), 1 = Thấy khó (Hard), 2 = Nhớ tốt (Good), 3 = Quá dễ (Easy)
 */
export function scheduleFsrsReview(cardState = {}, grade = 2, isDayMinimum = false) {
  const rating = clamp(grade, 0, 3) + 1; // G ∈ {1, 2, 3, 4}
  const prevReviewCount = cardState.reviewCount ?? cardState.consecutiveCorrect ?? 0;
  const prevConsecutive = cardState.consecutiveCorrect ?? 0;
  const prevInterval = Math.max(1, cardState.intervalDays || 1);
  const prevStability =
    cardState.stability && cardState.stability > 0
      ? cardState.stability
      : prevReviewCount === 0
      ? 0
      : Math.max(0.4, prevInterval);
  const prevDifficulty = clamp(cardState.difficulty || 5.0, 1.0, 10.0);

  let newDifficulty;
  let newStability;

  if (prevReviewCount === 0) {
    // Initial state D_0(G) & S_0(G) chuẩn FSRS v4.5 / v5
    newDifficulty = clamp(5.0 - 1.0 * (rating - 3), 1.0, 10.0);
    // Again: ~9.6 giờ (0.4 ngày), Hard: 1.2 ngày, Good: 3.2 ngày, Easy: 8.0 ngày
    const initialStabilities = { 1: 0.4, 2: 1.2, 3: 3.2, 4: 8.0 };
    newStability = initialStabilities[rating] || 3.2;
  } else {
    // Cập nhật độ khó nội tại D kèm hồi quy về trung bình D=5.0
    const deltaD = -0.8 * (rating - 3);
    newDifficulty = clamp(0.9 * (prevDifficulty + deltaD) + 0.1 * 5.0, 1.0, 10.0);

    const lastMs = cardState.lastReviewedAt ? new Date(cardState.lastReviewedAt).getTime() : NaN;
    const elapsedDays = !isNaN(lastMs)
      ? Math.max(0.0, (Date.now() - lastMs) / (1000 * 3600 * 24))
      : prevStability;
    
    // Retrievability thực tế tại thời điểm ôn
    const rawR = Math.pow(1 + (19 / 81) * (elapsedDays / Math.max(0.4, prevStability)), -0.5);
    const r = clamp(rawR, 0.05, 0.99);

    if (rating === 1) {
      // Lapse (Quên hẳn): Độ bền giảm mạnh về vùng ngắn hạn nhưng bảo lưu phần nào nền tảng
      newStability = Math.max(
        0.4,
        Math.min(
          prevStability * 0.25,
          0.4 * Math.pow(Math.max(1.0, prevStability), 0.3) * Math.pow(newDifficulty, -0.2)
        )
      );
    } else {
      // Recall (Hard / Good / Easy): Hiệu ứng thực hành gợi nhớ (Retrieval Practice)
      const hardPenalty = rating === 2 ? 0.5 : 1.0;
      const easyBonus = rating === 4 ? 1.4 : 1.0;
      // h(R): Ôn càng muộn mà vẫn nhớ được thì độ bền càng tăng mạnh (Spaced Effect)
      // Ôn quá sớm (r ≈ 1) thì h(r) ≈ 0, độ bền hầu như không bị bơm ảo
      const hR = Math.min(2.5, Math.exp(1.0 * (1.0 - r)) - 1.0);
      const difficultyFactor = (11.0 - newDifficulty) / 6.0;
      const stabilityDamping = Math.pow(Math.max(0.4, prevStability), -0.2);

      const growthFactor =
        18.0 *
        difficultyFactor *
        stabilityDamping *
        hR *
        hardPenalty *
        easyBonus;

      newStability = prevStability * (1.0 + Math.max(0.1, growthFactor));
    }
  }

  let intervalDays = 1;
  let consecutiveCorrect = prevConsecutive;

  if (rating === 1) {
    consecutiveCorrect = 0;
    intervalDays = 1;
  } else {
    consecutiveCorrect = prevConsecutive + 1;
    const targetInterval = Math.round(newStability);

    if (rating === 2) {
      // Hard: Giữ nhịp tăng vừa phải, không vượt quá 120% khoảng cách trước
      intervalDays =
        prevReviewCount === 0
          ? 1
          : Math.max(1, Math.min(targetInterval, Math.round(prevInterval * 1.2)));
    } else if (rating === 3) {
      // Good: Khoảng cách tăng tương ứng độ bền mục tiêu (90% retention)
      intervalDays = prevReviewCount === 0 ? 3 : Math.max(prevInterval + 1, targetInterval);
    } else {
      // Easy: Thưởng thêm khoảng cách ôn cho từ quá dễ
      intervalDays = prevReviewCount === 0 ? 8 : Math.max(prevInterval + 2, Math.round(targetInterval * 1.15));
    }
    intervalDays = clamp(intervalDays, 1, 365);
  }

  const now = Date.now();
  const nextReviewMs =
    rating === 1 && !isDayMinimum
      ? now + 10 * 60 * 1000 // 10 phút để củng cố ngay trong ngày
      : now + intervalDays * 24 * 3600 * 1000;

  return {
    stability: Math.round(newStability * 10) / 10,
    difficulty: Math.round(newDifficulty * 10) / 10,
    retrievability: 100,
    intervalDays,
    consecutiveCorrect,
    reviewCount: prevReviewCount + 1,
    lastReviewedAt: new Date(now).toISOString(),
    nextReviewDate: new Date(nextReviewMs).toISOString(),
    intervalLabel: formatFsrsInterval(intervalDays, rating === 1, isDayMinimum)
  };
}

/**
 * Dự báo khoảng thời gian ôn lại cho cả 4 nút (Again / Hard / Good / Easy)
 */
export function getFsrsIntervalPreviews(cardState = {}, isDayMinimum = false) {
  return {
    0: scheduleFsrsReview(cardState, 0, isDayMinimum).intervalLabel,
    1: scheduleFsrsReview(cardState, 1, isDayMinimum).intervalLabel,
    2: scheduleFsrsReview(cardState, 2, isDayMinimum).intervalLabel,
    3: scheduleFsrsReview(cardState, 3, isDayMinimum).intervalLabel
  };
}
