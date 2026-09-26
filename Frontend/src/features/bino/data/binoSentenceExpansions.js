/**
 * VBaceEnglish - Ngân Hàng Mẫu Câu Cốt Lõi & Biến Thể Thực Tế Chuẩn Ebook Bino
 * Sách "Chém Tiếng Anh Không Cần Động Não" - Tác giả Bino (TiengAnhBi.epub)
 * 
 * Toàn bộ dữ liệu mẫu câu, biến thể và tình huống thực tế được biên soạn
 * dựa trên 100% nội dung hội thoại và Section B (More expressions) từ 6 chương của Ebook.
 */

export const SENTENCE_EXPANSIONS_DATABASE = [
  // =========================================================================
  // CHƯƠNG 1: GREETINGS & INTRODUCTIONS (CHÀO HỎI & GIỚI THIỆU BẢN THÂN)
  // =========================================================================
  {
    originalKey: "I'm still getting used to the campus layout though.",
    patternKeywords: ["getting used to", "get used to"],
    corePattern: "I'm still getting used to [something / V-ing] though.",
    patternMeaningVi: "Tôi vẫn đang tập làm quen dần với [điều gì / việc gì] thôi.",
    grammarTip: "Sau 'getting used to' LUÔN đi cùng Danh từ hoặc Động từ đuôi -ING. Dùng khi bạn đang trong quá trình thích nghi với môi trường, văn hóa hoặc thói quen mới.",
    fixedPrefix: "Nice to meet you too, Amy. It's been pretty good. I'm still getting used to ",
    fixedSuffix: " though.",
    defaultSlot: "the campus layout",
    quickSuggestions: [
      "the house layout",
      "the office culture",
      "the cold winter here",
      "waking up at 6 AM",
      "working from home",
      "the spicy food here"
    ],
    variations: [
      {
        context: "🏠 Chuyển nhà / Nơi ở mới",
        contextTag: "Nhà ở & Sinh hoạt",
        icon: "Home",
        englishText: "Nice to meet you too, Amy. It's been pretty good. I'm still getting used to the house layout though.",
        vietnameseText: "Rất vui được làm quen với Amy. Cũng OK đấy, tôi vẫn đang tập làm quen với cách bố trí trong ngôi nhà mới thôi.",
        slotReplaced: "the house layout",
        slotOriginal: "the campus layout"
      },
      {
        context: "🏢 Công sở / Chuyển việc mới",
        contextTag: "Công việc",
        icon: "Briefcase",
        englishText: "Nice to meet you too, Amy. It's been pretty good. I'm still getting used to the office culture though.",
        vietnameseText: "Rất vui được gặp bạn. Mọi thứ khá ổn, chỉ là tôi vẫn đang tập thích nghi với văn hóa công ty mới.",
        slotReplaced: "the office culture",
        slotOriginal: "the campus layout"
      },
      {
        context: "❄️ Thời tiết / Du học / Định cư",
        contextTag: "Môi trường sống",
        icon: "CloudSnow",
        englishText: "Nice to meet you too, Amy. It's been pretty good. I'm still getting used to the cold winter here though.",
        vietnameseText: "Rất vui được gặp bạn. Tôi vẫn ổn, nhưng vẫn đang phải tập thích nghi với mùa đông buốt giá ở đây.",
        slotReplaced: "the cold winter here",
        slotOriginal: "the campus layout"
      },
      {
        context: "⏰ Thay đổi nhịp sống / Lối sống",
        contextTag: "Thói quen",
        icon: "Clock",
        englishText: "Nice to meet you too, Amy. It's been pretty good. I'm still getting used to waking up at 6 AM though.",
        vietnameseText: "Rất vui được gặp bạn. Mọi thứ đều ổn, chỉ là tôi vẫn đang phải tập quen với việc thức dậy lúc 6 giờ sáng.",
        slotReplaced: "waking up at 6 AM",
        slotOriginal: "the campus layout"
      },
      {
        context: "🚗 Giao thông / Đi lại nước ngoài",
        contextTag: "Giao thông",
        icon: "Car",
        englishText: "Nice to meet you too, Amy. It's been pretty good. I'm still getting used to driving on the right side though.",
        vietnameseText: "Rất vui được gặp bạn. Tôi ổn, chỉ là vẫn đang phải tập làm quen với việc lái xe bên lề phải.",
        slotReplaced: "driving on the right side",
        slotOriginal: "the campus layout"
      }
    ]
  },
  {
    originalKey: "How are you finding everything so far?",
    patternKeywords: ["how are you finding"],
    corePattern: "How are you finding [something] so far?",
    patternMeaningVi: "Bạn thấy [điều gì / nơi này] thế nào cho đến lúc này?",
    grammarTip: "Người bản xứ (đặc biệt là Anh, Úc, Mỹ) rất hay dùng 'How are you finding...' thay cho câu hỏi quen thuộc 'How do you like...'. Cực kỳ tự nhiên và lịch sự.",
    fixedPrefix: "How are you finding ",
    fixedSuffix: " so far?",
    defaultSlot: "everything",
    quickSuggestions: [
      "the new job",
      "the food here",
      "living in this city",
      "your new apartment",
      "the English course"
    ],
    variations: [
      {
        context: "💼 Hỏi thăm đồng nghiệp mới",
        contextTag: "Công sở",
        icon: "Briefcase",
        englishText: "How are you finding the new job so far?",
        vietnameseText: "Bạn thấy công việc mới thế nào rồi?",
        slotReplaced: "the new job",
        slotOriginal: "everything"
      },
      {
        context: "🍜 Đi ăn uống / Trải nghiệm ẩm thực",
        contextTag: "Ăn uống",
        icon: "Utensils",
        englishText: "How are you finding the food here so far?",
        vietnameseText: "Bác thấy đồ ăn ở đây thế nào, có hợp khẩu vị không?",
        slotReplaced: "the food here",
        slotOriginal: "everything"
      },
      {
        context: "🏙️ Sống ở thành phố mới / Du học",
        contextTag: "Đời sống",
        icon: "MapPin",
        englishText: "How are you finding living in this city so far?",
        vietnameseText: "Bác thấy cuộc sống ở thành phố này thế nào rồi?",
        slotReplaced: "living in this city",
        slotOriginal: "everything"
      },
      {
        context: "📚 Hỏi về khóa học / Khóa đào tạo",
        contextTag: "Học tập",
        icon: "BookOpen",
        englishText: "How are you finding the course so far?",
        vietnameseText: "Bác thấy khóa học này thế nào, có tiếp thu tốt không?",
        slotReplaced: "the course",
        slotOriginal: "everything"
      }
    ]
  },
  {
    originalKey: "You'll get the hang of it soon.",
    patternKeywords: ["get the hang of it", "get the hang of"],
    corePattern: "You'll get the hang of [something] soon.",
    patternMeaningVi: "Đừng lo, bạn sẽ quen tay / nắm được cách làm sớm thôi.",
    grammarTip: "'Get the hang of it' là một Idiom (thành ngữ) siêu phổ biến dùng để động viên ai đó khi họ đang lúng túng trước một kỹ năng hoặc công cụ mới.",
    fixedPrefix: "Don't worry, you'll get the hang of ",
    fixedSuffix: " soon.",
    defaultSlot: "it",
    quickSuggestions: [
      "this new software",
      "using this coffee machine",
      "the rules",
      "driving manual car",
      "speaking English"
    ],
    variations: [
      {
        context: "💻 Dùng phần mềm / Công cụ mới",
        contextTag: "Công nghệ",
        icon: "Laptop",
        englishText: "Don't worry, you'll get the hang of this new software soon.",
        vietnameseText: "Đừng lo, bác sẽ sớm nắm được cách dùng phần mềm mới này thôi.",
        slotReplaced: "this new software",
        slotOriginal: "it"
      },
      {
        context: "🚗 Học lái xe",
        contextTag: "Kỹ năng",
        icon: "Car",
        englishText: "Don't worry, you'll get the hang of driving a manual car soon.",
        vietnameseText: "Đừng lo lắng quá, rồi bạn sẽ quen chân côn số sàn sớm thôi.",
        slotReplaced: "driving a manual car",
        slotOriginal: "it"
      },
      {
        context: "🗣️ Luyện giao tiếp tiếng Anh",
        contextTag: "Ngôn ngữ",
        icon: "Languages",
        englishText: "Don't worry, you'll get the hang of speaking naturally soon.",
        vietnameseText: "Cứ kiên trì nhé, bạn sẽ sớm quen với việc phản xạ tiếng Anh tự nhiên thôi.",
        slotReplaced: "speaking naturally",
        slotOriginal: "it"
      }
    ]
  },
  {
    originalKey: "I've been meaning to check it out.",
    patternKeywords: ["been meaning to", "check it out"],
    corePattern: "I've been meaning to [verb]...",
    patternMeaningVi: "Tôi đã có ý định / tính làm việc này từ lâu rồi mà chưa có dịp.",
    grammarTip: "'I have been meaning to + V' dùng thì hiện tại hoàn thành tiếp diễn để chỉ một ý định ấp ủ từ trước trong đầu, nay mới có cơ hội thực hiện.",
    fixedPrefix: "I've been meaning to ",
    fixedSuffix: ".",
    defaultSlot: "check it out",
    quickSuggestions: [
      "watch that movie",
      "call you all week",
      "visit that new bookstore",
      "try that Vietnamese restaurant",
      "read Bino's book"
    ],
    variations: [
      {
        context: "🎬 Xem phim nổi tiếng",
        contextTag: "Giải trí",
        icon: "Film",
        englishText: "I've been meaning to watch that movie all month.",
        vietnameseText: "Tôi đã tính xem bộ phim đó cả tháng nay rồi mà chưa rảnh.",
        slotReplaced: "watch that movie all month",
        slotOriginal: "check it out"
      },
      {
        context: "📞 Gọi điện hỏi thăm bạn cũ",
        contextTag: "Quan hệ bạn bè",
        icon: "Phone",
        englishText: "I've been meaning to call you all week!",
        vietnameseText: "Tôi cứ tính gọi cho bạn suốt cả tuần nay mà bận quá!",
        slotReplaced: "call you all week!",
        slotOriginal: "check it out"
      },
      {
        context: "☕ Đi quán cafe mới mở",
        contextTag: "Địa điểm",
        icon: "Coffee",
        englishText: "I've been meaning to try that new coffee shop down the street.",
        vietnameseText: "Tôi đang định ghé thử quán cà phê mới mở dưới phố xem sao.",
        slotReplaced: "try that new coffee shop down the street",
        slotOriginal: "check it out"
      }
    ]
  },
  {
    originalKey: "Could you walk me through the process?",
    patternKeywords: ["walk me through"],
    corePattern: "Could you walk me through [something]?",
    patternMeaningVi: "Bạn có thể hướng dẫn chi tiết từng bước cho tôi được không?",
    grammarTip: "'Walk someone through something' là cụm từ vàng nơi công sở và học tập, nghĩa là giải thích cặn kẽ từng công đoạn một cách kiên nhẫn.",
    fixedPrefix: "Could you walk me through ",
    fixedSuffix: "?",
    defaultSlot: "the process",
    quickSuggestions: [
      "the steps",
      "this sales report",
      "how to use this system",
      "the contract details",
      "the schedule for today"
    ],
    variations: [
      {
        context: "📊 Báo cáo / Tài liệu công việc",
        contextTag: "Công sở",
        icon: "FileSpreadsheet",
        englishText: "Could you walk me through this sales report?",
        vietnameseText: "Sếp có thể giải thích chi tiết báo cáo doanh số này giúp em được không ạ?",
        slotReplaced: "this sales report",
        slotOriginal: "the process"
      },
      {
        context: "💻 Quy trình hệ thống phần mềm",
        contextTag: "Đào tạo",
        icon: "Monitor",
        englishText: "Could you walk me through how to use this system?",
        vietnameseText: "Bác chỉ giúp tôi từng bước cách sử dụng hệ thống này với nhé?",
        slotReplaced: "how to use this system",
        slotOriginal: "the process"
      }
    ]
  },
  {
    originalKey: "I'm looking forward to meeting new people.",
    patternKeywords: ["looking forward to"],
    corePattern: "I'm looking forward to [something / V-ing].",
    patternMeaningVi: "Tôi rất háo hức / mong chờ [điều gì / được làm gì].",
    grammarTip: "Rất nhiều người nhầm sau 'look forward to' dùng động từ nguyên mẫu, nhưng chuẩn xác là đi với DANH TỪ hoặc ĐỘNG TỪ V-ING.",
    fixedPrefix: "Sounds good! I'm looking forward to ",
    fixedSuffix: ".",
    defaultSlot: "meeting new people",
    quickSuggestions: [
      "our weekend trip",
      "working with your team",
      "seeing you tomorrow",
      "having dinner together",
      "trying the local food"
    ],
    variations: [
      {
        context: "✈️ Háo hức đi du lịch",
        contextTag: "Du lịch",
        icon: "Plane",
        englishText: "Sounds good! I'm looking forward to our weekend trip.",
        vietnameseText: "Tuyệt quá! Tôi đang cực kỳ mong chờ chuyến đi chơi cuối tuần của chúng ta.",
        slotReplaced: "our weekend trip",
        slotOriginal: "meeting new people"
      },
      {
        context: "🤝 Hợp tác công việc",
        contextTag: "Công việc",
        icon: "Users",
        englishText: "Sounds good! I'm looking forward to working with your team.",
        vietnameseText: "Rất tuyệt! Tôi rất trông đợi được làm việc cùng đội ngũ của bạn.",
        slotReplaced: "working with your team",
        slotOriginal: "meeting new people"
      }
    ]
  },
  {
    originalKey: "Hey everyone, mind if I join you? I'm Bino, the new guy in the office.",
    patternKeywords: ["mind if I", "join you"],
    corePattern: "Mind if I [verb]...?",
    patternMeaningVi: "Có phiền không nếu tôi [làm gì]...?",
    grammarTip: "'Do you mind if I...' hoặc nói tắt 'Mind if I...' là mẫu câu lịch sự số 1 của người bản xứ khi muốn xin phép ngồi cùng hoặc làm điều gì đó.",
    fixedPrefix: "Hey everyone, mind if I ",
    fixedSuffix: "?",
    defaultSlot: "join you",
    quickSuggestions: ["sit here", "ask a quick question", "turn on the AC", "borrow your pen"],
    variations: [
      {
        context: "🪑 Xin phép ngồi cùng bàn ăn",
        contextTag: "Ăn uống",
        icon: "Coffee",
        englishText: "Hey everyone, mind if I sit here?",
        vietnameseText: "Chào mọi người, tôi ngồi đây có phiền ai không ạ?",
        slotReplaced: "sit here",
        slotOriginal: "join you"
      },
      {
        context: "❓ Xin phép hỏi nhanh",
        contextTag: "Hỏi han",
        icon: "HelpCircle",
        englishText: "Hey everyone, mind if I ask a quick question?",
        vietnameseText: "Mấy bác ơi, phiền các bác một chút em hỏi câu này nhanh được không?",
        slotReplaced: "ask a quick question",
        slotOriginal: "join you"
      }
    ]
  },

  // =========================================================================
  // CHƯƠNG 2: FAMILY (GIA ĐÌNH & ĐỜI SỐNG SINH HOẠT)
  // =========================================================================
  {
    originalKey: "Hey, do you want to hit the bar tomorrow?",
    patternKeywords: ["hit the bar", "do you want to hit"],
    corePattern: "Do you want to hit the [place] tomorrow?",
    patternMeaningVi: "Mai bác có muốn ghé qua / tụ tập ở [địa điểm nào đó] không?",
    grammarTip: "'Hit the...' là tiếng lóng bản xứ rất hay dùng trong văn nói thân mật, mang nghĩa là 'ghé qua / đi đến' một địa điểm nào đó thay cho 'go to'.",
    fixedPrefix: "Hey, do you want to hit the ",
    fixedSuffix: " tomorrow?",
    defaultSlot: "bar",
    quickSuggestions: ["gym", "beach", "mall", "movies", "road"],
    variations: [
      {
        context: "🏋️ Rủ đi tập thể hình",
        contextTag: "Sức khỏe",
        icon: "Dumbbell",
        englishText: "Hey, do you want to hit the gym tomorrow?",
        vietnameseText: "Khê lô, mai có muốn đi tập gym cùng không bác?",
        slotReplaced: "gym",
        slotOriginal: "bar"
      },
      {
        context: "🏖️ Rủ đi biển chơi cuối tuần",
        contextTag: "Dã ngoại",
        icon: "Palmtree",
        englishText: "Hey, do you want to hit the beach tomorrow?",
        vietnameseText: "Mai rảnh không, ra biển xả hơi tí không bác?",
        slotReplaced: "beach",
        slotOriginal: "bar"
      },
      {
        context: "🛍️ Rủ đi trung tâm thương mại mua sắm",
        contextTag: "Mua sắm",
        icon: "ShoppingBag",
        englishText: "Hey, do you want to hit the mall tomorrow?",
        vietnameseText: "Mai có muốn lượn qua trung tâm thương mại mua sắm không?",
        slotReplaced: "mall",
        slotOriginal: "bar"
      }
    ]
  },
  {
    originalKey: "I'm having lunch with my grandparents tomorrow, they just flew in from Melbourne.",
    patternKeywords: ["having lunch with", "flew in from"],
    corePattern: "I'm having [meal] with [person], they just [verb]...",
    patternMeaningVi: "Tôi có hẹn ăn bữa [nào đó] với [ai đó]...",
    grammarTip: "Dùng thì hiện tại tiếp diễn để diễn tả một lịch trình cá nhân đã được hẹn trước chắc chắn trong tương lai gần.",
    fixedPrefix: "I can't, sorry mate. I'm having ",
    fixedSuffix: " tomorrow.",
    defaultSlot: "lunch with my grandparents",
    quickSuggestions: ["dinner with my parents", "coffee with my sister", "breakfast with my team", "a reunion with old friends"],
    variations: [
      {
        context: "🍲 Ăn tối cùng bố mẹ",
        contextTag: "Gia đình",
        icon: "Heart",
        englishText: "I can't, sorry mate. I'm having dinner with my parents tomorrow.",
        vietnameseText: "Xin lỗi nhé, tôi chịu rồi. Tối mai tôi có hẹn ăn cơm với bố mẹ rồi.",
        slotReplaced: "dinner with my parents",
        slotOriginal: "lunch with my grandparents"
      },
      {
        context: "☕ Đi cà phê với em gái",
        contextTag: "Gặp gỡ",
        icon: "Coffee",
        englishText: "I can't, sorry mate. I'm having coffee with my sister tomorrow.",
        vietnameseText: "Mai không được rồi bác ơi, tôi có hẹn cà phê với em gái rồi.",
        slotReplaced: "coffee with my sister",
        slotOriginal: "lunch with my grandparents"
      }
    ]
  },
  {
    originalKey: "It's important to cherish the time we have with our loved ones.",
    patternKeywords: ["cherish the time", "loved ones"],
    corePattern: "It's important to cherish [something]...",
    patternMeaningVi: "Rất quan trọng để biết trân trọng [điều gì đó quý giá].",
    grammarTip: "'Cherish' là động từ rất đẹp, thể hiện sự nâng niu, yêu thương và trân quý những khoảnh khắc, kỷ niệm hay con người bên cạnh mình.",
    fixedPrefix: "Definitely. It's important to cherish ",
    fixedSuffix: ".",
    defaultSlot: "the time we have with our loved ones",
    quickSuggestions: ["every moment of our youth", "the memories we make", "our good health", "the relationships we build"],
    variations: [
      {
        context: "🌱 Trân trọng từng khoảnh khắc thanh xuân",
        contextTag: "Triết lý sống",
        icon: "Sparkles",
        englishText: "Definitely. It's important to cherish every moment of our youth.",
        vietnameseText: "Chính xác. Quan trọng là ta phải biết trân trọng từng khoảnh khắc tuổi trẻ của mình.",
        slotReplaced: "every moment of our youth",
        slotOriginal: "the time we have with our loved ones"
      },
      {
        context: "📸 Trân trọng những kỷ niệm đẹp",
        contextTag: "Kỷ niệm",
        icon: "Camera",
        englishText: "Definitely. It's important to cherish the memories we make together.",
        vietnameseText: "Đúng thế. Điều quý giá là ta trân trọng những kỷ niệm đã cùng nhau tạo nên.",
        slotReplaced: "the memories we make together",
        slotOriginal: "the time we have with our loved ones"
      }
    ]
  },
  {
    originalKey: "Good morning, Bino! It's time for school. Did you sleep well?",
    patternKeywords: ["it's time for", "did you sleep well"],
    corePattern: "Good morning! It's time for [activity]. Did you sleep well?",
    patternMeaningVi: "Chào buổi sáng! Đến giờ [làm gì] rồi. Ngủ ngon giấc không?",
    grammarTip: "Mẫu câu Section B (trang 39) dùng để đánh thức và hỏi han người thân mỗi buổi sáng.",
    fixedPrefix: "Good morning! It's time for ",
    fixedSuffix: ". Did you sleep well?",
    defaultSlot: "school",
    quickSuggestions: ["work", "breakfast", "our morning jog", "your exam"],
    variations: [
      {
        context: "💼 Đến giờ đi làm",
        contextTag: "Công việc",
        icon: "Briefcase",
        englishText: "Good morning! It's time for work. Did you sleep well?",
        vietnameseText: "Chào buổi sáng! Tới giờ đi làm rồi. Đêm qua bạn ngủ ngon không?",
        slotReplaced: "work",
        slotOriginal: "school"
      },
      {
        context: "🍳 Đến giờ ăn sáng",
        contextTag: "Bữa ăn",
        icon: "Utensils",
        englishText: "Good morning! It's time for breakfast. Did you sleep well?",
        vietnameseText: "Chào buổi sáng cả nhà! Tới giờ ăn sáng rồi. Tối qua ngủ ngon không?",
        slotReplaced: "breakfast",
        slotOriginal: "school"
      }
    ]
  },

  // =========================================================================
  // CHƯƠNG 3: DAYS OF THE WEEK AND MONTHS (NGÀY THÁNG & LỊCH HẸN)
  // =========================================================================
  {
    originalKey: "Are you free on Saturday afternoon?",
    patternKeywords: ["are you free on", "free on"],
    corePattern: "Are you free on [day of week / time]?",
    patternMeaningVi: "Bạn có rảnh vào [thời gian / thứ mấy] không?",
    grammarTip: "Giới từ: Dùng 'ON' cho các ngày trong tuần (on Monday, on Saturday afternoon), dùng 'AT' cho giờ cụ thể (at 3 PM), dùng 'IN' cho tháng/năm (in June, in 2026).",
    fixedPrefix: "Hey, are you free on ",
    fixedSuffix: "?",
    defaultSlot: "Saturday afternoon",
    quickSuggestions: [
      "Friday evening",
      "Sunday morning",
      "Wednesday after 5 PM",
      "the weekend",
      "April 5th"
    ],
    variations: [
      {
        context: "🍻 Rủ đi chơi tối thứ Sáu",
        contextTag: "Tụ tập",
        icon: "GlassWater",
        englishText: "Hey, are you free on Friday evening?",
        vietnameseText: "Tối thứ Sáu này bác có rảnh không, làm tí không?",
        slotReplaced: "Friday evening",
        slotOriginal: "Saturday afternoon"
      },
      {
        context: "☕ Hẹn cà phê sáng Chủ nhật",
        contextTag: "Gặp gỡ",
        icon: "Coffee",
        englishText: "Hey, are you free on Sunday morning?",
        vietnameseText: "Sáng Chủ nhật này bạn rảnh không, đi cà phê tán gẫu chút nhé?",
        slotReplaced: "Sunday morning",
        slotOriginal: "Saturday afternoon"
      },
      {
        context: "📅 Hẹn lịch làm việc sau 5h chiều",
        contextTag: "Công việc",
        icon: "Calendar",
        englishText: "Hey, are you free on Wednesday after 5 PM?",
        vietnameseText: "Thứ Tư sau 5 giờ chiều bạn có rảnh chút không?",
        slotReplaced: "Wednesday after 5 PM",
        slotOriginal: "Saturday afternoon"
      }
    ]
  },
  {
    originalKey: "I feel like going for a night out.",
    patternKeywords: ["feel like", "going for"],
    corePattern: "I feel like [something / V-ing]...",
    patternMeaningVi: "Tự dưng tôi thấy muốn / thèm [làm việc gì đó]...",
    grammarTip: "'Feel like + V-ing' là cách nói cực kỳ tự nhiên để diễn tả tâm trạng muốn làm một điều gì đó ngẫu hứng tại thời điểm nói.",
    fixedPrefix: "Hey, I feel like ",
    fixedSuffix: " today.",
    defaultSlot: "going for a night out",
    quickSuggestions: [
      "having some iced coffee",
      "eating something spicy",
      "taking a long walk",
      "watching a comedy",
      "going for a run"
    ],
    variations: [
      {
        context: "☕ Thèm uống cà phê",
        contextTag: "Đồ uống",
        icon: "Coffee",
        englishText: "Hey, I feel like having some iced coffee today.",
        vietnameseText: "Tự dưng hôm nay tôi thèm một ly cà phê đá ghê.",
        slotReplaced: "having some iced coffee",
        slotOriginal: "going for a night out"
      },
      {
        context: "🍜 Thèm ăn đồ cay",
        contextTag: "Ẩm thực",
        icon: "Flame",
        englishText: "Hey, I feel like eating something spicy today.",
        vietnameseText: "Trời này tự dưng tôi thèm ăn món gì cay cay ghê.",
        slotReplaced: "eating something spicy",
        slotOriginal: "going for a night out"
      },
      {
        context: "🏃 Muốn chạy bộ xả stress",
        contextTag: "Vận động",
        icon: "Activity",
        englishText: "Hey, I feel like going for a run today.",
        vietnameseText: "Hôm nay tôi tự nhiên muốn xỏ giày đi chạy một vòng ghê.",
        slotReplaced: "going for a run",
        slotOriginal: "going for a night out"
      }
    ]
  },
  {
    originalKey: "My family will move to Da Lat in June.",
    patternKeywords: ["will move to", "in June"],
    corePattern: "My family will [action] in [Month]...",
    patternMeaningVi: "Gia đình tôi sẽ [làm việc gì] vào [tháng nào đó]...",
    grammarTip: "Mẫu câu chuẩn Section B (trang 56) về việc sử dụng tháng trong năm để nói về kế hoạch tương lai.",
    fixedPrefix: "My family will ",
    fixedSuffix: ".",
    defaultSlot: "move to Da Lat in June",
    quickSuggestions: [
      "travel to Da Nang in July",
      "buy a new apartment in October",
      "visit grandparents in December",
      "host a big party in August"
    ],
    variations: [
      {
        context: "🏖️ Du lịch hè tháng 7",
        contextTag: "Du lịch",
        icon: "Palmtree",
        englishText: "My family will travel to Da Nang in July.",
        vietnameseText: "Gia đình tôi sẽ đi du lịch Đà Nẵng vào tháng 7 tới.",
        slotReplaced: "travel to Da Nang in July",
        slotOriginal: "move to Da Lat in June"
      },
      {
        context: "🏡 Thăm người thân tháng 12",
        contextTag: "Gia đình",
        icon: "Home",
        englishText: "My family will visit grandparents in December.",
        vietnameseText: "Gia đình tôi sẽ về quê thăm ông bà vào tháng 12.",
        slotReplaced: "visit grandparents in December",
        slotOriginal: "move to Da Lat in June"
      }
    ]
  },

  // =========================================================================
  // CHƯƠNG 4: WEATHER (CÁC CUỘC HỘI THOẠI VỀ THỜI TIẾT)
  // =========================================================================
  {
    originalKey: "I can't stand this heat.",
    patternKeywords: ["can't stand this heat", "can't stand", "cannot stand", "can not stand"],
    corePattern: "I can't stand this [weather condition]...",
    patternMeaningVi: "Tôi không thể nào chịu nổi cái [thời tiết] này nữa rồi.",
    grammarTip: "'Can't stand + N' là mẫu câu cửa miệng của người bản xứ (trang 70 Section B) để than phiền về thời tiết cực đoan hoặc điều gây khó chịu.",
    fixedPrefix: "I know, I can't stand this ",
    fixedSuffix: " anymore.",
    defaultSlot: "heat",
    quickSuggestions: ["humid weather", "freezing cold", "heavy rain", "scorching sun", "chilly wind"],
    variations: [
      {
        context: "💧 Thời tiết nồm ẩm khó chịu",
        contextTag: "Khí hậu",
        icon: "Droplets",
        englishText: "I know, I can't stand this humid weather anymore.",
        vietnameseText: "Tớ hiểu mà, tớ cũng không thể chịu nổi cái thời tiết nồm ẩm này nữa rồi.",
        slotReplaced: "humid weather",
        slotOriginal: "heat"
      },
      {
        context: "🥶 Lạnh buốt mùa đông",
        contextTag: "Mùa đông",
        icon: "CloudSnow",
        englishText: "I know, I can't stand this freezing cold anymore.",
        vietnameseText: "Trời ơi, tớ không thể chịu nổi cái rét buốt thấu xương này nữa.",
        slotReplaced: "freezing cold",
        slotOriginal: "heat"
      },
      {
        context: "🌧️ Mưa dầm dề",
        contextTag: "Mưa gió",
        icon: "CloudRain",
        englishText: "I know, I can't stand this heavy rain anymore.",
        vietnameseText: "Mưa to suốt mấy ngày, tớ không chịu nổi nữa rồi.",
        slotReplaced: "heavy rain",
        slotOriginal: "heat"
      }
    ]
  },
  {
    originalKey: "Let's go to the park since the weather is so nice.",
    patternKeywords: ["since the weather is", "let's go to"],
    corePattern: "Let's [do activity] since the weather is [condition].",
    patternMeaningVi: "Mình hãy [làm việc gì đó] vì thời tiết đang rất [thế nào] nhé.",
    grammarTip: "Mẫu câu Section B (trang 69): Sử dụng liên từ 'since' (bởi vì) để đưa ra đề xuất hành động dựa trên điều kiện thời tiết thực tế.",
    fixedPrefix: "Let's ",
    fixedSuffix: " since the weather is so nice.",
    defaultSlot: "go to the park",
    quickSuggestions: [
      "have a picnic outside",
      "go for a bike ride",
      "grab an iced coffee by the lake",
      "take some photos"
    ],
    variations: [
      {
        context: "🧺 Đi dã ngoại ngoài trời",
        contextTag: "Dã ngoại",
        icon: "Palmtree",
        englishText: "Let's have a picnic outside since the weather is so nice.",
        vietnameseText: "Đi cắm trại dã ngoại ngoài trời đi, thời tiết đang quá là đẹp luôn đấy.",
        slotReplaced: "have a picnic outside",
        slotOriginal: "go to the park"
      },
      {
        context: "🚴 Đạp xe dạo phố",
        contextTag: "Thể thao",
        icon: "Activity",
        englishText: "Let's go for a bike ride since the weather is so nice.",
        vietnameseText: "Thời tiết mát mẻ thế này, mình rủ nhau đạp xe một vòng đi.",
        slotReplaced: "go for a bike ride",
        slotOriginal: "go to the park"
      }
    ]
  },
  {
    originalKey: "Have you checked the weather forecast for the weekend?",
    patternKeywords: ["weather forecast for", "checked the weather"],
    corePattern: "Have you checked the [information] for [time]?",
    patternMeaningVi: "Bạn đã xem / kiểm tra [thông tin gì] cho [khoảng thời gian nào] chưa?",
    grammarTip: "Mẫu câu hỏi mở đầu cuộc trò chuyện kinh điển của người Tây (trang 70 Section B) khi chuẩn bị lên lịch trình hoạt động.",
    fixedPrefix: "By the way, have you checked the ",
    fixedSuffix: " for the weekend?",
    defaultSlot: "weather forecast",
    quickSuggestions: ["traffic report", "flight schedule", "movie schedule", "event details"],
    variations: [
      {
        context: "🚗 Kiểm tra tình trạng giao thông",
        contextTag: "Giao thông",
        icon: "Car",
        englishText: "By the way, have you checked the traffic report for the weekend?",
        vietnameseText: "Mà bác đã xem thông tin tình hình giao thông cuối tuần này chưa?",
        slotReplaced: "traffic report",
        slotOriginal: "weather forecast"
      },
      {
        context: "🎟️ Kiểm tra lịch chiếu phim",
        contextTag: "Giải trí",
        icon: "Film",
        englishText: "By the way, have you checked the movie schedule for the weekend?",
        vietnameseText: "Bác xem lịch chiếu phim cuối tuần này xem có phim gì hay chưa?",
        slotReplaced: "movie schedule",
        slotOriginal: "weather forecast"
      }
    ]
  },

  // =========================================================================
  // CHƯƠNG 5: RESTAURANT, FOOD & DRINKS (NHÀ HÀNG & ẨM THỰC)
  // =========================================================================
  {
    originalKey: "I'd like to order the beef phở, please.",
    patternKeywords: ["i'd like to order", "like to order"],
    corePattern: "I'd like to order [food/drink], please.",
    patternMeaningVi: "Làm ơn cho tôi đặt / gọi món [món ăn/đồ uống] nhé.",
    grammarTip: "Mẫu câu số 1 trong Section B (trang 84): 'I'd like to order...' là cách gọi món thông dụng, lịch sự và tự nhiên nhất tại bất kỳ nhà hàng nào.",
    fixedPrefix: "Hi there, I'd like to order ",
    fixedSuffix: ", please.",
    defaultSlot: "the beef phở",
    quickSuggestions: [
      "a cheeseburger with fries",
      "the grilled salmon",
      "a bowl of chicken noodles",
      "two cups of cappuccino",
      "the seafood pasta"
    ],
    variations: [
      {
        context: "🍔 Gọi đồ ăn nhanh Burger & Khoai tây",
        contextTag: "Đồ ăn nhanh",
        icon: "Utensils",
        englishText: "Hi there, I'd like to order a cheeseburger with fries, please.",
        vietnameseText: "Chào bạn, cho tôi gọi một bánh burger phô mai kèm khoai tây chiên nhé.",
        slotReplaced: "a cheeseburger with fries",
        slotOriginal: "the beef phở"
      },
      {
        context: "🐟 Gọi món cá hồi nướng nhà hàng Âu",
        contextTag: "Nhà hàng",
        icon: "UtensilsCrossed",
        englishText: "Hi there, I'd like to order the grilled salmon, please.",
        vietnameseText: "Cho tôi gọi món cá hồi nướng nhé bạn phục vụ.",
        slotReplaced: "the grilled salmon",
        slotOriginal: "the beef phở"
      },
      {
        context: "☕ Gọi cà phê sáng",
        contextTag: "Đồ uống",
        icon: "Coffee",
        englishText: "Hi there, I'd like to order two cups of cappuccino, please.",
        vietnameseText: "Chào bạn, cho tôi gọi hai ly cappuccino nhé.",
        slotReplaced: "two cups of cappuccino",
        slotOriginal: "the beef phở"
      }
    ]
  },
  {
    originalKey: "May I have the check, please?",
    patternKeywords: ["may i have the check", "the check, please", "the bill, please"],
    corePattern: "May I have the [item], please?",
    patternMeaningVi: "Làm ơn cho tôi xin [hóa đơn/vật dụng] nhé.",
    grammarTip: "Tại các nước phương Tây, khi thanh toán không nên vẫy tay kêu 'Bill!', mà hãy mỉm cười nói: 'May I have the check, please?' (Mỹ) hoặc 'May I have the bill, please?' (Anh/Úc).",
    fixedPrefix: "Excuse me, may I have the ",
    fixedSuffix: ", please?",
    defaultSlot: "check",
    quickSuggestions: ["bill", "menu", "dessert menu", "receipt", "extra napkins"],
    variations: [
      {
        context: "🧾 Xin hóa đơn tính tiền (Anh/Úc)",
        contextTag: "Thanh toán",
        icon: "Receipt",
        englishText: "Excuse me, may I have the bill, please?",
        vietnameseText: "Em ơi, cho anh xin hóa đơn thanh toán nhé.",
        slotReplaced: "bill",
        slotOriginal: "check"
      },
      {
        context: "🍰 Xin thực đơn món tráng miệng",
        contextTag: "Tráng miệng",
        icon: "Cake",
        englishText: "Excuse me, may I have the dessert menu, please?",
        vietnameseText: "Làm ơn cho chúng tôi xem thực đơn món tráng miệng nhé.",
        slotReplaced: "dessert menu",
        slotOriginal: "check"
      },
      {
        context: "🧻 Xin thêm khăn giấy",
        contextTag: "Dịch vụ",
        icon: "Sparkles",
        englishText: "Excuse me, may I have some extra napkins, please?",
        vietnameseText: "Cho mình xin thêm ít khăn giấy lau miệng với nhé.",
        slotReplaced: "some extra napkins",
        slotOriginal: "check"
      }
    ]
  },
  {
    originalKey: "What do you recommend?",
    patternKeywords: ["what do you recommend"],
    corePattern: "What do you recommend for [meal/course]?",
    patternMeaningVi: "Bạn có gợi ý món nào ngon cho [bữa ăn/món chính] không?",
    grammarTip: "Mẫu câu Section B (trang 85) dùng để nhờ bồi bàn hoặc đầu bếp tư vấn món đặc sắc nhất của quán.",
    fixedPrefix: "It's my first time here, what do you recommend for ",
    fixedSuffix: "?",
    defaultSlot: "dinner",
    quickSuggestions: ["lunch", "dessert", "drinks", "two people", "a cold day"],
    variations: [
      {
        context: "🍨 Hỏi gợi ý món tráng miệng",
        contextTag: "Món ngọt",
        icon: "Cake",
        englishText: "It's my first time here, what do you recommend for dessert?",
        vietnameseText: "Lần đầu tôi tới đây, bạn gợi ý món tráng miệng nào ngon nhất không?",
        slotReplaced: "dessert",
        slotOriginal: "dinner"
      },
      {
        context: "🍹 Hỏi gợi ý đồ uống cocktail",
        contextTag: "Quán bar",
        icon: "GlassWater",
        englishText: "It's my first time here, what do you recommend for drinks?",
        vietnameseText: "Lần đầu tôi ghé quán, bạn có gợi ý món đồ uống nào đặc biệt không?",
        slotReplaced: "drinks",
        slotOriginal: "dinner"
      }
    ]
  },
  {
    originalKey: "It's absolutely delicious, it practically melts in your mouth.",
    patternKeywords: ["melts in your mouth", "absolutely delicious"],
    corePattern: "It's absolutely delicious, [description].",
    patternMeaningVi: "Món này ngon tuyệt đỉnh, [miêu tả độ ngon].",
    grammarTip: "Mẫu câu Section B (trang 87) của Bino để khen ngợi thức ăn: 'It practically melts in your mouth' (thịt mềm như tan ra trong khoang miệng).",
    fixedPrefix: "Wow, it's absolutely delicious, ",
    fixedSuffix: ".",
    defaultSlot: "it practically melts in your mouth",
    quickSuggestions: [
      "the aroma is so mouth-watering",
      "every bite feels like a taste of heaven",
      "it's bursting with flavor",
      "the sauce is rich and creamy"
    ],
    variations: [
      {
        context: "😋 Khen hương vị thơm nức mũi",
        contextTag: "Hương vị",
        icon: "Sparkles",
        englishText: "Wow, it's absolutely delicious, the aroma is so mouth-watering.",
        vietnameseText: "Tuyệt đỉnh luôn, mùi thơm nức mũi kích thích vị giác dã man.",
        slotReplaced: "the aroma is so mouth-watering",
        slotOriginal: "it practically melts in your mouth"
      },
      {
        context: "🍲 Khen nước sốt béo ngậy đậm đà",
        contextTag: "Nước sốt",
        icon: "Utensils",
        englishText: "Wow, it's absolutely delicious, the sauce is rich and creamy.",
        vietnameseText: "Ngon thật sự, nước sốt thơm béo ngậy và cực kỳ đậm đà.",
        slotReplaced: "the sauce is rich and creamy",
        slotOriginal: "it practically melts in your mouth"
      }
    ]
  },

  // =========================================================================
  // CHƯƠNG 6: EMOTIONS, FEELINGS & CHARACTERISTICS (CẢM XÚC & TÂM SỰ)
  // =========================================================================
  {
    originalKey: "Honestly, it's been tough lately. I'm feeling stressed out because I have too many bills to pay.",
    patternKeywords: ["feeling stressed out because", "tough lately"],
    corePattern: "Honestly, it's been tough lately. I'm feeling stressed out because [reason].",
    patternMeaningVi: "Thật tình dạo này hơi căng. Tôi thấy rất stress vì [lý do gì đó].",
    grammarTip: "Mẫu câu hội thoại chân thật giữa Bino và anh thợ cắt tóc (trang 96). 'Stress out' diễn tả trạng thái áp lực tinh thần quá tải.",
    fixedPrefix: "Honestly, it's been tough lately. I'm feeling stressed out because ",
    fixedSuffix: ".",
    defaultSlot: "I have too many bills to pay",
    quickSuggestions: [
      "work is overwhelming",
      "I have an upcoming final exam",
      "I haven't had any proper sleep",
      "of all this financial pressure"
    ],
    variations: [
      {
        context: "💼 Áp lực công việc đè nặng",
        contextTag: "Công việc",
        icon: "Briefcase",
        englishText: "Honestly, it's been tough lately. I'm feeling stressed out because work is overwhelming.",
        vietnameseText: "Thật tình dạo này hơi khó khăn. Tôi bị stress vì việc công ty dồn về nhiều đến mức ngộp thở.",
        slotReplaced: "work is overwhelming",
        slotOriginal: "I have too many bills to pay"
      },
      {
        context: "📚 Áp lực thi cử",
        contextTag: "Học tập",
        icon: "BookOpen",
        englishText: "Honestly, it's been tough lately. I'm feeling stressed out because I have an upcoming final exam.",
        vietnameseText: "Dạo này hơi căng thẳng bác ạ. Tôi đang lo sốt vó vì kỳ thi tốt nghiệp sắp tới nơi rồi.",
        slotReplaced: "I have an upcoming final exam",
        slotOriginal: "I have too many bills to pay"
      }
    ]
  },
  {
    originalKey: "Maybe you could look into some financial assistance or loans to help with the purchase.",
    patternKeywords: ["look into", "maybe you could look into"],
    corePattern: "Maybe you could look into [solution / option]...",
    patternMeaningVi: "Có khi bạn nên thử tìm hiểu / cân nhắc về [giải pháp nào đó] xem sao.",
    grammarTip: "'Look into something' là phrasal verb rất hay, nghĩa là tìm hiểu, khảo sát hoặc nghiên cứu một giải pháp trước khi đưa ra quyết định.",
    fixedPrefix: "I understand. Maybe you could look into ",
    fixedSuffix: ".",
    defaultSlot: "some financial assistance or loans to help with the purchase",
    quickSuggestions: [
      "taking a short break to recharge",
      "hiring an assistant",
      "freelancing opportunities",
      "getting advice from a specialist"
    ],
    variations: [
      {
        context: "🧘 Lời khuyên nghỉ ngơi xả stress",
        contextTag: "Đời sống",
        icon: "Heart",
        englishText: "I understand. Maybe you could look into taking a short break to recharge.",
        vietnameseText: "Tôi hiểu mà. Có khi bác nên tìm cách nghỉ ngơi một vài hôm để nạp lại năng lượng xem sao.",
        slotReplaced: "taking a short break to recharge",
        slotOriginal: "some financial assistance or loans to help with the purchase"
      },
      {
        context: "🧑‍💼 Lời khuyên tìm chuyên gia tư vấn",
        contextTag: "Công việc",
        icon: "Users",
        englishText: "I understand. Maybe you could look into getting advice from a specialist.",
        vietnameseText: "Tôi hiểu. Có khi bạn nên tham khảo ý kiến từ một chuyên gia xem thế nào.",
        slotReplaced: "getting advice from a specialist",
        slotOriginal: "some financial assistance or loans to help with the purchase"
      }
    ]
  },
  {
    originalKey: "Take a deep breath and focus on one thing at a time.",
    patternKeywords: ["take a deep breath", "one thing at a time", "stay calm"],
    corePattern: "Take a deep breath and [calming action].",
    patternMeaningVi: "Hãy hít một hơi thật sâu và [hành động giữ bình tĩnh].",
    grammarTip: "Mẫu câu Chương 6 Bài 5 (Dealing with Stressful Situation): Dùng để trấn an bản thân hoặc đồng nghiệp khi đối mặt với khủng hoảng.",
    fixedPrefix: "Take a deep breath and ",
    fixedSuffix: ".",
    defaultSlot: "focus on one thing at a time",
    quickSuggestions: [
      "try to stay calm",
      "tackle the most urgent task first",
      "step outside for some fresh air",
      "don't panic"
    ],
    variations: [
      {
        context: "🧘 Trấn an đồng nghiệp trước buổi thuyết trình",
        contextTag: "Công sở",
        icon: "Heart",
        englishText: "Take a deep breath and try to stay calm.",
        vietnameseText: "Hãy hít một hơi thật sâu và cố gắng giữ bình tĩnh nhé.",
        slotReplaced: "try to stay calm",
        slotOriginal: "focus on one thing at a time"
      },
      {
        context: "📋 Xử lý công việc bị quá tải",
        contextTag: "Công việc",
        icon: "Briefcase",
        englishText: "Take a deep breath and tackle the most urgent task first.",
        vietnameseText: "Hít sâu một hơi rồi giải quyết đầu việc khẩn cấp nhất trước đã.",
        slotReplaced: "tackle the most urgent task first",
        slotOriginal: "focus on one thing at a time"
      }
    ]
  },
  {
    originalKey: "Practice makes perfect! The more you speak, the more confident you'll become.",
    patternKeywords: ["practice makes perfect", "the more you", "confident"],
    corePattern: "Practice makes perfect! The more you [action], the more [result].",
    patternMeaningVi: "Có công mài sắt có ngày nên kim! Bạn càng [làm gì], bạn sẽ càng [kết quả].",
    grammarTip: "Mẫu câu Chương 6 Bài 6 (Practice Makes Perfect): Cấu trúc so sánh kép 'The more..., the more...' cực kỳ tự nhiên khi khích lệ tinh thần.",
    fixedPrefix: "Practice makes perfect! The more you ",
    fixedSuffix: ", the more confident you'll become.",
    defaultSlot: "practise speaking English",
    quickSuggestions: [
      "step out of your comfort zone",
      "talk with native speakers",
      "apply these phrases in real life",
      "shadow Bino's dialogues"
    ],
    variations: [
      {
        context: "🗣️ Khích lệ luyện nói với người bản xứ",
        contextTag: "Học tiếng Anh",
        icon: "Sparkles",
        englishText: "Practice makes perfect! The more you talk with native speakers, the more confident you'll become.",
        vietnameseText: "Trăm hay không bằng tay quen! Bạn càng nói chuyện nhiều với người bản xứ thì sẽ càng tự tin hơn.",
        slotReplaced: "talk with native speakers",
        slotOriginal: "practise speaking English"
      },
      {
        context: "🚀 Khích lệ bước ra khỏi vùng an toàn",
        contextTag: "Phát triển",
        icon: "Award",
        englishText: "Practice makes perfect! The more you step out of your comfort zone, the more confident you'll become.",
        vietnameseText: "Cứ luyện tập là sẽ giỏi! Bạn càng dám bước ra khỏi vùng an toàn thì càng bản lĩnh hơn.",
        slotReplaced: "step out of your comfort zone",
        slotOriginal: "practise speaking English"
      }
    ]
  },

  // =========================================================================
  // CHƯƠNG 7: DAILY ROUTINE (HOẠT ĐỘNG THƯỜNG NGÀY)
  // =========================================================================
  {
    originalKey: "On the weekends, I like to take it easy and sleep in a bit longer than usual.",
    patternKeywords: ["take it easy", "sleep in", "bedtime routine", "on the weekends, i like to"],
    corePattern: "On the weekends, I like to [relaxing activity].",
    patternMeaningVi: "Vào dịp cuối tuần, tôi thích [hoạt động thư giãn].",
    grammarTip: "Mẫu câu vàng Chương 7 (Trang 120): 'Take it easy' (thư giãn, xả hơi) và 'sleep in' (ngủ nướng) là hai cụm từ cực kỳ đắt giá khi kể về thói quen cuối tuần.",
    fixedPrefix: "On the weekends, I like to ",
    fixedSuffix: ".",
    defaultSlot: "take it easy and sleep in a bit longer",
    quickSuggestions: [
      "catch up on my favorite books",
      "spend quality time with my family",
      "unplug from work and go hiking",
      "prepare homemade meals"
    ],
    variations: [
      {
        context: "📖 Đọc sách thư giãn cuối tuần",
        contextTag: "Thư giãn",
        icon: "BookOpen",
        englishText: "On the weekends, I like to catch up on my favorite books.",
        vietnameseText: "Vào dịp cuối tuần, mình thích dành thời gian đọc những cuốn sách yêu thích.",
        slotReplaced: "catch up on my favorite books",
        slotOriginal: "take it easy and sleep in a bit longer"
      },
      {
        context: "👨‍👩‍👧 Dành thời gian bên gia đình",
        contextTag: "Gia đình",
        icon: "Home",
        englishText: "On the weekends, I like to spend quality time with my family.",
        vietnameseText: "Vào cuối tuần, mình thích dành trọn thời gian chất lượng bên gia đình.",
        slotReplaced: "spend quality time with my family",
        slotOriginal: "take it easy and sleep in a bit longer"
      }
    ]
  },
  {
    originalKey: "I can't help staying up late watching movies.",
    patternKeywords: ["stay up late", "sleepless", "toss and turn", "busy day", "will, there's a way"],
    corePattern: "Lately, I've been [daily habit / challenge]...",
    patternMeaningVi: "Dạo gần đây, tôi hay bị / thường xuyên [thói quen sinh hoạt]...",
    grammarTip: "Mẫu câu Chương 7 (Bài 2–6): Dùng thì hiện tại hoàn thành tiếp diễn 'I've been + V-ing' để miêu tả một thói quen hoặc tình trạng sinh hoạt đang diễn ra gần đây.",
    fixedPrefix: "Lately, I've been ",
    fixedSuffix: ".",
    defaultSlot: "staying up too late because of work",
    quickSuggestions: [
      "waking up at 6 AM to hit the gym",
      "trying to cut down on late-night snacks",
      "following a healthier morning routine",
      "getting used to my new work schedule"
    ],
    variations: [
      {
        context: "🏋️ Tập thói quen dậy sớm tập gym",
        contextTag: "Sức khỏe",
        icon: "Activity",
        englishText: "Lately, I've been waking up at 6 AM to hit the gym.",
        vietnameseText: "Dạo gần đây mình duy trì thói quen dậy lúc 6 giờ sáng để đi tập gym.",
        slotReplaced: "waking up at 6 AM to hit the gym",
        slotOriginal: "staying up too late because of work"
      },
      {
        context: "⏰ Làm quen với lịch trình mới",
        contextTag: "Đời sống",
        icon: "Clock",
        englishText: "Lately, I've been getting used to my new work schedule.",
        vietnameseText: "Dạo này mình đang dần quen với lịch làm việc mới rồi.",
        slotReplaced: "getting used to my new work schedule",
        slotOriginal: "staying up too late because of work"
      }
    ]
  },

  // =========================================================================
  // CHƯƠNG 8: SOCIAL MEDIA, FAVORITE APPS (MẠNG XÃ HỘI & ỨNG DỤNG)
  // =========================================================================
  {
    originalKey: "I use this app every day to stay connected with my friends and family.",
    patternKeywords: ["social media", "app", "scroll", "tiktok", "instagram", "facebook", "productivity"],
    corePattern: "I use this app every day to [purpose / benefit].",
    patternMeaningVi: "Tôi dùng ứng dụng này mỗi ngày để [mục đích / lợi ích].",
    grammarTip: "Mẫu câu Chương 8 (Social Media & Favorite Apps): Khi nói về công nghệ hoặc ứng dụng yêu thích, hãy dùng cấu trúc 'I use [App] to + V' để nêu bật giá trị thực tế.",
    fixedPrefix: "I use this app every day to ",
    fixedSuffix: ".",
    defaultSlot: "keep track of my daily tasks and deadlines",
    quickSuggestions: [
      "stay connected with my friends overseas",
      "practise English speaking for 15 minutes",
      "track my workouts and calorie intake",
      "unwind and watch funny short videos"
    ],
    variations: [
      {
        context: "🇬🇧 Dùng app học tiếng Anh mỗi ngày",
        contextTag: "Học tập",
        icon: "BookOpen",
        englishText: "I use this app every day to practise English speaking for 15 minutes.",
        vietnameseText: "Mình dùng ứng dụng này mỗi ngày để luyện nói tiếng Anh 15 phút.",
        slotReplaced: "practise English speaking for 15 minutes",
        slotOriginal: "keep track of my daily tasks and deadlines"
      },
      {
        context: "💪 Dùng app theo dõi tập luyện (Gym Rat)",
        contextTag: "Thể hình",
        icon: "Activity",
        englishText: "I use this app every day to track my workouts and calorie intake.",
        vietnameseText: "Mình dùng ứng dụng này hàng ngày để theo dõi lịch tập và lượng calo nạp vào.",
        slotReplaced: "track my workouts and calorie intake",
        slotOriginal: "keep track of my daily tasks and deadlines"
      }
    ]
  },

  // =========================================================================
  // CHƯƠNG 9: HOBBIES (SỞ THÍCH CÁ NHÂN)
  // =========================================================================
  {
    originalKey: "Hey Jazzy, can you tell daddy what you like to do for fun?",
    patternKeywords: ["for fun", "free time", "hobby", "hobbies", "gardening", "paper airplanes", "games"],
    corePattern: "In my free time, I really enjoy [hobby / V-ing].",
    patternMeaningVi: "Vào thời gian rảnh, tôi thực sự rất thích [sở thích].",
    grammarTip: "Mẫu câu Chương 9 (Hobbies - Trang 138–151): Thay vì chỉ nói 'My hobby is...', người bản xứ thường hỏi 'What do you like to do for fun?' và trả lời 'In my free time, I really enjoy + V-ing'.",
    fixedPrefix: "In my free time, I really enjoy ",
    fixedSuffix: ".",
    defaultSlot: "gardening and growing my own vegetables",
    quickSuggestions: [
      "playing acoustic guitar and listening to indie music",
      "going on weekend road trips with my friends",
      "reading mystery novels in a quiet café",
      "playing co-op video games online"
    ],
    variations: [
      {
        context: "🎸 Sở thích âm nhạc (Bài 4: The Love of Music)",
        contextTag: "Âm nhạc",
        icon: "Sparkles",
        englishText: "In my free time, I really enjoy playing acoustic guitar and listening to indie music.",
        vietnameseText: "Lúc rảnh rỗi, mình cực kỳ thích đàn guitar mộc và nghe nhạc indie.",
        slotReplaced: "playing acoustic guitar and listening to indie music",
        slotOriginal: "gardening and growing my own vegetables"
      },
      {
        context: "☕ Sở thích yên tĩnh (Bài 5: A Quiet Hobby)",
        contextTag: "Đọc sách",
        icon: "Coffee",
        englishText: "In my free time, I really enjoy reading mystery novels in a quiet café.",
        vietnameseText: "Khi rảnh, mình rất thích ngồi đọc tiểu thuyết trinh thám ở một quán cà phê yên tĩnh.",
        slotReplaced: "reading mystery novels in a quiet café",
        slotOriginal: "gardening and growing my own vegetables"
      }
    ]
  },

  // =========================================================================
  // CHƯƠNG 10: AT THE STORE (MUA SẮM TẠI CỬA HÀNG)
  // =========================================================================
  {
    originalKey: "I'd like a Happy Meal with nuggets and chips, please.",
    patternKeywords: ["happy meal", "nuggets", "sold out", "aisle", "fragrance", "sim card", "bank account", "buy one, get one"],
    corePattern: "Excuse me, I'm looking for [item / service]. Could you help me out?",
    patternMeaningVi: "Xin lỗi cho tôi hỏi, tôi đang tìm mua / làm [món đồ / dịch vụ]. Bạn hỗ trợ tôi nhé?",
    grammarTip: "Mẫu câu Chương 10 (At the Store - Trang 154–168): Cực kỳ hữu dụng khi đi siêu thị, mua nước hoa, mua SIM du lịch hoặc mở tài khoản ngân hàng ở nước ngoài.",
    fixedPrefix: "Excuse me, I'm looking for ",
    fixedSuffix: ". Could you help me out?",
    defaultSlot: "a prepaid SIM card with plenty of data",
    quickSuggestions: [
      "the pasta sauce aisle",
      "a light floral fragrance for a gift",
      "items on a buy-one-get-one-free deal",
      "information on opening a student bank account"
    ],
    variations: [
      {
        context: "🛒 Hỏi tìm quầy hàng trong siêu thị (Bài 1)",
        contextTag: "Siêu thị",
        icon: "Compass",
        englishText: "Excuse me, I'm looking for the pasta sauce aisle. Could you help me out?",
        vietnameseText: "Xin lỗi cho mình hỏi, mình đang tìm dãy kệ bán sốt mì Ý. Bạn chỉ giúp mình nhé?",
        slotReplaced: "the pasta sauce aisle",
        slotOriginal: "a prepaid SIM card with plenty of data"
      },
      {
        context: "🎁 Mua nước hoa làm quà tặng (Bài 4)",
        contextTag: "Mua sắm",
        icon: "Sparkles",
        englishText: "Excuse me, I'm looking for a light floral fragrance for a gift. Could you help me out?",
        vietnameseText: "Chào bạn, mình đang tìm một chai nước hoa hương hoa dịu nhẹ để làm quà tặng. Bạn tư vấn giúp mình nhé?",
        slotReplaced: "a light floral fragrance for a gift",
        slotOriginal: "a prepaid SIM card with plenty of data"
      }
    ]
  },

  // =========================================================================
  // CHƯƠNG 11: TRANSPORTATION (PHƯƠNG TIỆN GIAO THÔNG & DI CHUYỂN)
  // =========================================================================
  {
    originalKey: "What's the best way to get to the city center from here?",
    patternKeywords: ["airport", "transportation", "carpark", "parking", "rent a car", "train", "bus", "boarding"],
    corePattern: "What's the best way to get to [destination] from here?",
    patternMeaningVi: "Cách tốt nhất / tiện nhất để đi từ đây tới [địa điểm] là gì vậy?",
    grammarTip: "Mẫu câu Chương 11 (Transportation - Trang 172–189): Câu hỏi cứu cánh số 1 khi đi du lịch, hỏi đường người bản xứ tại sân bay, nhà ga hoặc trung tâm thành phố.",
    fixedPrefix: "Excuse me, what's the best way to get to ",
    fixedSuffix: " from here?",
    defaultSlot: "the international airport terminal",
    quickSuggestions: [
      "the central train station",
      "the nearest underground carpark",
      "downtown during rush hour",
      "the car rental counter"
    ],
    variations: [
      {
        context: "🚆 Hỏi đường ra ga tàu trung tâm",
        contextTag: "Tàu điện",
        icon: "Compass",
        englishText: "Excuse me, what's the best way to get to the central train station from here?",
        vietnameseText: "Xin lỗi cho mình hỏi, từ đây ra nhà ga trung tâm đi bằng cách nào tiện nhất ạ?",
        slotReplaced: "the central train station",
        slotOriginal: "the international airport terminal"
      },
      {
        context: "🅿️ Tìm bãi đỗ xe ngầm gần nhất (Bài 3)",
        contextTag: "Đỗ xe",
        icon: "Car",
        englishText: "Excuse me, what's the best way to get to the nearest underground carpark from here?",
        vietnameseText: "Cho mình hỏi đường đi tới hầm đỗ xe gần nhất từ đây đi lối nào vậy?",
        slotReplaced: "the nearest underground carpark",
        slotOriginal: "the international airport terminal"
      }
    ]
  },

  // =========================================================================
  // CHƯƠNG 12: AROUND THE HOUSE (TỪ VỰNG & GIẢI NGHĨA ĐỒ VẬT QUANH NHÀ)
  // =========================================================================
  {
    originalKey: "This chair is made of wood.",
    patternKeywords: [
      "piece of furniture",
      "device that",
      "device for",
      "device used",
      "machine for",
      "appliance",
      "container for",
      "made of wood",
      "around the house"
    ],
    corePattern: "It's a household item used for [function / purpose in English].",
    patternMeaningVi: "Đó là một vật dụng trong nhà được dùng để [công dụng giải nghĩa bằng tiếng Anh].",
    grammarTip: "Bí quyết Chương 12 (Trang 192): Khi quên một từ vựng trong tiếng Anh, đừng đứng hình! Hãy dùng cấu trúc 'It's a device / machine / piece of furniture used for + V-ing' để giải thích đồ vật đó.",
    fixedPrefix: "It's a household device used for ",
    fixedSuffix: ".",
    defaultSlot: "heating or cooking food quickly (Microwave)",
    quickSuggestions: [
      "washing dishes automatically (Dishwasher)",
      "removing dust from floors and carpets (Vacuum cleaner)",
      "removing contaminants from the air (Air purifier)",
      "boiling water quickly for tea or coffee (Kettle)"
    ],
    variations: [
      {
        context: "🧹 Giải nghĩa Máy hút bụi bằng tiếng Anh",
        contextTag: "Phòng khách",
        icon: "Home",
        englishText: "It's a household device used for removing dust from floors and carpets.",
        vietnameseText: "Đó là thiết bị gia dụng dùng để hút sạch bụi bẩn trên sàn nhà và thảm (Máy hút bụi).",
        slotReplaced: "removing dust from floors and carpets",
        slotOriginal: "heating or cooking food quickly (Microwave)"
      },
      {
        context: "🌬️ Giải nghĩa Máy lọc không khí bằng tiếng Anh",
        contextTag: "Phòng ngủ",
        icon: "Sparkles",
        englishText: "It's a household device used for removing contaminants from the air.",
        vietnameseText: "Đó là thiết bị trong nhà dùng để lọc sạch bụi mịn và tạp chất trong không khí (Máy lọc không khí).",
        slotReplaced: "removing contaminants from the air",
        slotOriginal: "heating or cooking food quickly (Microwave)"
      }
    ]
  }
];

