import{i as e}from"./rolldown-runtime-Dd_uD5pT.js";import{l as t}from"./vendor-charts-BUkKEuaX.js";import{d as n,f as r,n as i}from"./vendor-react-BzvrDGY5.js";import{$ as a,Ct as o,Ft as s,Pt as c,St as l,_ as u,r as d,x as f}from"./vendor-icons-DwzuIldj.js";import{r as p,t as m}from"./vendor-motion-CQIxfVi6.js";import{i as h,o as g,t as _}from"./index-B_Yqb96T.js";var v=e(t(),1),y=p();function b(){let{chapterNumber:e}=r(),t=parseInt(e,10)||1,p=n(),[b,x]=(0,v.useState)(()=>g.peekChapterBonus(t)),[S,C]=(0,v.useState)(()=>!g.peekChapterBonus(t));(0,v.useEffect)(()=>{let e=g.peekChapterBonus(t);e?(x(e),C(!1)):C(!0),g.getChapterBonus(t).then(e=>{e?.data&&x(e.data)}).catch(e=>{console.error(`Lỗi lấy nội dung bonus:`,e),i.error(`Không tìm thấy nội dung bổ sung`)}).finally(()=>C(!1)),t<12&&g.prefetchBonus(t+1),t>1&&g.prefetchBonus(t-1)},[t]);let w=e=>{h.speakWord(e)};return S?(0,y.jsx)(_,{}):(0,y.jsxs)(`div`,{className:`space-y-6 sm:space-y-8 max-w-4xl mx-auto pb-16 px-2 sm:px-0`,children:[(0,y.jsx)(`style`,{children:`
        .bino-epub-bonus-content .section-header {
          display: flex;
          align-items: center;
          border-bottom: 2px solid #2b999d;
          padding-bottom: 10px;
          margin-top: 28px;
          margin-bottom: 20px;
        }
        .bino-epub-bonus-content .section-letter {
          background: linear-gradient(135deg, #2b999d, #408d99);
          color: #ffffff;
          font-weight: 900;
          font-size: 1.15rem;
          padding: 4px 12px;
          border-radius: 10px;
          margin-right: 14px;
          box-shadow: 0 2px 6px rgba(43, 153, 157, 0.25);
        }
        .bino-epub-bonus-content .section-text {
          color: #2b999d;
          font-size: 1.25rem;
          font-weight: 800;
          margin: 0;
        }
        .dark .bino-epub-bonus-content .section-text {
          color: #5eead4;
        }
        .bino-epub-bonus-content .main-topic-title {
          text-align: center;
          font-size: 1.35rem;
          font-weight: 900;
          margin: 24px 0 18px 0;
          letter-spacing: 1.5px;
          color: #0f172a;
          background: rgba(245, 158, 11, 0.12);
          padding: 10px 16px;
          border-radius: 14px;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .dark .bino-epub-bonus-content .main-topic-title {
          color: #fef3c7;
          background: rgba(245, 158, 11, 0.15);
        }
        .bino-epub-bonus-content .expressions-list {
          margin-top: 16px;
          padding-left: 8px;
        }
        .bino-epub-bonus-content .expression-item {
          border-left: 2px dashed #f59e0b;
          padding-left: 18px;
          margin-bottom: 22px;
          position: relative;
        }
        .bino-epub-bonus-content .expression-item::before {
          content: "";
          position: absolute;
          left: -6px;
          top: 6px;
          width: 10px;
          height: 10px;
          background-color: #f59e0b;
          border-radius: 50%;
        }
        .bino-epub-bonus-content .expression-title {
          font-weight: 800;
          font-size: 1.05rem;
          margin-top: 0;
          margin-bottom: 8px;
          color: #0f172a !important;
        }
        .dark .bino-epub-bonus-content .expression-title {
          color: #f8fafc !important;
        }
        .bino-epub-bonus-content .expression-title .vie {
          font-weight: 600;
          font-style: italic;
          color: #64748b !important;
        }
        .dark .bino-epub-bonus-content .expression-title .vie {
          color: #94a3b8 !important;
        }
        .bino-epub-bonus-content .expression-content {
          margin: 0;
          line-height: 1.85;
          font-weight: 700;
          color: #1e293b;
          background: rgba(248, 250, 252, 0.8);
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .bino-epub-bonus-content .expression-content:hover {
          border-color: #f59e0b;
          background: rgba(254, 243, 199, 0.35);
        }
        .dark .bino-epub-bonus-content .expression-content {
          color: #e2e8f0;
          background: rgba(30, 41, 59, 0.65);
          border-color: rgba(51, 65, 85, 0.8);
        }
        .bino-epub-bonus-content .col-2 {
          display: flex;
          gap: 28px;
          flex-wrap: wrap;
        }
        .bino-epub-bonus-content .dialogue-box {
          border: 2px solid #cbd5e1;
          border-radius: 16px;
          padding: 18px;
          margin: 16px 0;
          background: rgba(248, 250, 252, 0.5);
        }
        .dark .bino-epub-bonus-content .dialogue-box {
          border-color: #334155;
          background: rgba(15, 23, 42, 0.45);
        }
        .bino-epub-bonus-content .eng {
          font-weight: 800;
          color: #0f172a !important;
          margin-bottom: 4px;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .bino-epub-bonus-content .eng:hover {
          color: #d97706 !important;
        }
        .dark .bino-epub-bonus-content .eng {
          color: #f8fafc !important;
        }
        .dark .bino-epub-bonus-content .eng:hover {
          color: #fbbf24 !important;
        }
        .bino-epub-bonus-content .vie {
          font-style: italic;
          color: #475569 !important;
        }
        .dark .bino-epub-bonus-content .vie {
          color: #94a3b8 !important;
        }
        .bino-epub-bonus-content .philosophy-box {
          border: 3px double #f59e0b;
          border-radius: 20px;
          padding: 24px;
          margin: 28px 0 16px 0;
          background: linear-gradient(145deg, rgba(254, 243, 199, 0.25), rgba(255, 251, 235, 0.1));
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.08);
        }
        .dark .bino-epub-bonus-content .philosophy-box {
          border-color: #d97706;
          background: linear-gradient(145deg, rgba(120, 53, 15, 0.2), rgba(30, 41, 59, 0.4));
        }
        .bino-epub-bonus-content .philosophy-title {
          text-align: center;
          font-size: 1.45rem;
          font-weight: 900;
          text-transform: uppercase;
          margin-top: 0;
          margin-bottom: 18px;
          border-bottom: 2px solid rgba(245, 158, 11, 0.4);
          padding-bottom: 12px;
          color: #b45309;
          letter-spacing: 1px;
        }
        .dark .bino-epub-bonus-content .philosophy-title {
          color: #fbbf24;
        }
        .bino-epub-bonus-content .philosophy-content p {
          text-align: justify;
          margin-bottom: 14px;
          font-size: 0.98rem;
          line-height: 1.75;
        }
        .bino-epub-bonus-content .philosophy-signature {
          text-align: right;
          font-weight: 800;
          font-style: italic;
          margin-top: 20px;
          color: #d97706;
        }
        .bino-epub-bonus-content .vocab-list {
          list-style: none;
          padding-left: 0;
        }
        .bino-epub-bonus-content .vocab-list li {
          margin-bottom: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(248, 250, 252, 0.7);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .dark .bino-epub-bonus-content .vocab-list li {
          background: rgba(30, 41, 59, 0.5);
          border-color: rgba(51, 65, 85, 0.7);
        }
        .bino-epub-bonus-content strong,
        .bino-epub-bonus-content span[style*="color: #000"],
        .bino-epub-bonus-content div[style*="color: #333"] {
          color: inherit !important;
        }
        .bino-epub-bonus-content hr.bonus-page-divider {
          border: 0;
          border-top: 1px dashed rgba(148, 163, 184, 0.35);
          margin: 24px 0;
        }
      `}),(0,y.jsxs)(`div`,{className:`flex flex-wrap items-center justify-between gap-2`,children:[(0,y.jsxs)(m.button,{whileHover:{scale:1.03},whileTap:{scale:.96},onClick:()=>p(`/bino`),className:`p-2.5 px-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-all shadow-sm flex items-center gap-2 text-xs font-bold`,children:[(0,y.jsx)(s,{size:16}),(0,y.jsx)(`span`,{children:`Về Lộ Trình 12 Chương`})]}),(0,y.jsxs)(`div`,{className:`flex items-center gap-2`,children:[(0,y.jsxs)(`button`,{disabled:t<=1,onClick:()=>p(`/bino/chapter/${t-1}/bonus`),className:`p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:border-amber-400 transition-all text-xs font-bold flex items-center gap-1`,title:`Chương trước`,children:[(0,y.jsx)(l,{size:15}),(0,y.jsxs)(`span`,{className:`hidden sm:inline`,children:[`Chương `,t-1]})]}),(0,y.jsxs)(`span`,{className:`px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 flex items-center gap-1.5 shadow-sm border border-amber-300/80 dark:border-amber-800`,children:[(0,y.jsx)(u,{size:14,className:`text-amber-500 fill-amber-500`}),(0,y.jsxs)(`span`,{children:[`Cuối Chương `,t<10?`0${t}`:t,` / 12`]})]}),(0,y.jsxs)(`button`,{disabled:t>=12,onClick:()=>p(`/bino/chapter/${t+1}/bonus`),className:`p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:border-amber-400 transition-all text-xs font-bold flex items-center gap-1`,title:`Chương tiếp theo`,children:[(0,y.jsxs)(`span`,{className:`hidden sm:inline`,children:[`Chương `,t+1]}),(0,y.jsx)(o,{size:15})]})]})]}),(0,y.jsxs)(m.div,{initial:{opacity:0,y:15},animate:{opacity:1,y:0},className:`glass-card p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-purple-600/10 border border-amber-300/70 dark:border-amber-900/40 space-y-4 shadow-xl relative overflow-hidden`,children:[(0,y.jsx)(`div`,{className:`absolute -top-16 -right-16 w-56 h-56 bg-amber-400/20 rounded-full blur-3xl pointer-events-none`}),(0,y.jsxs)(`div`,{className:`flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400`,children:[(0,y.jsx)(a,{size:16}),(0,y.jsx)(`span`,{children:`Trọn Vẹn Nội Dung Cuối Chương Sách Ebook (Section B • Section C • Bino's Philosophy)`})]}),(0,y.jsx)(`h1`,{className:`text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight`,children:b?.title||`Mẫu Câu Mở Rộng & Bino's Philosophy - Chương ${t}`}),(0,y.jsxs)(`p`,{className:`text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl font-normal`,children:[`Toàn bộ các mẫu câu mở rộng (More expressions), bài tập thực hành nói cùng Bino (Practise speaking with Bino) và tâm sự triết lý học tiếng Anh của Bino ở cuối Chương `,t,`. 💡 `,(0,y.jsx)(`strong`,{children:`Mẹo:`}),` Bạn có thể bấm trực tiếp vào bất kỳ câu tiếng Anh nào bên dưới để nghe phát âm chuẩn!`]})]}),b?.slangList?.length>0&&(0,y.jsxs)(`div`,{className:`space-y-3`,children:[(0,y.jsxs)(`div`,{className:`flex items-center justify-between px-1`,children:[(0,y.jsxs)(`h3`,{className:`text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2`,children:[(0,y.jsx)(f,{size:18,className:`text-amber-500`}),(0,y.jsxs)(`span`,{children:[`Từ Khóa & Cụm Từ Phản Xạ Nhanh Trong Chương `,t,`:`]})]}),(0,y.jsxs)(`span`,{className:`text-xs text-slate-400 font-bold`,children:[b.slangList.length,` cụm từ`]})]}),(0,y.jsx)(`div`,{className:`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3`,children:b.slangList.map((e,t)=>(0,y.jsxs)(m.div,{whileHover:{y:-2,scale:1.01},onClick:()=>w(e),className:`p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between group hover:border-amber-400 cursor-pointer transition-all`,children:[(0,y.jsxs)(`div`,{className:`flex items-center gap-2.5 truncate`,children:[(0,y.jsx)(`span`,{className:`w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black text-xs flex items-center justify-center shrink-0`,children:t+1}),(0,y.jsxs)(`span`,{className:`font-bold text-sm text-slate-900 dark:text-white truncate`,children:[`"`,e,`"`]})]}),(0,y.jsx)(`button`,{onClick:t=>{t.stopPropagation(),w(e)},className:`p-2 rounded-xl text-slate-400 group-hover:text-amber-600 group-hover:bg-amber-50 dark:group-hover:bg-slate-700 transition-colors shrink-0`,title:`Nghe phát âm chuẩn`,children:(0,y.jsx)(d,{size:16})})]},t))})]}),b?.contentHtml&&(0,y.jsx)(m.div,{initial:{opacity:0},animate:{opacity:1},onClick:e=>{let t=e.target.closest(`.eng, .expression-content, li strong`);if(!t)return;let n=(t.innerText||t.textContent||``).replace(/^[►•⭐\d.)\-\s]+/,``).replace(/:$/,``).trim();if(n&&n.length>1&&n.length<260){let e=n.split(`
`)[0].trim();e&&(h.speakWord(e),i.success(`🔊 Đang phát âm: "${e.slice(0,55)}${e.length>55?`...`:``}"`,{id:`bonus-tts`,duration:2e3}))}},className:`bino-epub-bonus-content glass-card p-6 sm:p-8 md:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-none text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-vietsub shadow-md`,children:(0,y.jsx)(`div`,{dangerouslySetInnerHTML:{__html:b.contentHtml}})}),(0,y.jsxs)(`div`,{className:`p-6 sm:p-8 rounded-3xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-inner`,children:[(0,y.jsxs)(`h4`,{className:`font-black text-base sm:text-lg text-slate-900 dark:text-white`,children:[`Đã Nắm Trọn Tinh Hoa Chương `,t,`!`]}),(0,y.jsx)(`p`,{className:`text-xs text-slate-500 max-w-md mx-auto`,children:`Hãy tiếp tục ôn tập từ vựng với Flashcards SRS hoặc bước sang chương tiếp theo để nâng cấp phản xạ giao tiếp nhé!`}),(0,y.jsxs)(`div`,{className:`flex flex-wrap items-center justify-center gap-3`,children:[(0,y.jsxs)(m.button,{whileHover:{scale:1.03},whileTap:{scale:.97},onClick:()=>p(`/bino`),className:`px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5`,children:[(0,y.jsx)(s,{size:14}),(0,y.jsx)(`span`,{children:`Trở Về Lộ Trình 12 Chương`})]}),t<12&&(0,y.jsxs)(m.button,{whileHover:{scale:1.03},whileTap:{scale:.97},onClick:()=>p(`/bino/chapter/${t+1}/bonus`),className:`px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5`,children:[(0,y.jsxs)(`span`,{children:[`Xem Tiếp Cuối Chương `,t+1]}),(0,y.jsx)(c,{size:14})]})]})]})]})}export{b as default};