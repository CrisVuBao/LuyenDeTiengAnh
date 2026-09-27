import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, Headphones, Mic, PenTool, Layers, CheckCircle2,
  Clock, Zap, EyeOff, Volume2, ArrowRight, BookOpen, HelpCircle, Award
} from 'lucide-react';
import speechService from '../../../utils/speechService';

const METHOD_STEPS = [
  {
    step: '01',
    title: 'Tư Duy Cụm Từ (Chunking) — Tuyệt Đối Không Dịch Từng Chữ',
    subtitle: 'Bước khởi động (3 phút / 10 câu)',
    icon: Layers,
    color: 'bg-blue-500/10 text-[#0071e3] border-blue-200 dark:border-blue-800/60',
    badge: 'Bí quyết số 1',
    problem: 'Người Việt thường bị "đứng hình" khi giao tiếp vì cố ghép từng từ đơn lẻ: "Tôi" (I) + "luôn" (always) + "tạo" (?) + "ấn tượng" (?) + "tốt" (?)...',
    solution: 'Người bản xứ không ghép từng từ — họ nói theo CỤM TỪ ĐÓNG GÓI SẴN (Chunks). Trong mỗi câu của 50 Chủ đề, tài liệu đã bóc sẵn các cụm từ cốt lõi dưới câu tiếng Việt. Hãy nhìn vào các cụm đó và bấm nghe phát âm trước khi ghép câu.',
    example: {
      vi: 'Tôi luôn cố gắng tạo ấn tượng tốt trong lần gặp đầu tiên.',
      chunks: ['always try to', 'make a good impression', 'at the first meeting'],
      en: 'I always try to make a good impression at the first meeting.'
    }
  },
  {
    step: '02',
    title: 'Quy Tắc Phản Xạ 3 Giây (Che Đáp Án & Tự Bật Thành Tiếng)',
    subtitle: 'Bước rèn phản xạ não bộ (5 phút / 10 câu)',
    icon: EyeOff,
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
    badge: 'Tạo phản xạ nói',
    problem: 'Nếu bạn nhìn câu tiếng Việt rồi đọc luôn đáp án tiếng Anh bên dưới, não bạn chỉ đang "nhận diện thụ động" — 5 phút sau gấp sách lại sẽ quên sạch.',
    solution: 'Hãy bật nút "Ẩn Đáp Án Tiếng Anh" hoặc vào tab "Phản Xạ Nói 3s". Nhìn câu tiếng Việt + Gợi ý cụm từ, ép bản thân bật ra câu tiếng Anh thành tiếng trong 3–5 giây (dù ban đầu còn vấp). Sau đó mới bấm mở đáp án và thu âm đối chiếu.',
    example: {
      vi: 'Mặc dù lịch trình rất bận rộn, chuyến công tác đã thành công.',
      chunks: ['Although the schedule was very busy', 'the trip was successful'],
      en: 'Although the schedule was very busy, the trip was successful.'
    }
  },
  {
    step: '03',
    title: 'Phương Pháp Làm Bài Viết 2 Tầng: Ghép Khối Từ → Tự Gõ Câu',
    subtitle: 'Bước khắc sâu ngữ pháp & chính tả (7 phút / 10 câu)',
    icon: PenTool,
    color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60',
    badge: 'Làm bài hiệu quả',
    problem: 'Làm bài trên giấy (dòng → _______) không ai chấm lỗi chia thì, thiếu "a/an/the", thiếu "-s/-ed", khiến bạn viết sai thành thói quen.',
    solution: 'Trong tab "Làm Bài Viết", nếu mới học chủ đề đó, hãy chọn chế độ "Ghép Cụm Từ (Word Blocks)" để nắm trật tự câu chuẩn. Khi đã quen, chuyển sang "Tự Gõ Cả Câu" — hệ thống sẽ chấm điểm từng từ (chấp nhận cả viết tắt như I\'m = I am) và bôi màu chính xác từ bạn thiếu hoặc sai.',
    example: {
      vi: 'Tôi đã đợi phản hồi email gần một tuần rồi.',
      chunks: ['I have been waiting for', 'an email reply', 'for nearly a week'],
      en: 'I have been waiting for an email reply for nearly a week.'
    }
  },
  {
    step: '04',
    title: 'Nghe Chậm Rãi (0.75x) & Nhại Bắt Chước (Shadowing Loop)',
    subtitle: 'Bước luyện tai nghe & ngữ điệu bản xứ (5 phút)',
    icon: Headphones,
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
    badge: 'Chuẩn âm bản xứ',
    problem: 'Biết từ vựng trên mặt chữ nhưng khi người nước ngoài nói lại không nghe kịp, hoặc tự nói ra nghe rất "ngang" và thiếu âm cuối.',
    solution: 'Với câu mới hoặc câu dài (Câu 21–30), hãy bấm nút "Chậm (0.75x)" có biểu tượng Tai nghe để nghe rõ từng âm nối và trọng âm câu, nhại theo 3 lần. Sau đó chuyển về tốc độ Bản xứ (0.95x - 1.0x) và bật "Phát Liên Tục 30 Câu" để tắm ngôn ngữ.',
    example: {
      vi: 'Giao tiếp hiệu quả qua điện thoại và email giúp xây dựng mối quan hệ chuyên nghiệp bền chặt hơn.',
      chunks: ['Effective communication by phone and email', 'helps build', 'stronger professional relationships'],
      en: 'Effective communication by phone and email helps build stronger professional relationships.'
    }
  }
];

