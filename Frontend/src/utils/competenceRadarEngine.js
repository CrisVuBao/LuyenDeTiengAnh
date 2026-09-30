/**
 * F1. Radar Năng Lực Thực Tế — "Bạn Hiểu Bao Nhiêu % Thế Giới?"
 * Linguistic Competence Engine (Dựa trên Zipf's Law & Phân bố tần suất ngôn ngữ thực tế)
 */

export const RADAR_DOMAINS = [
  {
    id: 'conversation',
    name: 'Giao Tiếp Hàng Ngày',
    shortName: 'Giao Tiếp',
    icon: 'MessageCircle',
    color: 'from-blue-500 to-indigo-600',
    accentColor: '#3b82f6',
    desc: 'Hội thoại đời sống, kết bạn, du lịch, hỏi đường & tán gẫu tự nhiên',
    targetWordCount: 1200,
    targetReflexCount: 500,
    milestone: { targetPct: 50, label: 'Hiểu > 50% cuộc trò chuyện người bản xứ' }
  },
  {
    id: 'netflix',
    name: 'Xem Phim Netflix Không Sub',
    shortName: 'Phim Netflix',
    icon: 'Tv',
    color: 'from-rose-500 to-red-600',
    accentColor: '#ef4444',
    desc: 'Nghe hiểu thoại phim ảnh, TV series, gameshow & kịch bản phim Mỹ',
    targetWordCount: 2000,
    targetReflexCount: 800,
    milestone: { targetPct: 70, label: 'Sắp tắt hoàn toàn phụ đề tiếng Việt' }
  },
  {
    id: 'news',
    name: 'Đọc Báo BBC / CNN / Reuters',
    shortName: 'Báo Chí Quốc Tế',
    icon: 'Newspaper',
    color: 'from-amber-500 to-orange-600',
    accentColor: '#f59e0b',
    desc: 'Đọc hiểu báo chí thế giới, thời sự quốc tế, công nghệ & kinh tế',
    targetWordCount: 2500,
    targetReflexCount: 1000,
    milestone: { targetPct: 80, label: 'BBC & CNN không còn là nỗi sợ' }
  },
  {
    id: 'music',
    name: 'Hiểu Lời Bài Hát Tiếng Anh',
    shortName: 'Nhạc Âu Mỹ',
    icon: 'Music',
    color: 'from-emerald-500 to-teal-600',
    accentColor: '#10b981',
    desc: 'Bắt chữ & cảm thụ ca từ bài hát Pop, R&B, Rock và nhạc trẻ US-UK',
    targetWordCount: 1500,
    targetReflexCount: 400,
    milestone: { targetPct: 60, label: 'Hát theo & hiểu > 60% bài hát US-UK' }
  },
  {
    id: 'workplace',
    name: 'Giao Tiếp Công Sở & Email',
    shortName: 'Công Sở & Email',
    icon: 'Briefcase',
    color: 'from-cyan-500 to-blue-600',
    accentColor: '#06b6d4',
    desc: 'Viết email chuyên nghiệp, họp hành, đàm phán & phỏng vấn xin việc',
    targetWordCount: 2200,
    targetReflexCount: 600,
    milestone: { targetPct: 75, label: 'Tự tin đàm phán & viết email công sở' }
  },
  {
    id: 'literature',
    name: 'Đọc Sách & Tiểu Thuyết',
    shortName: 'Sách & Truyện',
    icon: 'BookOpen',
    color: 'from-purple-500 to-violet-600',
    accentColor: '#8b5cf6',
    desc: 'Đọc sách văn học, tiểu thuyết, truyện tiếng Anh & tài liệu nghiên cứu',
    targetWordCount: 3000,
    targetReflexCount: 1200,
    milestone: { targetPct: 60, label: 'Đọc trọn vẹn tiểu thuyết & sách ngoại văn' }
  }
];

