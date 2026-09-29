import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, BookOpen, Layers, Zap, Clock, Target, CheckCircle2,
  ArrowRight, Lightbulb, Compass, Award, ChevronRight, HelpCircle,
  Play, Users, Briefcase, Flame, Brain, ShieldAlert, Check
} from 'lucide-react';

export default function MasterLearningGuideModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('synergy'); // 'synergy' | 'routine' | 'pathway' | 'pillars'
  const [selectedLevel, setSelectedLevel] = useState('hesitant'); // 'beginner' | 'hesitant' | 'career'

  if (!isOpen) return null;

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ======================================================== */}
          {/* 1. MODAL HEADER                                          */}
          {/* ======================================================== */}
          <div className="px-6 py-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-sky-400 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                <Sparkles size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Hướng Dẫn Học Hiệu Quả: Tam Giác Vàng Phản Xạ
                  </h2>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0071e3]/10 text-[#0071e3] dark:bg-sky-500/15 dark:text-sky-300">
                    Chuẩn Sư Phạm VBace
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bí quyết kết hợp 3000 Từ Vựng, 50 Chủ Đề Phản Xạ và Giao Tiếp Thực Chiến để bật tiếng Anh tự nhiên
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
              title="Đóng hướng dẫn"
            >
              <X size={18} />
            </button>
          </div>

          {/* ======================================================== */}
          {/* 2. NAVIGATION TABS                                       */}
          {/* ======================================================== */}
          <div className="px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto hide-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
            {[
              { id: 'synergy', label: '1. Tam Giác Vàng 3 Trụ Cột', icon: Sparkles },
              { id: 'routine', label: '2. Lộ Trình 45–60 Phút/Ngày', icon: Clock },
              { id: 'pathway', label: '3. Chọn Theo Mục Tiêu & Trình Độ', icon: Target },
              { id: 'pillars', label: '4. Chi Tiết Phương Pháp 3 Phần', icon: BookOpen }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#0071e3] text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
                  }`}
                >
                  <TabIcon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ======================================================== */}
          {/* 3. MODAL BODY (SCROLLABLE)                               */}
          {/* ======================================================== */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
            
            {/* ---------------------------------------------------- */}
            {/* TAB 1: TAM GIÁC VÀNG 3 TRỤ CỘT                       */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'synergy' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Core Problem Callout */}
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <HelpCircle size={20} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300">
                      Tại sao bạn cảm thấy bối rối: &ldquo;Nên học cái nào trước? Có phải học hết 3000 từ mới học giao tiếp?&rdquo;
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-800/90 dark:text-amber-200/90 leading-relaxed font-normal">
                      Hầu hết người học thất bại vì tưởng rằng 3 tính năng này là 3 khóa học riêng biệt cạnh tranh thời gian của nhau. Nhưng trong ngôn ngữ học thực chiến, chúng là <strong>3 Tầng bổ trợ tuần hoàn theo mô hình Input → Reflex → Output</strong>!
                    </p>
                  </div>
                </div>

                {/* The 3 Pillars Visual Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Pillar 1 */}
                  <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/60 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                          TẦNG 1: NGUYÊN LIỆU (INPUT)
                        </span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          10–15 phút/ngày
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Layers size={18} className="text-emerald-600 dark:text-emerald-400" />
                        <span>3000 Từ Vựng Oxford</span>
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        <strong>Vai trò:</strong> Cung cấp "gạch và cát". Thuật toán FSRS tính toán điểm quên, giúp nạp từ vựng cốt lõi vào trí nhớ dài hạn mà không bị quá tải.
                      </p>
                      <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-1">
                        <li className="flex items-center gap-1.5">
                          <Check size={13} className="text-emerald-500 shrink-0" />
                          <span>Flashcard 3D sinh động</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check size={13} className="text-emerald-500 shrink-0" />
                          <span>Phát âm chuẩn IPA & Audio bản xứ</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => handleNavigate('/vocab')}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
                    >
                      <span>Vào 3000 Từ Vựng</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  {/* Pillar 2 */}
                  <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/60 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                          TẦNG 2: CƠ PHẢN XẠ (REFLEX)
                        </span>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                          15–20 phút/ngày
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Zap size={18} className="text-amber-500" />
                        <span>Phản Xạ 50 Chủ Đề</span>
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        <strong>Vai trò:</strong> Luyện cụm từ (Chunks) & phản xạ bật câu 3 giây. Trị dứt điểm căn bệnh "biết từ nhưng nghĩ mãi không ra câu" hoặc dịch ngầm trong đầu.
                      </p>
                      <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-1">
                        <li className="flex items-center gap-1.5">
                          <Check size={13} className="text-amber-500 shrink-0" />
                          <span>1.500 câu nói - viết chia 3 tầng</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check size={13} className="text-amber-500 shrink-0" />
                          <span>Chấm điểm từng từ & Ẩn câu 3 giây</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => handleNavigate('/reflex-50')}
                      className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
                    >
                      <span>Vào Phản Xạ 50</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  {/* Pillar 3 */}
                  <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-800/60 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0071e3]/20 text-[#0071e3] dark:text-sky-300">
                          TẦNG 3: ĐỜI THỰC (OUTPUT)
                        </span>
                        <span className="text-xs font-bold text-[#0071e3] dark:text-sky-400">
                          20–25 phút/ngày
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles size={18} className="text-[#0071e3] dark:text-sky-400" />
                        <span>Giao Tiếp Thực Chiến</span>
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        <strong>Vai trò:</strong> Đưa từ vựng và mẫu câu vào câu chuyện đời sống thực tế (12 chương, 72 bài hội thoại), nhập vai 1:1 và đổi ruột câu (Substitution Drilling).
                      </p>
                      <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-1">
                        <li className="flex items-center gap-1.5">
                          <Check size={13} className="text-blue-500 shrink-0" />
                          <span>Đóng vai hội thoại 1:1 với nhân vật</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <Check size={13} className="text-blue-500 shrink-0" />
                          <span>Substitution Drilling biến hóa linh hoạt</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => handleNavigate('/communication')}
                      className="w-full py-2 px-3 rounded-xl bg-[#0071e3] hover:bg-[#0077ED] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
                    >
                      <span>Vào Giao Tiếp Thực Chiến</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* Synergy Formula Summary */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Công thức tương hỗ hoàn hảo mỗi ngày:
                  </h4>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                    <span className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs w-full sm:w-auto text-center">
                      1. Nạp từ vựng (3000 Vocab)
                    </span>
                    <ArrowRight size={16} className="text-slate-400 shrink-0 hidden sm:block" />
                    <span className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs w-full sm:w-auto text-center">
                      2. Rèn cơ phản xạ 3 giây (Reflex 50)
                    </span>
                    <ArrowRight size={16} className="text-slate-400 shrink-0 hidden sm:block" />
                    <span className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs w-full sm:w-auto text-center">
                      3. Đóng vai & đổi ruột câu (Giao Tiếp)
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 2: LỘ TRÌNH 45–60 PHÚT/NGÀY                       */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'routine' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Thời Gian Biểu Chuẩn Sư Phạm 45–60 Phút Mỗi Ngày
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Không cần học dồn 3-4 tiếng cuối tuần rồi kiệt sức. Chỉ cần duy trì 3 chặng này mỗi ngày, bạn sẽ thấy sự thay đổi rõ rệt sau 21 ngày!
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Step 1: Warmup */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-sm flex items-center justify-center shrink-0">
                        15&apos;
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                            Chặng 1: Khởi động não bộ
                          </span>
                          <span className="text-xs text-slate-400">• Sáng hoặc lúc rảnh</span>
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          Ôn Thẻ SRS & Nạp 10 Từ Mới (3000 Từ Vựng)
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                          Mở tab Ôn tập Flashcard SRS, giải quyết hết các thẻ đến hạn (Due Cards). Sau đó học thêm 10 từ mới trong 1 chủ đề quen thuộc (Ẩm thực, Công việc, Đời sống). Nghe kỹ phát âm và ví dụ.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNavigate('/vocab')}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold shrink-0 transition-colors cursor-pointer"
                    >
                      Bắt đầu ôn
                    </button>
                  </div>

                  {/* Step 2: Reflex Drill */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-sm flex items-center justify-center shrink-0">
                        20&apos;
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Chặng 2: Rèn cơ phản xạ phát âm
                          </span>
                          <span className="text-xs text-slate-400">• Trưa hoặc đầu giờ chiều</span>
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          Luyện 10–15 Câu Phản Xạ 3 Giây (Phản Xạ 50 Chủ Đề)
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                          Vào 1 Unit mục tiêu. Dùng tính năng "Ẩn tiếng Anh", nhìn câu tiếng Việt và bật thành tiếng trong 3 giây. Sau đó làm bài viết ghép khối từ hoặc tự gõ câu để hệ thống chấm điểm ngữ pháp chính xác.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNavigate('/reflex-50')}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold shrink-0 transition-colors cursor-pointer"
                    >
                      Luyện phản xạ
                    </button>
                  </div>

                  {/* Step 3: Real Life Output */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] dark:text-sky-400 font-black text-sm flex items-center justify-center shrink-0">
                        25&apos;
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#0071e3] dark:text-sky-400">
                            Chặng 3: Nhập vai & Đổi ruột câu
                          </span>
                          <span className="text-xs text-slate-400">• Buổi tối yên tĩnh</span>
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          Đóng Vai 1:1 & Substitution Drilling (Giao Tiếp Thực Chiến)
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                          Học 1 bài hội thoại. Bật nghe tắm âm vô thức $\rightarrow$ Đóng vai 1:1 nhại theo ngữ điệu nhân vật $\rightarrow$ Bấm nút "Vận dụng vào thực tế" để thay thế cụm từ, tự tạo 3-5 câu của chính mình ngoài đời.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleNavigate('/communication')}
                      className="px-3.5 py-2 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
                    >
                      Học bài mới
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/60 flex items-center gap-3">
                  <Flame size={20} className="text-orange-500 shrink-0" />
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    <strong>Mẹo duy trì Streak:</strong> Nếu hôm nào quá bận rộn không đủ 60 phút, chỉ cần hoàn thành <strong>10 phút ôn Flashcard</strong> hoặc <strong>10 câu phản xạ</strong> là bạn đã giữ trọn vẹn thói quen và chuỗi ngày học!
                  </p>
                </div>
              </motion.div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 3: CHỌN THEO MỤC TIÊU & TRÌNH ĐỘ                  */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'pathway' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Bạn Thuộc Nhóm Người Học Nào?
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Chọn tình trạng hiện tại của bạn để nhận tỷ lệ phân bổ thời gian và vị trí xuất phát phù hợp nhất:
                  </p>
                </div>

                {/* Level Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'beginner',
                      title: 'Mất gốc / Người mới bắt đầu',
                      sub: 'Vốn từ ít, sợ phát âm sai, ngại nói',
                      icon: Brain,
                      color: 'emerald'
                    },
                    {
                      id: 'hesitant',
                      title: 'Biết từ nhưng hay ngập ngừng',
                      sub: 'Nghĩ tiếng Việt rồi dịch ngầm sang tiếng Anh',
                      icon: Zap,
                      color: 'amber'
                    },
                    {
                      id: 'career',
                      title: 'Chuẩn bị đi làm / Phỏng vấn',
                      sub: 'Cần phản xạ công sở, họp hành, tự tin',
                      icon: Briefcase,
                      color: 'blue'
                    }
                  ].map((lvl) => {
                    const LvlIcon = lvl.icon;
                    const isSelected = selectedLevel === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        onClick={() => setSelectedLevel(lvl.id)}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 border-[#0071e3] dark:border-sky-400 shadow-sm'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-[#0071e3] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                          }`}>
                            <LvlIcon size={16} />
                          </div>
                          {isSelected && <CheckCircle2 size={16} className="text-[#0071e3] dark:text-sky-400" />}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {lvl.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {lvl.sub}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Level Details Recommendation */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 space-y-4">
                  {selectedLevel === 'beginner' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                          Chiến thuật cho Người Mất Gốc
                        </span>
                        <span className="text-xs text-slate-400">Ưu tiên xây gốc vững chắc</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 py-1">
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-700/60 text-center">
                          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">40%</p>
                          <p className="text-[11px] font-semibold text-slate-500">3000 Từ Vựng (A1-A2)</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-700/60 text-center">
                          <p className="text-lg font-black text-amber-600 dark:text-amber-400">40%</p>
                          <p className="text-[11px] font-semibold text-slate-500">Phản Xạ 50 (Tầng 1)</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-700/60 text-center">
                          <p className="text-lg font-black text-[#0071e3] dark:text-sky-400">20%</p>
                          <p className="text-[11px] font-semibold text-slate-500">Giao Tiếp (Chương 1-3)</p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        👉 <strong>Lời khuyên:</strong> Hãy bắt đầu với 3000 từ vựng để có vốn từ cơ bản. Với 50 Chủ đề, bạn chỉ cần tập trung làm <strong>Câu 1 đến 10 (Tầng 1: Câu đơn cốt lõi)</strong> của các Unit 1 đến 20. Đừng vội làm câu phức dài!
                      </p>
                    </div>
                  )}

                  {selectedLevel === 'hesitant' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold">
                          Chiến thuật Phá Bỏ Khâu Dịch Ngầm
                        </span>
                        <span className="text-xs text-slate-400">Ưu tiên tốc độ phản xạ miệng</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-1">
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-700/60 text-center">
                          <p className="text-lg font-black text-amber-600 dark:text-amber-400">50%</p>
                          <p className="text-[11px] font-semibold text-slate-500">Phản Xạ 50 (Trọng tâm!)</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-700/60 text-center">
                          <p className="text-lg font-black text-[#0071e3] dark:text-sky-400">30%</p>
                          <p className="text-[11px] font-semibold text-slate-500">Giao Tiếp (1:1 & Đổi từ)</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-700/60 text-center">
                          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">20%</p>
                          <p className="text-[11px] font-semibold text-slate-500">3000 Từ Vựng (SRS)</p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        👉 <strong>Lời khuyên:</strong> Bạn đã có vốn từ nhưng bị nghẽn ở khâu xuất câu. <strong>Phản Xạ 50 Chủ Đề là chìa khóa vàng của bạn!</strong> Bật tính năng "Ẩn tiếng Anh", ép bản thân bật ra cụm từ trong 3 giây. Sau đó sang Giao Tiếp Thực Chiến để đóng vai tương tác trực tiếp.
                      </p>
                    </div>
                  )}

                  {selectedLevel === 'career' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-bold">
                          Chiến thuật Cho Đi Làm & Phỏng Vấn
                        </span>
                        <span className="text-xs text-slate-400">Ưu tiên lưu loát và ngữ cảnh công sở</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-1">
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-700/60 text-center">
                          <p className="text-lg font-black text-[#0071e3] dark:text-sky-400">50%</p>
                          <p className="text-[11px] font-semibold text-slate-500">Giao Tiếp (Chương 7-12)</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-700/60 text-center">
                          <p className="text-lg font-black text-amber-600 dark:text-amber-400">35%</p>
                          <p className="text-[11px] font-semibold text-slate-500">Phản Xạ 50 (Tầng 2 & 3)</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-700/60 text-center">
                          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">15%</p>
                          <p className="text-[11px] font-semibold text-slate-500">Từ Vựng & TOEIC</p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        👉 <strong>Lời khuyên:</strong> Hãy đi thẳng vào <strong>Chương 7 đến 12 của Giao Tiếp Thực Chiến</strong> (Công sở, Đàm phán, Thuyết trình, Xử lý tình huống). Kết hợp với <strong>Câu 21-30 của các Unit 31-50</strong> để học các cấu trúc nối câu cao cấp (Although, Not only... but also...).
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ---------------------------------------------------- */}
            {/* TAB 4: CHI TIẾT PHƯƠNG PHÁP 3 PHẦN                  */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'pillars' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Phương Pháp Độc Quyền Áp Dụng Trong Từng Tính Năng
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Hiểu rõ công nghệ và phương pháp sư phạm đằng sau để tối ưu hóa 100% hiệu suất học:
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Thuật toán Lặp Cách Quãng FSRS (Free Spaced Repetition Scheduler)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Được áp dụng trong Flashcard 3000 từ vựng và Bộ thẻ Giao tiếp. Không như cách học truyền thống xem đi xem lại vô nghĩa, FSRS đo lường <strong>Độ ổn định trí nhớ (Stability)</strong> và <strong>Độ khó của từ (Difficulty)</strong> để tự động đặt lịch nhắc bạn đúng vào thời điểm não chuẩn bị quên. Giảm 60% thời gian ôn tập mà vẫn nhớ trên 90%.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Kỹ thuật Bóc Tách Khối Ngôn Ngữ (Lexical Chunking & 3s Reflex)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Áp dụng trong Phản Xạ 50 Chủ Đề. Người bản xứ không nói bằng cách ghép từng từ riêng lẻ mà nói bằng các "cụm từ đóng gói sẵn" (ví dụ: `make a good impression`, `take into account`). Bạn học theo cụm thì khi nói sẽ bật ra cả cụm mà không cần dừng lại suy nghĩ ngữ pháp.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0071e3]" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Biến Hóa Mẫu Câu (Substitution Drilling) & Echo Shadowing
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Áp dụng trong Giao Tiếp Thực Chiến. Bạn không chỉ nghe thụ động mà đóng vai 1:1 cùng nhân vật, nhại lại y hệt ngữ điệu và cảm xúc. Sau đó bấm vào "Vận dụng vào thực tế" để thay thế các vị trí trong mẫu câu gốc, biến câu nói trong sách thành câu nói tự nhiên của chính bạn.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

          </div>

          {/* ======================================================== */}
          {/* 4. MODAL FOOTER ACTION BAR                               */}
          {/* ======================================================== */}
          <div className="p-4 sm:px-6 sm:py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Sparkles size={14} className="text-amber-500 shrink-0" />
              <span>Học đều đặn 45 phút/ngày hiệu quả gấp 5 lần học dồn cuối tuần!</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Đã hiểu
              </button>
              <button
                onClick={() => {
                  onClose();
                  if (selectedLevel === 'beginner') navigate('/vocab');
                  else if (selectedLevel === 'hesitant') navigate('/reflex-50');
                  else navigate('/communication');
                }}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ED] text-white text-xs font-bold shadow-sm shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Bắt đầu học ngay</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
