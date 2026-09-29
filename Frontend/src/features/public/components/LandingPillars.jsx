import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Check, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PILLARS = [
  {
    id: 'communication',
    badge: 'TRỤ CỘT 01 • GIAO TIẾP THỰC CHIẾN',
    title: 'Giao Tiếp Thực Chiến: Phản Xạ Tiếng Anh Tức Thì',
    subtitle: '12 Chương • 72 Bài Hội Thoại • 688 Câu Thoại Đời Thực',
    route: '/communication',
    description:
      'Giáo trình hội thoại tương tác độc quyền của VBaceEnglish. Không học vẹt từng câu rời rạc — bạn được đặt vào 72 ngữ cảnh đời thực, đóng vai 1:1 cùng AI Studio, biến hóa 1 mẫu câu gốc thành hàng chục câu giao tiếp và tắm ngôn ngữ thụ động mọi lúc.',
    accent: 'from-[#0071e3] to-sky-500',
    lightBg: 'bg-blue-500/10 text-[#0071e3] dark:text-sky-400',
    borderHover: 'hover:border-[#0071e3]/50',
    stats: [
      { label: 'Chương học', value: '12' },
      { label: 'Bài hội thoại', value: '72' },
      { label: 'Câu thoại chuẩn', value: '688' },
      { label: 'VBace Mindset', value: '12' }
    ],
    features: [
      'Substitution Drilling: Thay thế cụm từ linh hoạt để nói hàng chục câu từ 1 cấu trúc gốc',
      'Nghe thụ động (Passive Listening): Tự động phát liên tục ngay cả khi khóa màn hình điện thoại',
      'Lưu từ & mẫu câu khó vào bộ thẻ nhớ ngắt quãng FSRS chỉ với 1 chạm',
      '12 chuyên đề Góc Tư Duy VBace (VBace’s Mindset) về ngữ pháp ứng dụng & văn hóa bản xứ'
    ]
  },
  {
    id: 'reflex',
    badge: 'TRỤ CỘT 02 • PHẢN XẠ TỐC ĐỘ CAO',
    title: 'Phản Xạ Nói - Viết 50 Chủ Đề (1.500 Câu)',
    subtitle: '5 Chuyên Đề Lớn • 50 Units • Thử Thách 3 Giây Vàng',
    route: '/reflex-50',
    description:
      'Xóa bỏ hoàn toàn căn bệnh "dịch từng từ trong đầu rồi mới dám nói". Hệ thống ép não bộ bật ra câu tiếng Anh trong vòng 3 giây đếm ngược kết hợp phương pháp Chunking (tư duy theo cụm từ), giúp miệng bạn nói nhanh như phản xạ tiếng Việt.',
    accent: 'from-indigo-600 to-violet-500',
    lightBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    borderHover: 'hover:border-indigo-500/50',
    stats: [
      { label: 'Chuyên đề', value: '05' },
      { label: 'Chủ đề (Units)', value: '50' },
      { label: 'Câu thông dụng', value: '1.500' },
      { label: 'Phản xạ chuẩn', value: '3 Giây' }
    ],
    features: [
      'Phòng Phản Xạ Nói 3 Giây: Nhìn câu tiếng Việt, bật câu tiếng Anh trước khi hết giờ',
      'Phương pháp Chunking: Tách câu dài thành các cụm ý nghĩa dễ nhớ, dễ ghép nối',
      'Chế độ Luyện Viết & Dịch Câu: Kiểm tra độ chính xác từng từ và cấu trúc câu',
      'Tích hợp chấm điểm tự đánh giá mức độ trôi chảy & theo dõi tiến độ từng Unit'
    ]
  },
  {
    id: 'vocab',
    badge: 'TRỤ CỘT 03 • TỪ VỰNG CỐT LÕI',
    title: '3000 Từ Vựng Tiếng Anh Oxford Theo 60 Chủ Đề',
    subtitle: '60 Chủ Đề Thiết Thực • Flashcard 3D • Trắc Nghiệm Tốc Độ',
    route: '/vocab',
    description:
      'Hệ thống hóa kho từ vựng cốt lõi nhất theo chuẩn Oxford thành 60 chủ đề đời sống & công việc. Kết hợp hình ảnh 3D Flashcard lật mượt mà, phiên âm IPA, âm thanh bản xứ và bài kiểm tra Quiz giúp bạn nhớ sâu mà không bao giờ nhàm chán.',
    accent: 'from-emerald-600 to-teal-500',
    lightBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    borderHover: 'hover:border-emerald-500/50',
    stats: [
      { label: 'Chủ đề Oxford', value: '60' },
      { label: 'Từ vựng cốt lõi', value: '1.760+' },
      { label: 'Chế độ học', value: '3D + Quiz' },
      { label: 'Phát âm', value: 'AI Native' }
    ],
    features: [
      'Flashcard 3D Flip tương tác mượt mà với đầy đủ IPA, từ loại, nghĩa và câu ví dụ thực tế',
      'Bộ lọc thông minh: Học từ chưa thuộc, ôn tập từ đã thuộc hoặc Reset từng chủ đề độc lập',
      'Chế độ Quiz trắc nghiệm tức thì giúp củng cố trí nhớ ngắn hạn sang dài hạn',
      'Tự động lưu trạng thái bộ lọc và tiến độ % hoàn thành trên từng chủ đề'
    ]
  },
  {
    id: 'toeic',
    badge: 'TRỤ CỘT 04 • LUYỆN ĐỀ',
    title: 'Phòng Luyện Đề TOEIC Chuẩn ETS',
    subtitle: 'Trọn Bộ Parts 1–7 • Paraphrase Mapping',
    route: '/toeic',
    description:
      'Mô phỏng phòng thi TOEIC thực tế với đầy đủ 7 Parts (Listening & Reading). Phân tích tỉ mỉ bẫy đề thi, đối chiếu trực quan từng cụm từ paraphrase để bạn nâng band điểm vững chắc.',
    accent: 'from-amber-500 to-orange-500',
    lightBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    borderHover: 'hover:border-amber-500/50',
    stats: [
      { label: 'Cấu trúc đề', value: 'Parts 1-7' },
      { label: 'Bóc tách bẫy', value: 'Paraphrase' },
      { label: 'Đánh dấu câu', value: '2 Chế độ' },
      { label: 'Đồng hồ thi', value: 'Chuẩn ETS' }
    ],
    features: [
      'Giao diện làm bài chia đôi màn hình (Split-Screen) chuẩn kỳ thi TOEIC quốc tế',
      'Đánh dấu câu hỏi thông minh: Phân loại câu "Chắc chắn" và câu "Phân vân" cần xem lại',
      'Paraphrase Mapping: Đối chiếu trực quan cụm từ trong câu hỏi và cụm từ đồng nghĩa trong bài',
      'Bảng tổng kết điểm, thống kê điểm số và phân tích lỗ hổng kiến thức chi tiết'
    ]
  }
];

