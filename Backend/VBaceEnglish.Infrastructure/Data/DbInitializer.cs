using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using VBaceEnglish.Application.Services;
using VBaceEnglish.Domain.Enums;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDBContext>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<Role>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var toeicService = scope.ServiceProvider.GetRequiredService<IToeicTestService>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<AppDBContext>>();

        // 1. Auto Migrate database
        await context.Database.MigrateAsync();

        // 2. Seed Roles
        string[] roles = [UserRole.Admin.ToString(), UserRole.Teacher.ToString(), UserRole.Student.ToString()];
        foreach (var roleName in roles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new Role(roleName));
            }
        }

        // 3. Seed Default Admin User
        var adminEmail = "admin@toeichack.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "Admin Quản Trị",
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };
            var result = await userManager.CreateAsync(adminUser, "Admin@123456");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, UserRole.Admin.ToString());
                logger.LogInformation("Tạo tài khoản Admin thành công: admin@toeichack.com / Admin@123456");
            }
        }

        // 4. Seed Toeic Tests from data.json if database has no tests
        if (!await context.ToeicTests.AnyAsync())
        {
            // Check possible locations of data.json
            string[] possiblePaths = [
                Path.Combine(AppContext.BaseDirectory, "data.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "data.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "..", "Frontend", "public", "data.json"),
                Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "Frontend", "public", "data.json"),
                "D:\\Hoc_Tap\\C_Shape\\API\\1_Project\\LuyenDeTiengAnh\\Frontend\\public\\data.json",
                "D:\\Hoc_Tap\\C_Shape\\API\\1_Project\\LuyenDeTiengAnh\\public\\data.json"
            ];

            string? foundPath = possiblePaths.FirstOrDefault(File.Exists);
            if (foundPath != null)
            {
                logger.LogInformation("Tìm thấy file data.json tại: {Path}. Bắt đầu nạp đề thi...", foundPath);
                string json = await File.ReadAllTextAsync(foundPath);
                var importResult = await toeicService.BulkImportFromJsonAsync(json);
                logger.LogInformation("Kết quả nạp đề thi ban đầu: {Message}", importResult.Message);
            }
            else
            {
                logger.LogWarning("Không tìm thấy file data.json để seed ban đầu.");
            }
        }

        // 5. Seed Bino's English Book System if empty
        await SeedBinoBookAsync(context, logger);
    }

    private static async Task SeedBinoBookAsync(AppDBContext context, ILogger logger)
    {
        if (await context.BinoBooks.AnyAsync()) return;

        logger.LogInformation("Khởi tạo dữ liệu sách 'Chém Tiếng Anh không cần động não' của tác giả Bino...");

        var book = new BinoBook
        {
            Title = "Chém Tiếng Anh không cần động não",
            Author = "Bino",
            Slug = "chem-tieng-anh-khong-can-dong-nao",
            Description = "Bộ sách học tiếng Anh giao tiếp đời thực đỉnh cao của Bino. Gồm 12 chương, 72 bài hội thoại thực chiến kèm video luyện nói 1:1, audio độc quyền, các từ lóng slang và mẹo văn hóa thú vị.",
            CoverImageUrl = "/images/bino/page15.jpg",
            PdfFileUrl = "/ebooks/chem_tieng_anh_bino.pdf",
            EpubFileUrl = "/ebooks/chem_tieng_anh_bino.epub",
            TotalChapters = 12,
            IsPublished = true,
            CreatedAt = DateTime.UtcNow
        };

        var chapterTitles = new[]
        {
            ("Greetings and Introductions", "Chào hỏi và Làm quen"),
            ("Daily Life & Routines", "Đời sống hàng ngày & Thói quen"),
            ("Eating Out & Food Culture", "Ăn uống & Văn hóa ẩm thực"),
            ("Shopping & Bargaining", "Mua sắm & Trả giá"),
            ("Travel & Asking for Directions", "Du lịch & Hỏi đường"),
            ("Making Friends & Hangouts", "Kết bạn & Tụ tập đi chơi"),
            ("Work & Office Life", "Công việc & Đời sống công sở"),
            ("Emotions & Expressing Opinions", "Bộc lộ cảm xúc & Bày tỏ quan điểm"),
            ("Dating & Relationships", "Hẹn hò & Các mối quan hệ"),
            ("Health & Fitness", "Sức khỏe & Luyện tập thể thao"),
            ("Entertainment & Slang", "Giải trí & Tiếng lóng giới trẻ"),
            ("Mastering Natural English", "Làm chủ tiếng Anh tự nhiên không cần động não")
        };

        for (int i = 0; i < chapterTitles.Length; i++)
        {
            var (titleEn, titleVi) = chapterTitles[i];
            int chapterNum = i + 1;
            var chapter = new Chapter
            {
                Book = book,
                ChapterNumber = chapterNum,
                Title = titleEn,
                TitleVi = titleVi,
                Description = $"Chương {chapterNum:D2}: Luyện phản xạ tự nhiên chủ đề {titleVi.ToLower()}.",
                OrderIndex = chapterNum,
                Bonus = new ChapterBonus
                {
                    Title = $"Góc Tiếng Lóng & Mẹo Văn Hóa Tây - Chương {chapterNum:D2}",
                    ContentHtml = $"<p>Chào mấy bác! Khi giao tiếp chủ đề <strong>{titleVi}</strong>, người bản xứ rất ít khi dùng các cấu trúc sách vở cứng nhắc. Hãy bỏ túi ngay các cụm từ 'chém gió' đỉnh cao này nhé!</p>",
                    SlangListJson = "[\"No worries\",\"Make it\",\"Vibe\",\"Grab a bite\",\"Hang out\",\"Catch you later\"]"
                }
            };

            // Create 6 Dialogues for Chapter 1
            if (chapterNum == 1)
            {
                // Dialogue 1
                var d1 = new DialogueLesson
                {
                    Chapter = chapter,
                    DialogueNumber = 1,
                    Title = "At the Coffee Shop",
                    TitleVi = "Tại quán cà phê quen thuộc",
                    SituationDescription = "Bino gặp một người bạn mới tại quán cà phê và bắt đầu câu chuyện tự nhiên.",
                    VideoUrl = "/videos/bino/ch01_d01.mp4",
                    AudioUrl = "/audios/bino/ch01_d01.mp3",
                    DurationSeconds = 145,
                    OrderIndex = 1
                };
                d1.Vocabularies.Add(new DialogueVocabulary { Word = "Catch up", Phonetic = "/kætʃ ʌp/", WordType = "phrasal verb", Meaning = "Hàn huyên, cập nhật tình hình", OrderIndex = 1 });
                d1.Vocabularies.Add(new DialogueVocabulary { Word = "On me", Phonetic = "/ɒn miː/", WordType = "idiom", Meaning = "Tôi bao, tôi đãi", OrderIndex = 2 });
                d1.DialogueLines.Add(new DialogueLine { CharacterName = "BINO", EnglishText = "Hey! Long time no see. How have you been?", VietnameseText = "Ê chào bác! Lâu ngày không gặp. Dạo này thế nào rồi?", OrderIndex = 1, IsUserRole = false });
                d1.DialogueLines.Add(new DialogueLine { CharacterName = "FRIEND", EnglishText = "I've been great! Just grabbing an iced coffee.", VietnameseText = "Tôi khỏe re! Đang định làm ly cà phê đá đây.", OrderIndex = 2, IsUserRole = true });
                d1.DialogueLines.Add(new DialogueLine { CharacterName = "BINO", EnglishText = "Awesome, let me get this one. It's on me!", VietnameseText = "Được đấy, để tôi trả ly này cho. Tôi bao!", OrderIndex = 3, IsUserRole = false });
                chapter.DialogueLessons.Add(d1);

                // Dialogue 2
                var d2 = new DialogueLesson
                {
                    Chapter = chapter,
                    DialogueNumber = 2,
                    Title = "First Day at School",
                    TitleVi = "Ngày đầu tiên nhập học",
                    SituationDescription = "Làm quen với bạn học cùng bàn trong ngày đầu đến lớp.",
                    VideoUrl = "/videos/bino/ch01_d02.mp4",
                    AudioUrl = "/audios/bino/ch01_d02.mp3",
                    DurationSeconds = 160,
                    OrderIndex = 2
                };
                d2.Vocabularies.Add(new DialogueVocabulary { Word = "Major in", Phonetic = "/ˈmeɪdʒər ɪn/", WordType = "v", Meaning = "Chuyên ngành về", OrderIndex = 1 });
                d2.Vocabularies.Add(new DialogueVocabulary { Word = "Syllabus", Phonetic = "/ˈsɪləbəs/", WordType = "n", Meaning = "Đề cương môn học", OrderIndex = 2 });
                d2.DialogueLines.Add(new DialogueLine { CharacterName = "BINO", EnglishText = "Is anyone sitting here?", VietnameseText = "Chỗ này có ai ngồi chưa bác?", OrderIndex = 1, IsUserRole = false });
                d2.DialogueLines.Add(new DialogueLine { CharacterName = "CLASSMATE", EnglishText = "Nope, go ahead! I'm Alex by the way.", VietnameseText = "Chưa đâu, bác cứ ngồi đi! Nhân tiện tôi là Alex nha.", OrderIndex = 2, IsUserRole = true });
                chapter.DialogueLessons.Add(d2);

                // Dialogue 3 (Trang 15 trong ảnh thực tế của sách!)
                var d3 = new DialogueLesson
                {
                    Chapter = chapter,
                    DialogueNumber = 3,
                    Title = "At Bino's New Friend's Party",
                    TitleVi = "Tại bữa tiệc của người bạn mới",
                    SituationDescription = "Bino đến dự tiệc tại nhà bạn mới và được giới thiệu làm quen với những người bạn khác.",
                    VideoUrl = "/videos/bino/ch01_d03.mp4",
                    AudioUrl = "/audios/bino/ch01_d03.mp3",
                    DurationSeconds = 180,
                    OrderIndex = 3
                };
                // Key words từ trang 15
                d3.Vocabularies.Add(new DialogueVocabulary { Word = "Party", Phonetic = "/ˈpɑːrti/", WordType = "n", Meaning = "Bữa tiệc", OrderIndex = 1 });
                d3.Vocabularies.Add(new DialogueVocabulary { Word = "Invite sb to sth", Phonetic = "/ɪnˈvaɪt/", WordType = "v", Meaning = "Mời ai cái gì đó", OrderIndex = 2 });
                d3.Vocabularies.Add(new DialogueVocabulary { Word = "Make it", Phonetic = "/meɪk ɪt/", WordType = "idiom", Meaning = "Làm được, đến được", OrderIndex = 3 });
                d3.Vocabularies.Add(new DialogueVocabulary { Word = "Look forward to sth", Phonetic = "/lʊk ˈfɔːrwərd tuː/", WordType = "v", Meaning = "Trông đợi/hóng một cái gì đó", OrderIndex = 4 });
                d3.Vocabularies.Add(new DialogueVocabulary { Word = "Vibe", Phonetic = "/vaɪb/", WordType = "n", Meaning = "Không khí, cảm giác", OrderIndex = 5 });

                // Dialogue Lines từ trang 15 & 16
                d3.DialogueLines.Add(new DialogueLine { CharacterName = "BINO", EnglishText = "Hey, thanks for inviting me to your party! It's great to be here.", VietnameseText = "Hey, cảm ơn bác đã mời tôi tới buổi tiệc này! Ở đây quá tuyệt!", OrderIndex = 1, IsUserRole = false });
                d3.DialogueLines.Add(new DialogueLine { CharacterName = "NEW FRIEND", EnglishText = "No worries, Bino! I'm glad you could make it. Let me introduce you to some of my other friends.", VietnameseText = "Không có gì đâu Bino! Bác đến được là tôi mừng lắm. Để tôi giới thiệu mấy đứa bạn cho bác.", OrderIndex = 2, IsUserRole = true });
                d3.DialogueLines.Add(new DialogueLine { CharacterName = "BINO", EnglishText = "Sounds good! I'm looking forward to meeting new people.", VietnameseText = "Được đấy, tôi cũng đang hóng gặp bạn mới đây.", OrderIndex = 3, IsUserRole = false });
                d3.DialogueLines.Add(new DialogueLine { CharacterName = "NEW FRIEND", EnglishText = "This is Rachel and Jeremy. They're classmates of mine.", VietnameseText = "Đây là Rachel và Jeremy, bạn cùng lớp của tôi.", OrderIndex = 4, IsUserRole = true });
                d3.DialogueLines.Add(new DialogueLine { CharacterName = "BINO", EnglishText = "Nice to meet you both. How do you guys know our host?", VietnameseText = "Rất vui được gặp mấy bác. Sao mấy bác quen nhau thế?", OrderIndex = 5, IsUserRole = false });
                d3.DialogueLines.Add(new DialogueLine { CharacterName = "RACHEL", EnglishText = "We all met at a club meeting on campus. We've been friends ever since.", VietnameseText = "Bọn tôi gặp nhau hôm họp câu lạc bộ ở trường. Sau đó là chơi với nhau luôn đến giờ.", OrderIndex = 6, IsUserRole = true });
                d3.DialogueLines.Add(new DialogueLine { CharacterName = "JEREMY", EnglishText = "Yeah, we hang out pretty often. It's always fun to get together outside of class.", VietnameseText = "Yeah, bọn tôi hay đi chơi lắm. Học xong đi chơi lúc nào cũng vui ý.", OrderIndex = 7, IsUserRole = true });
                d3.DialogueLines.Add(new DialogueLine { CharacterName = "BINO", EnglishText = "That's awesome. I'm really enjoying the vibe here. Thanks again for having me.", VietnameseText = "Được đấy, tôi rất thích không khí ở đây. Cảm ơn bác lần nữa đã mời tôi nha.", OrderIndex = 8, IsUserRole = false });
                chapter.DialogueLessons.Add(d3);

                // Dialogue 4 (Trang 16 trong ảnh thực tế của sách!)
                var d4 = new DialogueLesson
                {
                    Chapter = chapter,
                    DialogueNumber = 4,
                    Title = "At Bino's New Job",
                    TitleVi = "Tại chỗ làm mới của Bino",
                    SituationDescription = "Ngày đầu đi làm tại công ty mới, làm quen đồng nghiệp và tìm hiểu môi trường làm việc.",
                    VideoUrl = "/videos/bino/ch01_d04.mp4",
                    AudioUrl = "/audios/bino/ch01_d04.mp3",
                    DurationSeconds = 175,
                    OrderIndex = 4
                };
                // Key words từ trang 16
                d4.Vocabularies.Add(new DialogueVocabulary { Word = "Recruit", Phonetic = "/rɪˈkruːt/", WordType = "n,v", Meaning = "Người mới, tuyển dụng", OrderIndex = 1 });
                d4.Vocabularies.Add(new DialogueVocabulary { Word = "Navigate", Phonetic = "/ˈnævɪɡeɪt/", WordType = "v", Meaning = "Định vị, tìm đường", OrderIndex = 2 });
                d4.Vocabularies.Add(new DialogueVocabulary { Word = "Overwhelming", Phonetic = "/ˌoʊvərˈwelmɪŋ/", WordType = "adj", Meaning = "Choáng ngợp", OrderIndex = 3 });
                d4.Vocabularies.Add(new DialogueVocabulary { Word = "Hesitate", Phonetic = "/ˈhezɪteɪt/", WordType = "v", Meaning = "Ngập ngừng, ngại ngùng", OrderIndex = 4 });
                d4.Vocabularies.Add(new DialogueVocabulary { Word = "Introduce", Phonetic = "/ˌɪntrəˈduːs/", WordType = "v", Meaning = "Giới thiệu", OrderIndex = 5 });
                d4.Vocabularies.Add(new DialogueVocabulary { Word = "Down sth", Phonetic = "/daʊn ˈsʌmθɪŋ/", WordType = "v", Meaning = "Đi qua cái gì đó", OrderIndex = 6 });
                d4.Vocabularies.Add(new DialogueVocabulary { Word = "Grab breakfast/lunch/dinner", Phonetic = "/ɡræb/", WordType = "v", Meaning = "Ăn sáng/trưa/tối", OrderIndex = 7 });

                d4.DialogueLines.Add(new DialogueLine { CharacterName = "MANAGER", EnglishText = "Welcome to the team, Bino! Don't hesitate to ask if anything feels overwhelming.", VietnameseText = "Chào mừng Bino đến với team! Đừng ngại hỏi nếu thấy có gì choáng ngợp nha.", OrderIndex = 1, IsUserRole = true });
                d4.DialogueLines.Add(new DialogueLine { CharacterName = "BINO", EnglishText = "Thank you! I'm still learning to navigate the office, but everyone has been super helpful.", VietnameseText = "Cảm ơn sếp! Em đang tập làm quen đường đi nước bước trong công ty, nhưng mọi người ai cũng nhiệt tình hết á.", OrderIndex = 2, IsUserRole = false });
                d4.DialogueLines.Add(new DialogueLine { CharacterName = "COLLEAGUE", EnglishText = "Hey new recruit! We're heading down to grab lunch together, want to join?", VietnameseText = "Ê ma mới ơi! Bọn này đang chuẩn bị đi ăn trưa nè, đi chung không?", OrderIndex = 3, IsUserRole = true });
                d4.DialogueLines.Add(new DialogueLine { CharacterName = "BINO", EnglishText = "Count me in! I'd love to.", VietnameseText = "Cho em một vé với! Em đi liền.", OrderIndex = 4, IsUserRole = false });
                chapter.DialogueLessons.Add(d4);

                // Dialogue 5
                var d5 = new DialogueLesson
                {
                    Chapter = chapter,
                    DialogueNumber = 5,
                    Title = "Running into an Old Classmate",
                    TitleVi = "Tình cờ gặp lại bạn học cũ",
                    SituationDescription = "Chạm mặt bạn học cũ trên phố và hỏi thăm về cuộc sống.",
                    VideoUrl = "/videos/bino/ch01_d05.mp4",
                    AudioUrl = "/audios/bino/ch01_d05.mp3",
                    DurationSeconds = 150,
                    OrderIndex = 5
                };
                d5.Vocabularies.Add(new DialogueVocabulary { Word = "Bump into", Phonetic = "/bʌmp ˈɪntuː/", WordType = "phrasal verb", Meaning = "Tình cờ va phải, gặp gỡ", OrderIndex = 1 });
                d5.DialogueLines.Add(new DialogueLine { CharacterName = "BINO", EnglishText = "Wait, is that John? What are the odds!", VietnameseText = "Khoan, có phải John đó không? Trùng hợp ghê ta ơi!", OrderIndex = 1, IsUserRole = false });
                d5.DialogueLines.Add(new DialogueLine { CharacterName = "JOHN", EnglishText = "Bino! What a small world. It's been ages!", VietnameseText = "Bino! Đúng là trái đất tròn. Lâu quá rồi bác ơi!", OrderIndex = 2, IsUserRole = true });
                chapter.DialogueLessons.Add(d5);

                // Dialogue 6
                var d6 = new DialogueLesson
                {
                    Chapter = chapter,
                    DialogueNumber = 6,
                    Title = "Saying Goodbye & Keeping in Touch",
                    TitleVi = "Chào tạm biệt & Giữ liên lạc",
                    SituationDescription = "Kết thúc buổi gặp gỡ, xin tài khoản mạng xã hội để giữ liên lạc.",
                    VideoUrl = "/videos/bino/ch01_d06.mp4",
                    AudioUrl = "/audios/bino/ch01_d06.mp3",
                    DurationSeconds = 140,
                    OrderIndex = 6
                };
                d6.Vocabularies.Add(new DialogueVocabulary { Word = "Hit me up", Phonetic = "/hɪt miː ʌp/", WordType = "slang", Meaning = "Nhắn tin/gọi cho tôi", OrderIndex = 1 });
                d6.DialogueLines.Add(new DialogueLine { CharacterName = "BINO", EnglishText = "I gotta take off now. Are you on Instagram?", VietnameseText = "Tôi phải lượn đây. Bác có xài Instagram không?", OrderIndex = 1, IsUserRole = false });
                d6.DialogueLines.Add(new DialogueLine { CharacterName = "FRIEND", EnglishText = "Sure! Add me and hit me up anytime.", VietnameseText = "Có chứ! Kết bạn rồi ới tôi bất cứ lúc nào nha.", OrderIndex = 2, IsUserRole = true });
                chapter.DialogueLessons.Add(d6);
            }
            else
            {
                // Placeholders for Chapter 2..12 (each has 6 dialogue lessons)
                for (int d = 1; d <= 6; d++)
                {
                    chapter.DialogueLessons.Add(new DialogueLesson
                    {
                        Chapter = chapter,
                        DialogueNumber = d,
                        Title = $"Dialogue {d}: Practical Conversation",
                        TitleVi = $"Hội thoại {d}: Tình huống thực tế",
                        SituationDescription = $"Tình huống giao tiếp số {d} của chương {chapterNum:D2}.",
                        VideoUrl = $"/videos/bino/ch{chapterNum:D2}_d{d:D2}.mp4",
                        AudioUrl = $"/audios/bino/ch{chapterNum:D2}_d{d:D2}.mp3",
                        DurationSeconds = 150,
                        OrderIndex = d
                    });
                }
            }

            book.Chapters.Add(chapter);
        }

        context.BinoBooks.Add(book);
        await context.SaveChangesAsync();
        logger.LogInformation("Đã khởi tạo thành công 12 chương và 72 bài hội thoại cho sách Bino!");
    }
}

