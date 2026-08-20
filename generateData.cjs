const fs = require('fs');

const userData = {
  "testId": "READING_TEST_1",
  "part1": [
    {
      "id": 1,
      "imageUrl": "https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "audioUrl": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      "correctAnswerText": "(C) They are looking at a document."
    }
  ],
  "part2": [
    {
      "id": 7,
      "audioUrl": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
      "correctAnswer": "B"
    }
  ],
  "part3": [
    {
      "id": 32,
      "audioUrl": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
      "question": "What change is a company making?",
      "correctAnswerText": "Hiring new staff",
      "transcript": "We need to expand the staff this quarter.",
      "paraphrase": {"expand the staff": "Hiring new staff"}
    }
  ],
  "part4": [
    {
      "id": 71,
      "audioUrl": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
      "question": "Where is the speaker?",
      "correctAnswerText": "At a supermarket",
      "transcript": "Attention all shoppers, the store will close in 15 minutes.",
      "paraphrase": {"shoppers": "supermarket"}
    }
  ],
  "part5": [
    {
      "id": 101,
      "question": "Former Sendai Company CEO Ken Nakata spoke about ------- career experiences.",
      "translation": "Cựu CEO công ty Sendai, Ken Nakata, đã nói về những kinh nghiệm nghề nghiệp của -------.",
      "options": { "A": "he (anh ấy - đại từ nhân xưng chủ ngữ)", "B": "his (của anh ấy - tính từ sở hữu)", "C": "him (anh ấy - đại từ nhân xưng tân ngữ)", "D": "himself (chính anh ấy - đại từ phản thân)" },
      "correctAnswer": "B",
      "explanation": "Vị trí chỗ trống đứng trước cụm danh từ \"career experiences\" (kinh nghiệm nghề nghiệp), nên ta cần một tính từ sở hữu để bổ nghĩa. Cựu CEO Nakata nói về những kinh nghiệm của chính ông ấy."
    },
    {
      "id": 102,
      "question": "Passengers who will be taking a ------- domestic flight should go to Terminal A.",
      "translation": "Hành khách sẽ thực hiện chuyến bay nội địa ------- nên đi đến Nhà ga A.",
      "options": { "A": "connectivity (sự kết nối - danh từ)", "B": "connects (kết nối - động từ chia s)", "C": "connect (kết nối - động từ nguyên thể)", "D": "connecting (kết nối - hiện tại phân từ/tính từ)" },
      "correctAnswer": "D",
      "explanation": "Vị trí chỗ trống đứng trước cụm danh từ \"domestic flight\" (chuyến bay nội địa), ta cần một tính từ hoặc phân từ đóng vai trò tính từ để bổ nghĩa. \"Connecting flight\" là một cụm danh từ cố định có nghĩa là \"chuyến bay nối chuyến\"."
    },
    {
      "id": 103,
      "question": "Fresh and ------- apple-cider donuts are available at Oakcrest Orchard’s retail shop for £6 per dozen.",
      "translation": "Những chiếc bánh rán vị rượu táo tươi và ------- có sẵn tại cửa hàng bán lẻ của Oakcrest Orchard với giá 6 bảng một tá.",
      "options": { "A": "eaten (được ăn)", "B": "open (mở)", "C": "tasty (ngon)", "D": "free (miễn phí)" },
      "correctAnswer": "C",
      "explanation": "Câu sử dụng liên từ \"and\" (và) nối hai tính từ bổ nghĩa cho \"apple-cider donuts\" (bánh rán rượu táo). \"Fresh\" (tươi) mang nghĩa tích cực, do đó cần một tính từ tích cực khác để miêu tả đồ ăn. \"Tasty\" (ngon) là lựa chọn hợp lý nhất."
    }
  ],
  "part6": [
    {
      "id": 131,
      "passage": "Next Saturday at 4 P.M., we are hosting a free workshop for the public.",
      "question": "Next Saturday at 4 P.M., we are hosting a free workshop for the public. Come to the Maxley Center and learn how to build a rain garden. A rain garden is a shallow sunken garden ------- a special soil mix.",
      "translation": "Thứ Bảy tới lúc 4 giờ chiều, chúng tôi sẽ tổ chức một hội thảo miễn phí cho công chúng.",
      "options": { "A": "to use", "B": "used", "C": "use", "D": "that uses" },
      "correctAnswer": "D",
      "explanation": "Mệnh đề quan hệ thay thế cho \"a shallow sunken garden\"."
    }
  ],
  "part7": [
    {
      "id": 147,
      "passageId": "p1",
      "passageTitle": "Đoạn 1 (Câu 147 - 148): Hướng dẫn lắp ráp",
      "passageText": "Thank you for purchasing our furniture. As you do the unpacking, make sure to check all components. Assemble the item carefully on a soft surface. Never overtighten any screws or bolts, or you may damage the wood or cushioning.",
      "question": "Where is the information most likely found?",
      "translation": "Thông tin này có khả năng được tìm thấy ở đâu nhất?",
      "options": { "A": "On a door", "B": "On a receipt", "C": "In a box", "D": "On a Web site" },
      "correctAnswer": "C",
      "correctAnswerText": "In a box",
      "explanation": "Văn bản yêu cầu người đọc: \"As you do the unpacking...\" (Trong khi bạn mở hộp/dỡ đồ...).",
      "keywords": [
        { "text": "found", "matchText": "unpacking" }
      ]
    },
    {
      "id": 148,
      "passageId": "p1",
      "passageTitle": "Đoạn 1 (Câu 147 - 148): Hướng dẫn lắp ráp",
      "passageText": "Thank you for purchasing our furniture. As you do the unpacking, make sure to check all components. Assemble the item carefully on a soft surface. Never overtighten any screws or bolts, or you may damage the wood or cushioning.",
      "question": "What kind of item is most likely discussed?",
      "translation": "Loại mặt hàng nào có khả năng đang được nói đến nhất?",
      "options": { "A": "A desktop computer", "B": "A piece of furniture", "C": "A household appliance", "D": "A power tool" },
      "correctAnswer": "B",
      "correctAnswerText": "A piece of furniture",
      "explanation": "Mặt hàng cần lắp ráp mà lại có \"gỗ\" (wood) và \"đệm mút\" (cushioning) thì chắc chắn là đồ nội thất.",
      "keywords": [
        { "text": "item", "matchText": "wood or cushioning" }
      ]
    }
  ]
};

fs.writeFileSync('public/data.json', JSON.stringify(userData, null, 2));
console.log('Done writing data.json');
