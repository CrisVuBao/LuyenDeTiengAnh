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
      : Math.max(0.5, prevInterval);
  const prevDifficulty = clamp(cardState.difficulty || 5.0, 1.0, 10.0);

  let newDifficulty;
  let newStability;

  if (prevReviewCount === 0) {
    newDifficulty = clamp(5.0 - 0.8 * (rating - 3), 1.0, 10.0);
    const initialStabilities = { 1: 1.0, 2: 2.0, 3: 4.0, 4: 8.0 };
    newStability = initialStabilities[rating] || 3.0;
  } else {
    const deltaD = -0.9 * (rating - 3);
    newDifficulty = clamp(0.9 * (prevDifficulty + deltaD) + 0.1 * 5.0, 1.0, 10.0);

    const lastMs = cardState.lastReviewedAt ? new Date(cardState.lastReviewedAt).getTime() : NaN;
    const elapsedDays = !isNaN(lastMs)
      ? Math.max(0.1, (Date.now() - lastMs) / (1000 * 3600 * 24))
      : prevStability;
    const r = Math.pow(1 + (19 / 81) * (elapsedDays / Math.max(0.5, prevStability)), -0.5);
    const effectiveR = Math.min(0.9, clamp(r, 0.1, 0.99));

    if (rating === 1) {
      newStability = Math.max(
        1.0,
        1.8 *
          Math.pow(newDifficulty, -0.2) *
          (Math.pow(prevStability + 1.0, 0.2) - 1.0) *
          Math.exp(0.2 * (1.0 - effectiveR))
      );
    } else {
      const hardPenalty = rating === 2 ? 0.45 : 1.0;
      const easyBonus = rating === 4 ? 1.35 : 1.0;
      const growthFactor =
        Math.exp(1.65) *
        (11.0 - newDifficulty) *
        Math.pow(prevStability, -0.18) *
        (Math.exp(0.9 * (1.0 - effectiveR)) - 1.0) *
        hardPenalty *
        easyBonus;
      newStability = prevStability * (1.0 + Math.max(0.15, growthFactor));
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
      intervalDays =
        prevReviewCount === 0
          ? 2
          : Math.max(prevInterval + 1, Math.min(targetInterval, Math.ceil(prevInterval * 1.4)));
    } else if (rating === 3) {
      intervalDays = prevReviewCount === 0 ? 4 : Math.max(prevInterval + 2, targetInterval);
    } else {
      intervalDays = prevReviewCount === 0 ? 8 : Math.max(prevInterval + 4, targetInterval);
    }
    intervalDays = clamp(intervalDays, 1, 365);
  }

  const now = Date.now();
  const nextReviewMs =
    rating === 1 && !isDayMinimum
      ? now + 10 * 60 * 1000 // 10 minutes for immediate re-consolidation
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