/**
 * Hàm tra cứu và trích xuất mẫu câu mở rộng thực tế cho từng dòng thoại.
 * Ưu tiên:
 * 1. Khớp từ khóa cốt lõi với ngân hàng mẫu câu chuẩn Ebook.
 * 2. Nhận diện cấu trúc ngữ pháp đúc sẵn theo phong cách Bino.
 * 3. Fallback thông minh có ngữ nghĩa tiếng Anh và bản dịch tiếng Việt chuẩn, không bao giờ sinh placeholder vô nghĩa.
 */
export function getExpansionsForLine(englishText, lineIndex = 0) {
  if (!englishText || typeof englishText !== 'string') return null;

  const cleanText = englishText.trim().replace(/^"|"$/g, '');
  const lowerText = cleanText.toLowerCase();

  // 1. Khớp ngân hàng dữ liệu chính xác
  for (const item of SENTENCE_EXPANSIONS_DATABASE) {
    if (item.patternKeywords.some(kw => lowerText.includes(kw.toLowerCase()))) {
      return item;
    }
  }

  // 2. Nhận diện cấu trúc ngữ pháp đúc sẵn (Lexical Frame Extractor) theo phong cách Bino
  
  // A. Mẫu câu yêu cầu lịch sự: Could you / Can you / Would you...
  if (lowerText.startsWith("could you ") || lowerText.startsWith("can you ") || lowerText.startsWith("would you ")) {
    const isCould = lowerText.startsWith("could you");
    const prefix = isCould ? "Could you " : "Can you ";
    const rest = cleanText.slice(prefix.length).replace(/[?.,!]/g, '');
    const firstWord = rest.split(' ')[0] || "help";
    
    return {
      corePattern: `${prefix}[verb phrase], please?`,
      patternMeaningVi: "Bạn có thể [hành động gì đó] giúp tôi được không?",
      grammarTip: "Dùng 'Could you...' hoặc 'Can you...' kèm 'please' là mẫu câu đề nghị giúp đỡ lịch sự nhất trong giao tiếp hàng ngày.",
      fixedPrefix: `${prefix}`,
      fixedSuffix: ", please?",
      defaultSlot: rest,
      quickSuggestions: [
        "give me a hand with this",
        "repeat that once again",
        "send me the details by email",
        "show me where the station is"
      ],
      variations: [
        {
          context: "🤝 Nhờ vả giúp một tay",
          contextTag: "Cuộc sống",
          englishText: `${prefix}give me a hand with this, please?`,
          vietnameseText: "Bác có thể phụ tôi một tay với việc này được không?",
          slotReplaced: "give me a hand with this",
          slotOriginal: rest
        },
        {
          context: "📧 Nhờ gửi thông tin qua email",
          contextTag: "Công việc",
          englishText: `${prefix}send me the details by email, please?`,
          vietnameseText: "Bạn có thể gửi chi tiết qua email cho tôi được không?",
          slotReplaced: "send me the details by email",
          slotOriginal: rest
        }
      ]
    };
  }

  // B. Mẫu câu thắc mắc / hỏi thăm: Do you know... / Do you have...
  if (lowerText.startsWith("do you know ") || lowerText.startsWith("do you have ")) {
    const isKnow = lowerText.startsWith("do you know");
    const prefix = isKnow ? "Do you know " : "Do you have ";
    const rest = cleanText.slice(prefix.length).replace(/[?.,!]/g, '');

    return {
      corePattern: `${prefix}[something]?`,
      patternMeaningVi: isKnow ? "Bác có biết [thông tin gì đó] không?" : "Bác có [thứ gì đó / thời gian] không?",
      grammarTip: "Mẫu câu hỏi thăm dò lịch sự, giúp bạn bắt chuyện tự nhiên với bạn bè hoặc người lạ.",
      fixedPrefix: `By the way, ${prefix.toLowerCase()}`,
      fixedSuffix: "?",
      defaultSlot: rest,
      quickSuggestions: isKnow 
        ? ["where the nearest bank is", "what time the bus leaves", "if the shop is still open"]
        : ["any free time tomorrow", "a spare pen I could borrow", "any recommendations for dinner"],
      variations: isKnow ? [
        {
          context: "🗺️ Hỏi đường đi / Địa điểm",
          contextTag: "Hỏi đường",
          englishText: "By the way, do you know where the nearest bank is?",
          vietnameseText: "Nhân tiện bác có biết ngân hàng gần nhất ở đâu không?",
          slotReplaced: "where the nearest bank is",
          slotOriginal: rest
        },
        {
          context: "⏰ Hỏi giờ giấc phương tiện",
          contextTag: "Đi lại",
          englishText: "By the way, do you know what time the bus leaves?",
          vietnameseText: "Nhân tiện bạn có biết mấy giờ xe buýt chạy không?",
          slotReplaced: "what time the bus leaves",
          slotOriginal: rest
        }
      ] : [
        {
          context: "☕ Hỏi rảnh đi cà phê",
          contextTag: "Hẹn hò",
          englishText: "By the way, do you have any free time tomorrow?",
          vietnameseText: "Nhân tiện ngày mai bạn có rảnh chút thời gian nào không?",
          slotReplaced: "any free time tomorrow",
          slotOriginal: rest
        },
        {
          context: "🍜 Hỏi gợi ý quán ăn ngon",
          contextTag: "Ăn uống",
          englishText: "By the way, do you have any recommendations for dinner?",
          vietnameseText: "Nhân tiện bác có gợi ý quán nào ăn tối ngon quanh đây không?",
          slotReplaced: "any recommendations for dinner",
          slotOriginal: rest
        }
      ]
    };
  }

  // C. Mẫu câu cảm ơn / cảm kích: Thanks... / I appreciate...
  if (lowerText.includes("appreciate") || lowerText.includes("thanks") || lowerText.includes("thank you")) {
    return {
      corePattern: "Thanks a lot, I really appreciate [something].",
      patternMeaningVi: "Cảm ơn bạn rất nhiều, tôi thật sự rất cảm kích [điều gì đó].",
      grammarTip: "Người bản xứ không chỉ nói 'Thank you', họ luôn đệm thêm 'I appreciate your help / time' để câu nói thêm chân thành và ấm áp.",
      fixedPrefix: "Thanks a lot, I really appreciate ",
      fixedSuffix: ".",
      defaultSlot: "your help",
      quickSuggestions: [
        "your support",
        "your hospitality",
        "you taking the time",
        "the quick response"
      ],
      variations: [
        {
          context: "🙏 Cảm kích vì sự đón tiếp chu đáo",
          contextTag: "Khách khí",
          englishText: "Thanks a lot, I really appreciate your hospitality.",
          vietnameseText: "Cảm ơn bạn rất nhiều, tôi rất cảm kích sự đón tiếp chu đáo và hiếu khách của bạn.",
          slotReplaced: "your hospitality",
          slotOriginal: "your help"
        },
        {
          context: "⏰ Cảm ơn vì đã dành thời gian",
          contextTag: "Gặp gỡ",
          englishText: "Thanks a lot, I really appreciate you taking the time.",
          vietnameseText: "Cảm ơn bạn nhiều, tôi rất biết ơn vì bạn đã bớt chút thời gian quý báu.",
          slotReplaced: "you taking the time",
          slotOriginal: "your help"
        }
      ]
    };
  }

  // D. Mẫu câu cảm thán khen ngợi: That would be... / That sounds...
  if (lowerText.startsWith("that would be ") || lowerText.startsWith("that sounds ")) {
    const isSounds = lowerText.startsWith("that sounds");
    const prefix = isSounds ? "That sounds " : "That would be ";
    const rest = cleanText.slice(prefix.length).replace(/[!.,?]/g, '');

    return {
      corePattern: `${prefix}[adjective]!`,
      patternMeaningVi: isSounds ? "Nghe có vẻ [thế nào đó] đấy!" : "Thế thì sẽ [thế nào đó] quá!",
      grammarTip: "Dùng để phản hồi và đồng tình với lời đề nghị của người khác với thái độ tích cực.",
      fixedPrefix: prefix,
      fixedSuffix: ", thanks!",
      defaultSlot: rest,
      quickSuggestions: ["awesome", "fantastic", "wonderful", "perfect", "super helpful"],
      variations: [
        {
          context: "✨ Hào hứng đồng ý đề xuất",
          contextTag: "Đồng tình",
          englishText: `${prefix}fantastic, thanks!`,
          vietnameseText: "Thế thì quá tuyệt vời rồi, cảm ơn bác nhiều nha!",
          slotReplaced: "fantastic",
          slotOriginal: rest
        },
        {
          context: "👌 Khen ngợi giải pháp hoàn hảo",
          contextTag: "Khen ngợi",
          englishText: `${prefix}perfect, thanks!`,
          vietnameseText: "Thế thì chuẩn không cần chỉnh luôn, cảm ơn bác!",
          slotReplaced: "perfect",
          slotOriginal: rest
        }
      ]
    };
  }

  // 3. Fallback theo ngữ cảnh chương học tự nhiên của Bino
  const words = cleanText.split(' ');
  if (words.length >= 3) {
    const slot = words.slice(-2).join(' ').replace(/[.,!?]/g, '');
    const prefix = words.slice(0, -2).join(' ') + ' ';
    
    return {
      corePattern: `${prefix}[... cụm từ thay thế ...]`,
      patternMeaningVi: "Mẫu câu thực tế: Giữ nguyên khung câu của Bino, thay đổi vị trí cuối để áp dụng vào đời thực.",
      grammarTip: "Quy tắc phản xạ Bino: Đừng bẻ gãy ngữ pháp để dịch từng từ. Hãy giữ nguyên toàn bộ vế đầu và chỉ thay thế vế sau theo hoàn cảnh của bạn.",
      fixedPrefix: prefix,
      fixedSuffix: ".",
      defaultSlot: slot,
      quickSuggestions: ["this afternoon", "right now", "with our team", "next weekend"],
      variations: [
        {
          context: "⏱️ Thay đổi mốc thời gian",
          contextTag: "Thời gian",
          englishText: `${prefix}this afternoon.`,
          vietnameseText: "Vận dụng câu vào ngữ cảnh buổi chiều hôm nay.",
          slotReplaced: "this afternoon",
          slotOriginal: slot
        },
        {
          context: "👥 Vận dụng cùng đồng đội / bạn bè",
          contextTag: "Đồng nghiệp",
          englishText: `${prefix}with our team.`,
          vietnameseText: "Vận dụng câu khi làm việc cùng đội nhóm hoặc bạn bè.",
          slotReplaced: "with our team",
          slotOriginal: slot
        }
      ]
    };
  }

  return null;
}