const THREE_TIERS_GUIDE = [
  {
    tier: 'Tầng 1: Câu 1 – 10',
    name: 'Phản Xạ Nền Tảng (Core Patterns)',
    color: 'emerald',
    desc: 'Các câu đơn ngắn gọn, sử dụng thì Hiện tại đơn, Hiện tại tiếp diễn, Quá khứ đơn và từ vựng cốt lõi nhất của chủ đề.',
    howToStudy: 'Mục tiêu: Phản xạ bật ra thành tiếng dưới 3 giây mà không cần nhìn gợi ý ở lần ôn thứ 2.',
    sample: '1. I have a bank account. / 4. I usually pay by card.'
  },
  {
    tier: 'Tầng 2: Câu 11 – 20',
    name: 'Mở Rộng Tình Huống (Compound & Practical)',
    color: 'blue',
    desc: 'Bắt đầu nối 2 mệnh đề bằng because, so, when, while, to + V (chỉ mục đích) và thì Hiện tại hoàn thành (have/has + V3).',
    howToStudy: 'Mục tiêu: Chú ý từ nối nguyên nhân - kết quả và cách chia động từ khi kể lại trải nghiệm thực tế.',
    sample: '17. I like paying by card because it is more convenient.'
  },
  {
    tier: 'Tầng 3: Câu 21 – 30',
    name: 'Giao Tiếp Lưu Loát & Chuyên Sâu (Fluency Mastery)',
    color: 'purple',
    desc: 'Các cấu trúc ăn điểm cao trong giao tiếp công sở & thuyết trình: Although..., have been + V-ing, Not only... but also..., The more... the more...',
    howToStudy: 'Mục tiêu: Nghe chậm 0.75x để ngắt nhịp đúng chỗ (chunking theo cụm), làm bài viết kỹ từng câu và lưu Sao các câu tâm đắc.',
    sample: '30. Good financial management not only helps you save money but also helps you achieve your long-term goals.'
  }
];

