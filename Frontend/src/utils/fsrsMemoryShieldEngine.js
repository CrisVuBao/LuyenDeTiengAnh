/**
 * FSRS Memory Health Shield Engine
 * Triết lý: Endowment Effect (Richard Thaler) + Loss Aversion (Kahneman & Tversky)
 * Biến việc ôn tập flashcard từ "bài tập nhàm chán" thành "bảo vệ tài sản trí nhớ".
 */

import { getCardFsrsMetrics, calculateRetrievability } from './fsrsScheduler';
import vocabData from '../data/vocab3000Data.json';

// Xây dựng bản đồ tra cứu O(1) cho toàn bộ 1,760 từ vựng Oxford 3000
const ALL_WORDS_MAP = {};
if (vocabData?.topics) {
  for (const topic of vocabData.topics) {
    for (const w of topic.words || []) {
      ALL_WORDS_MAP[w.id] = {
        ...w,
        topicId: topic.id,
        topicTitle: topic.title
      };
    }
  }
}

export function getWordDetailById(wordId) {
  return ALL_WORDS_MAP[wordId] || null;
}

/**
 * Tính toán trạng thái Lá Chắn Trí Nhớ FSRS
 * @param {Object} fsrsCards - Map trạng thái FSRS của từng từ { [wordId]: cardState }
 * @param {Object} masteredWords - Map từ đã thuộc { [wordId]: boolean }
 * @returns {Object} Thống kê toàn diện của Lá Chắn Trí Nhớ
 */