export function getLevelBadge(percentage) {
  const p = Math.round(percentage);
  if (p >= 88) return { label: 'Bản Ngữ (Native-like)', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' };
  if (p >= 70) return { label: 'Lưu Loát (Fluent)', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
  if (p >= 50) return { label: 'Tự Tin (Confident)', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' };
  if (p >= 30) return { label: 'Nền Tảng (Developing)', color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30' };
  return { label: 'Mới Bắt Đầu (Novice)', color: 'text-slate-400 bg-slate-500/15 border-slate-500/30' };
}

/**
 * Tính toán 6 chiều năng lực thực tế dựa trên vốn từ vựng, phản xạ và bài học đã tích lũy
 */
export function calculateCompetenceRadar({
  wordsMastered = 0,
  reflexMastered = 0,
  binoLessonsCompleted = 0,
  toeicCompleted = 0,
  simulationExtraWords = 0,
  simulationExtraReflex = 0
} = {}) {
  const effectiveWords = Math.max(0, wordsMastered + simulationExtraWords);
  const effectiveReflex = Math.max(0, reflexMastered + simulationExtraReflex);
  const effectiveBino = Math.max(0, binoLessonsCompleted);
  const effectiveToeic = Math.max(0, toeicCompleted);

  // Normalization ratios
  const rRatio = Math.min(1.0, effectiveReflex / 1500);
  const bRatio = Math.min(1.0, effectiveBino / 72);
  const vRatioCore = Math.min(1.0, effectiveWords / 1200);
  const vRatioMid = Math.min(1.0, effectiveWords / 2000);
  const vRatioBroad = Math.min(1.0, effectiveWords / 3000);
  const tRatio = Math.min(1.0, effectiveToeic / 400);

  // 1. Daily Casual Conversation (Zipf law concentration)
  const conversation = Math.min(
    98,
    Math.round((8 + 35 * Math.pow(rRatio, 0.7) + 27 * Math.pow(bRatio, 0.7) + 28 * Math.pow(vRatioCore, 0.7)) * 10) / 10
  );

  // 2. Netflix Shows & Movies
  const netflix = Math.min(
    95,
    Math.round((5 + 30 * Math.pow(bRatio, 0.75) + 30 * Math.pow(rRatio, 0.75) + 32 * Math.pow(vRatioMid, 0.75)) * 10) / 10
  );

  // 3. News & Media
  const news = Math.min(
    92,
    Math.round((4 + 55 * Math.pow(vRatioBroad, 0.85) + 25 * Math.pow(rRatio, 0.85) + 10 * Math.pow(tRatio, 0.85)) * 10) / 10
  );

  // 4. Music Lyrics
  const music = Math.min(
    96,
    Math.round((10 + 35 * Math.pow(vRatioCore, 0.65) + 30 * Math.pow(bRatio, 0.65) + 23 * Math.pow(rRatio, 0.65)) * 10) / 10
  );

  // 5. Workplace & Professional Emails
  const workplace = Math.min(
    95,
    Math.round((5 + 35 * Math.pow(vRatioMid, 0.8) + 30 * Math.pow(rRatio, 0.8) + 27 * Math.pow(tRatio, 0.7)) * 10) / 10
  );

  // 6. Literature & Books
  const literature = Math.min(
    90,
    Math.round((3 + 60 * Math.pow(vRatioBroad, 0.9) + 20 * Math.pow(bRatio, 0.9) + 12 * Math.pow(rRatio, 0.9)) * 10) / 10
  );

  // Overall Weighted Competence Index
  const overall = Math.round(
    (conversation * 0.25 +
      netflix * 0.20 +
      music * 0.15 +
      workplace * 0.15 +
      news * 0.15 +
      literature * 0.10) * 10
  ) / 10;

  // Domain score lookup map
  const scores = {
    conversation,
    netflix,
    news,
    music,
    workplace,
    literature
  };

  const domainDetails = RADAR_DOMAINS.map((domain) => {
    const pct = scores[domain.id];
    const badge = getLevelBadge(pct);
    return {
      ...domain,
      percentage: pct,
      levelLabel: badge.label,
      badgeColor: badge.color
    };
  });

  // Sort to find lowest and highest
  const sorted = [...domainDetails].sort((a, b) => a.percentage - b.percentage);
  const lowestDomain = sorted[0];
  const highestDomain = sorted[sorted.length - 1];

  // Dynamic Mascot Message
  let mascotMessage = '';
  if (overall >= 88) {
    mascotMessage = 'Native speaker giả mạo đây rồi! Bạn hiểu hầu như mọi cuộc trò chuyện tiếng Anh trên thế giới! 🤫🇬🇧';
  } else if (netflix >= 70) {
    mascotMessage = 'Bạn sắp bỏ phụ đề Netflix được rồi! Đỉnh quá, tối nay hãy thử xem 1 tập phim sitcom không sub nhé! 📺✨';
  } else if (conversation >= 50) {
    mascotMessage = 'Tuyệt vời! Bạn đã hiểu hơn nửa số cuộc trò chuyện tiếng Anh của người bản xứ rồi đó! 🎉';
  } else if (news >= 60) {
    mascotMessage = 'Tin tức quốc tế BBC/CNN không còn là nỗi sợ nữa, tự tin đọc báo tiếng Anh mỗi sáng! 📰💪';
  } else if (simulationExtraWords > 0 || simulationExtraReflex > 0) {
    mascotMessage = `Kế hoạch tuyệt vời! Chỉ cần hoàn thành thêm bài tập, năng lực thực tế sẽ tăng vọt thêm +${(overall - (calculateCompetenceRadar({ wordsMastered, reflexMastered, binoLessonsCompleted, toeicCompleted })).overall).toFixed(1)}%! 🚀`;
  } else {
    mascotMessage = `Mỗi từ bạn học hôm nay đều trực tiếp mở rộng năng lực thực tế! Hãy luyện thêm '${lowestDomain.name}' để bứt phá nhanh nhất nhé! 🚀`;
  }

  // Estimated daily progress delta (micro-reward)
  const dailyGain = Math.round(Math.max(0.2, (effectiveWords % 15) * 0.04 + (effectiveReflex % 10) * 0.03) * 10) / 10;

  return {
    overall,
    dailyGain,
    wordsMastered: effectiveWords,
    reflexMastered: effectiveReflex,
    binoLessonsCompleted: effectiveBino,
    toeicCompleted: effectiveToeic,
    domains: domainDetails,
    lowestDomain,
    highestDomain,
    mascotMessage
  };
}

/**
 * Tính toán tọa độ SVG cho biểu đồ Radar Hexagon
 * cx, cy: tâm biểu đồ
 * radius: bán kính tối đa
 */
export function getRadarCoordinates(domains, cx = 150, cy = 150, radius = 100) {
  const angleStep = (2 * Math.PI) / domains.length;
  // Bắt đầu từ đỉnh trên cùng (-PI / 2)
  const points = domains.map((domain, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const factor = Math.max(0.12, domain.percentage / 100);
    const x = cx + radius * factor * Math.cos(angle);
    const y = cy + radius * factor * Math.sin(angle);
    return {
      x,
      y,
      angle,
      domain
    };
  });

  const polygonString = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Concentric background rings (20%, 40%, 60%, 80%, 100%)
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0].map((rFactor) => {
    return domains
      .map((_, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const x = cx + radius * rFactor * Math.cos(angle);
        const y = cy + radius * rFactor * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });

  // Axis lines connecting center to outer vertices
  const axes = domains.map((domain, index) => {
    const angle = index * angleStep - Math.PI / 2;
    const outerX = cx + radius * Math.cos(angle);
    const outerY = cy + radius * Math.sin(angle);
    const labelX = cx + (radius + 24) * Math.cos(angle);
    const labelY = cy + (radius + 24) * Math.sin(angle);
    return {
      x1: cx,
      y1: cy,
      x2: outerX,
      y2: outerY,
      labelX,
      labelY,
      angle,
      domain
    };
  });

  return {
    polygonString,
    points,
    rings,
    axes
  };
}