export default function Reflex50MethodGuideModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('steps'); // 'steps' | 'tiers' | 'mistakes'

  if (!isOpen) return null;

  const speakSample = (text, rate = 0.95) => {
    speechService.speak(text, { rate, speakerIndex: 0 });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/90">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0071e3] text-white flex items-center justify-center shadow-sm">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Phương Pháp Học Giao Tiếp & Làm Bài 1500 Câu Hiệu Quả Nhất
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Lộ trình khoa học biến 50 chủ đề trên trang giấy thành phản xạ nói - viết tự nhiên trong 20 phút/ngày
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300/70 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Sub-navigation Tabs */}
          <div className="px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap gap-2 bg-white dark:bg-slate-900">
            {[
              { id: 'steps', label: '1. Quy Trình 4 Bước Học & Làm Bài', icon: Zap },
              { id: 'tiers', label: '2. Chiến Thuật 3 Tầng Câu (1 → 30)', icon: Layers },
              { id: 'mistakes', label: '3. Mẹo Khắc Phục 4 Lỗi Giao Tiếp Kinh Điển', icon: Award }
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#0071e3] text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon size={14} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Scrollable Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {activeTab === 'steps' && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#0071e3] dark:text-sky-400">
                      Công thức vàng 20 phút mỗi ngày = Làm chủ 1 Chủ đề (30 câu)
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Đừng cố học liền lúc 5–10 chủ đề bằng cách đọc lướt. Hãy chia mỗi Unit (30 câu) thành <strong>3 chặng nhỏ (mỗi chặng 10 câu)</strong> và áp dụng đúng 4 bước dưới đây:
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-blue-200/60 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <Clock size={15} className="text-[#0071e3]" />
                    <span>20 phút / Unit</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {METHOD_STEPS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.step}
                        className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm ${item.color}`}>
                              <Icon size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0071e3] dark:text-sky-400">
                                  Bước {item.step} • {item.subtitle}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                                  {item.badge}
                                </span>
                              </div>
                              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5">
                                {item.title}
                              </h3>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 text-slate-700 dark:text-slate-300">
                            <span className="font-bold text-rose-600 dark:text-rose-400 block mb-1">
                              ❌ Cách học sai thường gặp:
                            </span>
                            {item.problem}
                          </div>
                          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-slate-700 dark:text-slate-300">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                              ✅ Cách thực hành chuẩn trên hệ thống:
                            </span>
                            {item.solution}
                          </div>
                        </div>

                        {/* Interactive Example Box */}
                        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              Ví dụ thực hành: <span className="text-slate-800 dark:text-slate-200 font-semibold">"{item.example.vi}"</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {item.example.chunks.map((chunk, idx) => (
                                <React.Fragment key={idx}>
                                  <button
                                    onClick={() => speakSample(chunk, 0.85)}
                                    className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/70 text-xs font-semibold text-[#0071e3] dark:text-sky-300 hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1"
                                    title="Bấm để nghe phát âm cụm từ này"
                                  >
                                    <Volume2 size={12} />
                                    <span>{chunk}</span>
                                  </button>
                                  {idx < item.example.chunks.length - 1 && (
                                    <span className="text-slate-400 font-bold">+</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white pt-0.5">
                              → {item.example.en}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => speakSample(item.example.en, 0.95)}
                              className="px-3 py-1.5 rounded-xl bg-[#0071e3] text-white text-xs font-semibold hover:bg-[#0077ed] transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Volume2 size={13} />
                              <span>Nghe chuẩn</span>
                            </button>
                            <button
                              onClick={() => speakSample(item.example.en, 0.72)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Headphones size={13} />
                              <span>Chậm 0.75x</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'tiers' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Tại sao mỗi Unit đều có đúng 30 câu được sắp xếp từ dễ đến khó?
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Tài liệu <strong>1500 Câu Phản Xạ Nói - Viết</strong> được thiết kế theo phương pháp <strong>Scaffolding (Bắc giàn giáo nhận thức)</strong>. Từ câu 1 đến câu 30 trong cùng một chủ đề, từ vựng cốt lõi được lặp lại có chủ đích nhưng cấu trúc ngữ pháp được nâng dần lên 3 tầng rõ rệt:
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {THREE_TIERS_GUIDE.map((t, i) => (
                    <div
                      key={i}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0071e3]/10 text-[#0071e3] dark:text-sky-400">
                          {t.tier}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">10 câu / tầng</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">{t.name}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{t.desc}</p>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                          🎯 Chiến thuật làm bài & luyện nói:
                        </div>
                        <div className="text-slate-700 dark:text-slate-300">{t.howToStudy}</div>
                        <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          Ví dụ: {t.sample}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'mistakes' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      title: '1. Quên động từ "to be" trước Tính từ hoặc V-ing',
                      wrong: 'I very happy to meet you. / I talking to a new friend.',
                      right: 'I am very happy to meet you. / I am talking to a new friend.',
                      tip: 'Trong tiếng Việt nói "Tôi rất vui" (không cần chữ "thì/là"), nhưng tiếng Anh bắt buộc phải có am/is/are đứng trước tính từ (happy, busy, tired) và trước V-ing!'
                    },
                    {
                      title: '2. Không phân biệt Thì Hiện Tại Đơn, Hiện Tại Hoàn Thành & HTHT Tiếp Diễn',
                      wrong: 'I live here for five years. (Sai khi nói việc kéo dài từ quá khứ đến nay)',
                      right: 'I have lived here for five years. / I have been waiting for nearly a week.',
                      tip: 'Khi câu có "for + khoảng thời gian" (for 5 years) hoặc "since + mốc thời gian" (since last year, since this morning), hãy bật ngay phản xạ dùng have/has + V3 hoặc have/has been + V-ing!'
                    },
                    {
                      title: '3. Dùng đồng thời cả "Although" và "but" trong cùng một câu',
                      wrong: 'Although the schedule was busy, but the trip was successful.',
                      right: 'Although the schedule was busy, the trip was successful.',
                      tip: 'Từ câu 26–30 của mọi Unit đều rèn cấu trúc "Although..., S + V". Nhớ tuyệt đối: Đã có Although ở đầu câu thì mệnh đề sau chỉ dùng dấu phẩy (,), KHÔNG dùng thêm "but"!'
                    },
                    {
                      title: '4. Quên chia động từ hoặc danh từ số nhiều trong cấu trúc "Not only... but also..."',
                      wrong: 'Reading books not only improve knowledge...',
                      right: 'Reading books not only improves knowledge but also develops thinking skills.',
                      tip: 'Chủ ngữ là Danh động từ (V-ing đứng đầu câu như Reading books, Using the Internet, Managing finances) luôn được tính là ngôi thứ 3 số ít → Động từ theo sau phải thêm -s/-es (improves, develops, helps)!'
                    }
                  ].map((m, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5"
                    >
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{m.title}</h4>
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 font-medium">
                        ❌ Hay nói sai: {m.wrong}
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-between gap-2">
                        <span>✅ Phản xạ chuẩn: {m.right}</span>
                        <button
                          onClick={() => speakSample(m.right.split('/')[0], 0.9)}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0 cursor-pointer"
                          title="Nghe câu chuẩn"
                        >
                          <Volume2 size={12} />
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{m.tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200/70 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              💡 Mẹo: Bạn có thể mở lại Cẩm nang phương pháp này bất kỳ lúc nào ở góc trên trang học.
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Đã hiểu, bắt đầu luyện tập!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
