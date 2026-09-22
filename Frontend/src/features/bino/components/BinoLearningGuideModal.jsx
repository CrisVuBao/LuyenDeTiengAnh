import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, X, Headphones, BookOpen, Mic, Repeat, 
  Lightbulb, CheckCircle2, ArrowRight, Zap, Target, Layers
} from 'lucide-react';

export default function BinoLearningGuideModal({ isOpen, onClose }) {
  const [activeStep, setActiveStep] = useState(1);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      icon: Headphones,
      badge: "Bước 1",
      title: "Tắm Âm Vô Thức (Immersion Listening)",
      subtitle: "Để đôi tai bắt nhịp ngữ điệu bản xứ trước khi nhìn chữ",
      color: "from-blue-600 to-cyan-600",
      accentBg: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      instruction: "Đừng vội nhìn vietsub! Hãy nhắm mắt lại và chỉ lắng nghe:",
      details: [
        "Bật chế độ **Lặp 5–10 lần** hoặc **Lặp vô hạn (∞)** trên thanh công cụ.",
        "Tắt nút mắt (Ẩn Vietsub) để não bộ không bị phụ thuộc vào tiếng Việt.",
        "Tập trung cảm nhận: Ngữ điệu lên xuống, chỗ nối âm (*linking sounds*), và từ được nhấn trọng âm (*stress*)."
      ],
      tip: "Não bộ học ngôn ngữ giống như đứa trẻ: Nghe hàng trăm lần trước khi biết nói, biết nói trước khi biết đọc chữ!"
    },
    {
      step: 2,
      icon: BookOpen,
      badge: "Bước 2",
      title: "Bẻ Khóa Cụm Từ Phản Xạ (Lexical Chunks)",
      subtitle: "Học theo 'khối ngôn ngữ' đúc sẵn, không học từ vựng riêng lẻ",
      color: "from-amber-500 to-orange-500",
      accentBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      instruction: "Mở Vietsub và giải mã các cụm từ đúc sẵn trong bài:",
      details: [
        "Đọc các tờ **Giấy Note Vàng Ghim** ở góc bài học: Chú ý các cụm Idiom/Phrasal Verbs như `get the hang of it`, `check it out`, `getting used to`.",
        "Hiểu nghĩa của **cả cụm từ** chứ tuyệt đối không dịch từng chữ một (*word-by-word*).",
        "Bấm biểu tượng Bookmark ghim vào **Bộ thẻ Flashcard SRS** để hệ thống thuật toán SM-2 tự động nhắc ôn cách quãng."
      ],
      tip: "Người bản xứ nói nhanh vì họ 'bốc' cả cụm từ có sẵn trong đầu ra nói, chứ không ngồi dịch ngữ pháp!"
    },
    {
      step: 3,
      icon: Mic,
      badge: "Bước 3",
      title: "Đọc Đuổi & Đóng Vai 1:1 (Echo Shadowing)",
      subtitle: "Mở cơ miệng và sao chép ngữ điệu tự nhiên cùng Bino",
      color: "from-purple-600 to-indigo-600",
      accentBg: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      instruction: "Chuyển sang Tab 'Luyện Phản Xạ 1:1' ngay trong bài:",
      details: [
        "Chọn vai bạn muốn đóng (Ví dụ: Amy, New Friend, Jeremy...).",
        "Hệ thống trong vai Bino sẽ đọc thoại trước. Đến lượt bạn, hãy **đọc to thành tiếng** câu thoại bằng tiếng Anh.",
        "Kỹ thuật Shadowing: Cố gắng nhại lại y hệt tốc độ, ngữ điệu và cảm xúc của nhân vật như một diễn viên kịch."
      ],
      tip: "Đừng sợ phát âm sai! Miệng phải mở to, nói nhiều lần thì cơ hàm mới quen với âm gió và ngữ điệu tiếng Anh."
    },
    {
      step: 4,
      icon: Zap,
      badge: "Bước 4",
      title: "Vận Dụng & Thay Ruột Mẫu Câu (Pattern Substitution)",
      subtitle: "Biến câu trong sách thành câu nói của chính mình ngoài đời",
      color: "from-emerald-600 to-teal-600",
      accentBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      instruction: "Dưới mỗi câu thoại, bấm nút '🎯 Vận dụng vào thực tế':",
      details: [
        "Xem **Khung mẫu câu cốt lõi**: Nắm cấu trúc chung có thể tái sử dụng (ví dụ: `I'm still getting used to [X] though`).",
        "Đọc to 3–5 tình huống thực tế khác nhau: Đi làm ở công sở (`office culture`), chuyển nhà (`house layout`), thời tiết (`cold winter`)...",
        "Bấm loa nghe giọng đọc từng câu biến thể, rồi tự thử tài gõ cụm từ của riêng bạn để tạo câu mới!"
      ],
      tip: "Chỉ cần thuộc 1 mẫu câu khung, bạn có thể 'chém' được 20 câu khác nhau trong mọi tình huống đời thực!"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 relative overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition z-10"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Phương Pháp Học Phản Xạ 4 Bước Bino
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bí quyết để "Chém Tiếng Anh Không Cần Động Não" sau 30 ngày
            </p>
          </div>
        </div>

        {/* Step Tabs */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-5">
          {steps.map((s) => (
            <button
              key={s.step}
              onClick={() => setActiveStep(s.step)}
              className={`py-2 px-1.5 rounded-xl text-xs font-black transition-all flex flex-col sm:flex-row items-center justify-center gap-1 ${
                activeStep === s.step
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black ${
                activeStep === s.step ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-700'
              }`}>
                {s.step}
              </span>
              <span className="truncate hidden sm:inline">{s.badge}</span>
            </button>
          ))}
        </div>

        {/* Step Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {steps.map((s) => {
            if (s.step !== activeStep) return null;
            const Icon = s.icon;

            return (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Step Banner */}
                <div className={`p-4 sm:p-5 rounded-2xl border ${s.accentBg} space-y-2`}>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-xs">
                      <Icon size={20} />
                    </span>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider opacity-75">
                        {s.badge}
                      </span>
                      <h4 className="text-sm sm:text-base font-black">
                        {s.title}
                      </h4>
                    </div>
                  </div>
                  <p className="text-xs font-medium opacity-90 leading-relaxed">
                    {s.subtitle}
                  </p>
                </div>

                {/* Instructions */}
                <div className="space-y-2.5">
                  <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    {s.instruction}
                  </p>
                  <ul className="space-y-2">
                    {s.details.map((detail, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span dangerouslySetInnerHTML={{ __html: detail.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pro Tip Callout */}
                <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <Lightbulb size={18} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-black">Mẹo Vàng Phản Xạ: </strong>
                    <span>{s.tip}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Quick Comparison Card */}
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
            <span className="font-black uppercase text-[10px] text-slate-400 tracking-wider">
              So Sánh Tư Duy Phản Xạ
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 text-rose-800 dark:text-rose-300 space-y-1">
                <span className="font-extrabold text-[11px] block">❌ Cách học sai lầm:</span>
                <p className="text-[10px] leading-relaxed opacity-90">
                  Dịch từng từ tiếng Việt → Ráp ngữ pháp → Ngập ngừng 3-5 giây → Nói sợ sai.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 text-emerald-800 dark:text-emerald-300 space-y-1">
                <span className="font-extrabold text-[11px] block">✅ Chuẩn Bino:</span>
                <p className="text-[10px] leading-relaxed opacity-90">
                  Học cả cụm đúc sẵn → Bật ra ngay tức thì dưới 0.5 giây → Tự tin, trôi chảy.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {activeStep > 1 && (
              <button
                type="button"
                onClick={() => setActiveStep(activeStep - 1)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Bước trước
              </button>
            )}
            {activeStep < 4 && (
              <button
                type="button"
                onClick={() => setActiveStep(activeStep + 1)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 transition"
              >
                Bước tiếp theo →
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-md shadow-amber-500/25 active:scale-95 transition"
          >
            Đã hiểu, Bắt đầu học ngay!
          </button>
        </div>
      </div>
    </div>
  );
}