export function calculateMemoryShield(fsrsCards = {}, masteredWords = {}) {
  // Tập hợp tất cả ID từ đã từng học hoặc tương tác
  const activeIdsSet = new Set([
    ...Object.keys(masteredWords || {}).filter((k) => masteredWords[k]),
    ...Object.keys(fsrsCards || {})
  ]);

  const activeIds = Array.from(activeIdsSet);
  const totalLearned = activeIds.length;

  if (totalLearned === 0) {
    return {
      totalWords: 0,
      healthPercentage: 100,
      projectedTomorrowPercentage: 100,
      decayDelta: 0,
      solidCount: 0,
      fadingCount: 0,
      criticalCount: 0,
      solidWords: [],
      fadingWords: [],
      criticalWords: [],
      estimatedReviewMinutes: 0,
      tier: {
        code: 'pristine',
        label: 'Trí nhớ đang KHỎE',
        statusColor: 'emerald',
        textColor: 'text-emerald-500 dark:text-emerald-400',
        bgBadge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
        glowColor: 'rgba(16, 185, 129, 0.25)',
        shieldBg: 'from-emerald-500/20 via-teal-500/10 to-slate-900',
        mascotMessage: 'Lá chắn trí nhớ sẵn sàng kích hoạt! Hãy học những từ vựng đầu tiên để xây dựng thành lũy phòng thủ.'
      },
      warningBanner: 'Lá chắn đang ở trạng thái tối ưu 100%!',
      hasDecayRisk: false
    };
  }

  const now = Date.now();
  const solidWords = [];
  const fadingWords = [];
  const criticalWords = [];

  let sumR = 0;
  let sumRTomorrow = 0;

  for (const id of activeIds) {
    const card = fsrsCards[id];
    const wordMeta = ALL_WORDS_MAP[id] || {
      id,
      word: id,
      meaning: 'Từ vựng đã học',
      ipa: ''
    };

    let r = 95;
    let rTomorrow = 90;
    let isDue = false;
    let stability = 2.0;

    if (card) {
      const metrics = getCardFsrsMetrics(card);
      stability = metrics.stability || 2.0;
      r = metrics.retrievability;
      isDue = metrics.isDue;

      // Tính Retrievability dự báo ngày mai nếu không ôn
      const lastMs = card.lastReviewedAt ? new Date(card.lastReviewedAt).getTime() : now;
      const elapsedDaysTomorrow = Math.max(0, (now - lastMs) / (1000 * 3600 * 24)) + 1.0;
      const rTomRaw = Math.pow(1 + (19 / 81) * (elapsedDaysTomorrow / Math.max(0.4, stability)), -0.5);
      rTomorrow = Math.min(100, Math.max(1, Math.round(rTomRaw * 100)));
    } else {
      // Từ đã tick thuộc nhưng chưa qua thẻ FSRS
      r = 95;
      rTomorrow = 90;
      stability = 2.0;
      isDue = false;
    }

    sumR += r;
    sumRTomorrow += rTomorrow;

    const item = {
      ...wordMeta,
      stability,
      retrievability: r,
      retrievabilityTomorrow: rTomorrow,
      isDue,
      lastReviewedAt: card?.lastReviewedAt || null,
      cardState: card || null
    };

    // Phân loại 3 tầng trí nhớ
    if (r < 65 || isDue) {
      criticalWords.push(item);
    } else if (r < 85) {
      fadingWords.push(item);
    } else {
      solidWords.push(item);
    }
  }

  // Sắp xếp từ đỏ theo mức độ nguy cấp nhất (retrievability thấp nhất lên đầu)
  criticalWords.sort((a, b) => a.retrievability - b.retrievability);
  fadingWords.sort((a, b) => a.retrievability - b.retrievability);

  const healthScore = Math.min(100, Math.max(5, Math.round(sumR / totalLearned)));
  const projectedTomorrow = Math.min(100, Math.max(5, Math.round(sumRTomorrow / totalLearned)));
  const decayDelta = Math.max(0, healthScore - projectedTomorrow);
  const criticalCount = criticalWords.length;
  const fadingCount = fadingWords.length;
  const solidCount = solidWords.length;

  const estimatedMinutes = Math.max(1, Math.ceil((criticalCount * 9) / 60));

  let tier;
  let warningBanner;

  if (healthScore >= 85) {
    tier = {
      code: 'pristine',
      label: 'Trí nhớ đang RẤT KHỎE',
      statusColor: 'emerald',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgBadge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      glowColor: 'rgba(16, 185, 129, 0.28)',
      shieldBg: 'from-emerald-500/20 via-teal-500/10 to-slate-900',
      mascotMessage: `Trí nhớ của bạn đang như bàn thạch! ${solidCount}/${totalLearned} từ vựng đã khắc sâu vào dài hạn.`
    };
    warningBanner = criticalCount > 0
      ? `⚠️ Nếu không ôn hôm nay, lá chắn sẽ giảm xuống ${projectedTomorrow}% (-${decayDelta}%)`
      : '✨ Lá chắn kiên cố! Tất cả từ vựng đang ở mức an toàn cao.';
  } else if (healthScore >= 70) {
    tier = {
      code: 'stable',
      label: 'Trí nhớ ĐANG ỔN ĐỊNH',
      statusColor: 'amber',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgBadge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
      glowColor: 'rgba(245, 158, 11, 0.28)',
      shieldBg: 'from-amber-500/20 via-orange-500/10 to-slate-900',
      mascotMessage: `Lá chắn đang ở mức khá (${healthScore}%), nhưng có ${criticalCount || fadingCount} từ đang mờ dần. Ôn ngay để sạc đầy 100%! 🛡️⚡`
    };
    warningBanner = `⚠️ Nếu không ôn hôm nay, lá chắn sẽ giảm xuống ${projectedTomorrow}% (-${decayDelta}%) vào ngày mai!`;
  } else {
    tier = {
      code: 'decaying',
      label: 'Lá Chắn ĐANG BỊ BÀO MÒN',
      statusColor: 'rose',
      textColor: 'text-rose-600 dark:text-rose-400',
      bgBadge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
      glowColor: 'rgba(244, 63, 94, 0.32)',
      shieldBg: 'from-rose-500/20 via-red-500/10 to-slate-900',
      mascotMessage: `Cảnh báo đỏ! Đường cong lãng quên đang tấn công ${criticalCount} từ vựng của bạn. Hãy bảo vệ lá chắn ngay!`
    };
    warningBanner = `🚨 Nguy cơ quên sạch ${criticalCount} từ vựng nếu không kích hoạt lá chắn hôm nay!`;
  }

  return {
    totalWords: totalLearned,
    healthPercentage: healthScore,
    projectedTomorrowPercentage: projectedTomorrow,
    decayDelta,
    solidCount,
    fadingCount,
    criticalCount,
    solidWords,
    fadingWords,
    criticalWords,
    estimatedReviewMinutes: estimatedMinutes,
    tier,
    warningBanner,
    hasDecayRisk: criticalCount > 0 || decayDelta > 0
  };
}