export default function LandingPillars({ onStartLearning, isAuthenticated }) {
  const navigate = useNavigate();

  const handlePillarClick = (route) => {
    if (isAuthenticated) {
      navigate(route);
    } else {
      onStartLearning();
    }
  };

  return (
    <section
      id="four-pillars"
      className="py-20 lg:py-24 border-t border-slate-200/70 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0071e3]/10 text-[#0071e3] dark:text-sky-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen size={13} />
            <span>Hệ Sinh Thái Học Tập Toàn Diện</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            4 Trụ Cột Cốt Lõi Giúp Bạn Làm Chủ Tiếng Anh
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Mọi nội dung trong VBaceEnglish đều được thiết kế khớp nối chặt chẽ với nhau: từ nghe ngấm hội thoại thực tế, bật phản xạ nói trong 3 giây, xây nền từ vựng Oxford 3D đến chinh phục bài thi TOEIC chuẩn quốc tế.
          </p>
        </div>

        {/* 2x2 Architectural Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {PILLARS.map((pillar, index) => (
            <motion.div
              key={pillar.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className={`group rounded-[28px] bg-white dark:bg-[#0d1424] border border-slate-200/90 dark:border-slate-800/90 ${pillar.borderHover} p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,113,227,0.08)] transition-all flex flex-col justify-between space-y-6`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${pillar.lightBg}`}>
                    {pillar.badge}
                  </span>
                  <span className="text-xs font-black text-slate-400 dark:text-slate-600">
                    0{index + 1} / 04
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-[#0071e3] dark:text-sky-400">
                    {pillar.subtitle}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {pillar.description}
                </p>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  {pillar.stats.map((st, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 text-center"
                    >
                      <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                        {st.value}
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        {st.label}
                      </div>
                    </div>
                  ))}
                </div>

                <ul className="space-y-2.5 pt-2">
                  {pillar.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Tích hợp sẵn trong tài khoản học viên
                </span>
                <button
                  onClick={() => handlePillarClick(pillar.route)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0071e3] dark:text-sky-400 group-hover:translate-x-1 transition-transform cursor-pointer"
                >
                  <span>Vào học thôi</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
