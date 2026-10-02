import React from 'react';
import { Brain, Headphones, Repeat, Clock, Wand2 } from 'lucide-react';

export default function LandingMethodology() {
  return (
    <section id="signature-tech" className="py-14 sm:py-20 lg:py-24 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
      <div className="max-w-3xl mx-auto text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
          <Brain size={13} />
          <span>Công Nghệ & Phương Pháp Độc Quyền</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          Thiết Kế Dựa Trên Cơ Chế Tiếp Thu Ngôn Ngữ Tự Nhiên
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Không nhồi nhét lý thuyết khô khan. VBaceEnglish ứng dụng 4 công nghệ cốt lõi giúp rút ngắn 70% thời gian hình thành phản xạ tiếng Anh.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
        {/* Feature 1: Passive Listening Engine (7 cols) */}
        <div className="md:col-span-7 rounded-[24px] sm:rounded-[28px] bg-gradient-to-br from-slate-900 via-[#0c182d] to-slate-900 text-white p-5 sm:p-8 border border-slate-800 shadow-xl flex flex-col justify-between space-y-5 sm:space-y-6 relative overflow-hidden min-w-0">
          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold">
              <Headphones size={13} />
              <span>Media Session Background Audio</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Nghe Thụ Động Liên Tục Ngay Cả Khi Khóa Màn Hình
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Tận dụng thời gian đi xe, tập thể dục hay trước khi ngủ để "tắm ngôn ngữ". Trình phát âm thanh thông minh tự động đọc tuần tự câu tiếng Anh và giải nghĩa tiếng Việt của 72 bài hội thoại thực chiến mà không cần bạn phải mở sáng màn hình điện thoại.
            </p>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-between gap-3 sm:gap-4 relative z-10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#0071e3] flex items-center justify-center shrink-0">
                <Headphones size={18} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  Đang phát: Chương 05 • Bài 29 (Hội thoại Thực Chiến)
                </div>
                <div className="text-[11px] text-sky-300 truncate">
                  Chế độ: Tự động chuyển câu • Hoạt động khi khóa máy
                </div>
              </div>
            </div>
            <div className="flex items-end gap-1 h-5 shrink-0">
              <span className="w-1 bg-sky-400 rounded-full equalizer-bar" />
              <span className="w-1 bg-[#0071e3] rounded-full equalizer-bar" />
              <span className="w-1 bg-emerald-400 rounded-full equalizer-bar" />
              <span className="w-1 bg-sky-300 rounded-full equalizer-bar" />
            </div>
          </div>
        </div>

        {/* Feature 2: FSRS / Spaced Repetition (5 cols) */}
        <div className="md:col-span-5 rounded-[24px] sm:rounded-[28px] bg-white dark:bg-[#0d1424] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-8 flex flex-col justify-between space-y-5 min-w-0">
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Repeat size={22} />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Thuật Toán Lặp Lại Ngắt Quãng FSRS Hiện Đại
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Mọi từ vựng và mẫu câu bạn lưu trong lúc học hội thoại đều được đưa vào hàng đợi FSRS. Hệ thống tự động tính toán thời điểm não bộ sắp quên để nhắc bạn ôn tập đúng lúc, đạt hiệu quả ghi nhớ dài hạn tối đa.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {[
              { label: 'Quên', sub: 'Lặp lại ngay', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
              { label: 'Khó', sub: '+1 ngày', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
              { label: 'Tốt', sub: '+4 ngày', color: 'bg-sky-500/10 text-[#0071e3] dark:text-sky-400' },
              { label: 'Dễ', sub: '+10 ngày', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' }
            ].map((b, i) => (
              <div key={i} className={`p-2 rounded-xl text-center ${b.color}`}>
                <div className="text-xs font-extrabold">{b.label}</div>
                <div className="text-[10px] opacity-85">{b.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature 3: 3-Second Chunking Reflex (5 cols) */}
        <div className="md:col-span-5 rounded-[24px] sm:rounded-[28px] bg-white dark:bg-[#0d1424] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-8 flex flex-col justify-between space-y-5 min-w-0">
          <div className="space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Clock size={22} />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Phản Xạ 3 Giây & Tư Duy Cụm Từ (Chunking)
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Người bản xứ không ghép từng từ đơn lẻ khi nói — họ nói theo từng cụm cố định (Chunks). Giới hạn 3 giây giúp bạn vượt qua rào cản ngập ngừng và kích hoạt vùng ngôn ngữ phản xạ tức thì.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex flex-wrap items-center justify-between gap-2">
            <span>Tốc độ bật câu trung bình sau 14 ngày:</span>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-black shrink-0">
              &lt; 2.4 giây
            </span>
          </div>
        </div>

        {/* Feature 4: ETS Paraphrase Mapping (7 cols) */}
        <div className="md:col-span-7 rounded-[24px] sm:rounded-[28px] bg-white dark:bg-[#0d1424] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-8 flex flex-col justify-between space-y-5 min-w-0">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold">
              <Wand2 size={13} />
              <span>ETS Paraphrase Engine</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Phân Tích Bẫy Đề Thi TOEIC & Đối Chiếu Từ Đồng Nghĩa Tức Thì
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Khi luyện đề TOEIC trên VBaceEnglish, bạn không chỉ biết đáp án Đúng/Sai. Hệ thống chỉ rõ từng cặp Paraphrase giữa bài đọc và câu hỏi, giúp hiểu sâu bản chất ngữ pháp của từng câu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { title: 'Chấm & Giải thích', desc: 'Phân tích lý do chọn và loại trừ từng đáp án A, B, C, D' },
              { title: 'Paraphrase Mapping', desc: 'Highlight từ khóa tương đương giữa đoạn văn & câu hỏi' },
              { title: 'Chắc chắn / Phân vân', desc: 'Đánh dấu trạng thái tâm lý khi làm bài để ôn tập trúng đích' }
            ].map((item, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
