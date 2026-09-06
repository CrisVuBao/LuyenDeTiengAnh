using System.Text.Json;
using VBaceEnglish.Application.Contracts.Persistence;
using VBaceEnglish.Application.DTOs.Toeic;
using VBaceEnglish.Application.Helpers;
using VBaceEnglish.Domain.Enums;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Application.Services;

public interface IToeicTestService
{
    Task<Response<IEnumerable<ToeicTestDto>>> GetAllTestsAsync();
    Task<Response<ToeicTestDetailDto>> GetTestByIdAsync(int id);
    Task<Response<ToeicTestDetailDto>> GetTestByCodeAsync(string testId);
    Task<Response<bool>> DeleteTestAsync(int id);
    Task<Response<int>> BulkImportFromJsonAsync(string jsonContent);
}

public class ToeicTestService : IToeicTestService
{
    private readonly IUnitOfWork _unitOfWork;

    public ToeicTestService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Response<IEnumerable<ToeicTestDto>>> GetAllTestsAsync()
    {
        var tests = await _unitOfWork.ToeicTests.GetAllAsync();
        var dtos = tests.Select(t => new ToeicTestDto
        {
            Id = t.Id,
            TestId = t.TestId,
            Title = t.Title,
            Description = t.Description,
            TotalQuestions = t.TotalQuestions,
            CreatedAt = t.CreatedAt
        });

        return Response<IEnumerable<ToeicTestDto>>.SuccessResult("Lấy danh sách đề thi thành công", dtos);
    }

    public async Task<Response<ToeicTestDetailDto>> GetTestByIdAsync(int id)
    {
        var test = await _unitOfWork.ToeicTests.GetWithDetailsAsync(id);
        if (test == null) return Response<ToeicTestDetailDto>.Failure("Không tìm thấy đề thi");

        return Response<ToeicTestDetailDto>.SuccessResult("Lấy chi tiết đề thi thành công", MapToDetailDto(test));
    }

    public async Task<Response<ToeicTestDetailDto>> GetTestByCodeAsync(string testId)
    {
        var test = await _unitOfWork.ToeicTests.GetWithDetailsByTestIdAsync(testId);
        if (test == null) return Response<ToeicTestDetailDto>.Failure("Không tìm thấy đề thi");

        return Response<ToeicTestDetailDto>.SuccessResult("Lấy chi tiết đề thi thành công", MapToDetailDto(test));
    }

    public async Task<Response<bool>> DeleteTestAsync(int id)
    {
        var test = await _unitOfWork.ToeicTests.GetByIdAsync(id);
        if (test == null) return Response<bool>.Failure("Không tìm thấy đề thi để xóa");

        _unitOfWork.ToeicTests.Remove(test);
        await _unitOfWork.CompleteAsync();

        return Response<bool>.SuccessResult("Xóa đề thi thành công", true);
    }

    public async Task<Response<int>> BulkImportFromJsonAsync(string jsonContent)
    {
        try
        {
            using var doc = JsonDocument.Parse(jsonContent);
            var root = doc.RootElement;
            int importedCount = 0;

            if (root.ValueKind == JsonValueKind.Array)
            {
                foreach (var element in root.EnumerateArray())
                {
                    await ProcessSingleTestElement(element);
                    importedCount++;
                }
            }
            else if (root.ValueKind == JsonValueKind.Object)
            {
                await ProcessSingleTestElement(root);
                importedCount = 1;
            }

            await _unitOfWork.CompleteAsync();
            return Response<int>.SuccessResult($"Đã import thành công {importedCount} đề thi", importedCount);
        }
        catch (Exception ex)
        {
            return Response<int>.Failure($"Lỗi phân tích JSON: {ex.Message}");
        }
    }

    private async Task ProcessSingleTestElement(JsonElement testElem)
    {
        string testCode = testElem.TryGetProperty("testId", out var tId) ? tId.GetString() ?? "TEST" : "TEST";
        var existing = await _unitOfWork.ToeicTests.GetWithDetailsByTestIdAsync(testCode);

        ToeicTest test = existing ?? new ToeicTest
        {
            TestId = testCode,
            Title = testElem.TryGetProperty("title", out var titleProp) ? titleProp.GetString() ?? testCode : testCode,
            CreatedAt = DateTime.UtcNow
        };

        if (existing == null)
        {
            await _unitOfWork.ToeicTests.AddAsync(test);
        }

        // 1. Part 1
        if (testElem.TryGetProperty("part1", out var p1) && p1.ValueKind == JsonValueKind.Array)
        {
            test.Part1Questions.Clear();
            foreach (var item in p1.EnumerateArray())
            {
                test.Part1Questions.Add(new Part1Question
                {
                    QuestionNumber = item.TryGetProperty("id", out var id) ? id.GetInt32() : 1,
                    ImageUrl = item.TryGetProperty("imageUrl", out var img) ? img.GetString() : null,
                    AudioUrl = item.TryGetProperty("audioUrl", out var aud) ? aud.GetString() : null,
                    CorrectAnswerText = item.TryGetProperty("correctAnswerText", out var ans) ? ans.GetString() ?? "" : "",
                    Translation = item.TryGetProperty("translation", out var tr) ? tr.GetString() : null,
                    Explanation = item.TryGetProperty("explanation", out var exp) ? exp.GetString() : null
                });
            }
        }

        // 2. Part 2
        if (testElem.TryGetProperty("part2", out var p2) && p2.ValueKind == JsonValueKind.Array)
        {
            test.Part2Questions.Clear();
            foreach (var item in p2.EnumerateArray())
            {
                test.Part2Questions.Add(new Part2Question
                {
                    QuestionNumber = item.TryGetProperty("id", out var id) ? id.GetInt32() : 7,
                    AudioUrl = item.TryGetProperty("audioUrl", out var aud) ? aud.GetString() : null,
                    QuestionText = item.TryGetProperty("questionText", out var qt) ? qt.GetString() : null,
                    QuestionTextVi = item.TryGetProperty("questionTextVi", out var qtv) ? qtv.GetString() : null,
                    CorrectAnswer = item.TryGetProperty("correctAnswer", out var ca) ? ca.GetString() ?? "A" : "A",
                    CorrectAnswerText = item.TryGetProperty("correctAnswerText", out var cat) ? cat.GetString() : null,
                    Explanation = item.TryGetProperty("explanation", out var exp) ? exp.GetString() : null
                });
            }
        }

        // 3. Part 5
        if (testElem.TryGetProperty("part5", out var p5) && p5.ValueKind == JsonValueKind.Array)
        {
            test.Part5Questions.Clear();
            foreach (var item in p5.EnumerateArray())
            {
                string optA = "", optB = "", optC = "", optD = "";
                if (item.TryGetProperty("options", out var opts) && opts.ValueKind == JsonValueKind.Object)
                {
                    if (opts.TryGetProperty("A", out var oa)) optA = oa.GetString() ?? "";
                    if (opts.TryGetProperty("B", out var ob)) optB = ob.GetString() ?? "";
                    if (opts.TryGetProperty("C", out var oc)) optC = oc.GetString() ?? "";
                    if (opts.TryGetProperty("D", out var od)) optD = od.GetString() ?? "";
                }

                test.Part5Questions.Add(new Part5Question
                {
                    QuestionNumber = item.TryGetProperty("id", out var id) ? id.GetInt32() : 101,
                    Question = item.TryGetProperty("question", out var q) ? q.GetString() ?? "" : "",
                    Translation = item.TryGetProperty("translation", out var tr) ? tr.GetString() : null,
                    OptionA = optA,
                    OptionB = optB,
                    OptionC = optC,
                    OptionD = optD,
                    CorrectAnswer = item.TryGetProperty("correctAnswer", out var ca) ? ca.GetString() ?? "A" : "A",
                    GrammarTag = item.TryGetProperty("grammarTag", out var gt) ? gt.GetString() : null,
                    RecognitionKey = item.TryGetProperty("recognitionKey", out var rk) ? rk.GetString() : null,
                    Explanation = item.TryGetProperty("explanation", out var exp) ? exp.GetString() : null,
                    Trap = item.TryGetProperty("trap", out var trp) ? trp.GetString() : null
                });
            }
        }

        // 4. Part 6
        if (testElem.TryGetProperty("part6", out var p6) && p6.ValueKind == JsonValueKind.Array)
        {
            test.Part6Passages.Clear();
            var groupedP6 = new Dictionary<string, Part6Passage>();
            foreach (var item in p6.EnumerateArray())
            {
                string passageTitle = item.TryGetProperty("passageTitle", out var pt) ? pt.GetString() ?? "" :
                                     item.TryGetProperty("passage", out var p) ? p.GetString() ?? "" : "Đoạn văn";
                string passageContext = item.TryGetProperty("passageContext", out var pc) ? pc.GetString() ?? "" : "";
                string? audioUrl = item.TryGetProperty("audioUrl", out var aud) ? aud.GetString() : null;

                if (!groupedP6.TryGetValue(passageTitle, out var passage))
                {
                    passage = new Part6Passage
                    {
                        PassageTitle = passageTitle,
                        PassageContext = passageContext,
                        AudioUrl = audioUrl
                    };
                    groupedP6[passageTitle] = passage;
                    test.Part6Passages.Add(passage);
                }

                string optA = "", optB = "", optC = "", optD = "";
                if (item.TryGetProperty("options", out var opts) && opts.ValueKind == JsonValueKind.Object)
                {
                    if (opts.TryGetProperty("A", out var oa)) optA = oa.GetString() ?? "";
                    if (opts.TryGetProperty("B", out var ob)) optB = ob.GetString() ?? "";
                    if (opts.TryGetProperty("C", out var oc)) optC = oc.GetString() ?? "";
                    if (opts.TryGetProperty("D", out var od)) optD = od.GetString() ?? "";
                }

                passage.Questions.Add(new Part6Question
                {
                    QuestionNumber = item.TryGetProperty("id", out var id) ? id.GetInt32() : 131,
                    Question = item.TryGetProperty("question", out var q) ? q.GetString() : null,
                    Text = item.TryGetProperty("text", out var txt) ? txt.GetString() : null,
                    Translation = item.TryGetProperty("translation", out var tr) ? tr.GetString() : null,
                    OptionA = optA,
                    OptionB = optB,
                    OptionC = optC,
                    OptionD = optD,
                    CorrectAnswer = item.TryGetProperty("correctAnswer", out var ca) ? ca.GetString() ?? "A" : "A",
                    CorrectAnswerText = item.TryGetProperty("correctAnswerText", out var cat) ? cat.GetString() : null,
                    CorrectAnswerTextVi = item.TryGetProperty("correctAnswerTextVi", out var catv) ? catv.GetString() : null,
                    GrammarTag = item.TryGetProperty("grammarTag", out var gt) ? gt.GetString() : null,
                    RecognitionKey = item.TryGetProperty("recognitionKey", out var rk) ? rk.GetString() : null,
                    Explanation = item.TryGetProperty("explanation", out var exp) ? exp.GetString() : null,
                    Trap = item.TryGetProperty("trap", out var trp) ? trp.GetString() : null
                });
            }
        }

        // 5. Part 7
        if (testElem.TryGetProperty("part7", out var p7) && p7.ValueKind == JsonValueKind.Array)
        {
            test.Part7Passages.Clear();
            var groupedP7 = new Dictionary<string, Part7Passage>();
            foreach (var item in p7.EnumerateArray())
            {
                string passageTitle = item.TryGetProperty("passageTitle", out var pt) ? pt.GetString() ?? "" :
                                     item.TryGetProperty("passage", out var p) ? p.GetString() ?? "" : "Đoạn văn";
                string passageText = item.TryGetProperty("passageText", out var pc) ? pc.GetString() ?? "" : "";
                string? audioUrl = item.TryGetProperty("audioUrl", out var aud) ? aud.GetString() : null;

                if (!groupedP7.TryGetValue(passageTitle, out var passage))
                {
                    passage = new Part7Passage
                    {
                        PassageTitle = passageTitle,
                        PassageText = passageText,
                        AudioUrl = audioUrl
                    };
                    groupedP7[passageTitle] = passage;
                    test.Part7Passages.Add(passage);
                }

                string optA = "", optB = "", optC = "", optD = "";
                if (item.TryGetProperty("options", out var opts) && opts.ValueKind == JsonValueKind.Object)
                {
                    if (opts.TryGetProperty("A", out var oa)) optA = oa.GetString() ?? "";
                    if (opts.TryGetProperty("B", out var ob)) optB = ob.GetString() ?? "";
                    if (opts.TryGetProperty("C", out var oc)) optC = oc.GetString() ?? "";
                    if (opts.TryGetProperty("D", out var od)) optD = od.GetString() ?? "";
                }

                passage.Questions.Add(new Part7Question
                {
                    QuestionNumber = item.TryGetProperty("id", out var id) ? id.GetInt32() : 147,
                    Question = item.TryGetProperty("question", out var q) ? q.GetString() ?? "" : "",
                    Translation = item.TryGetProperty("translation", out var tr) ? tr.GetString() : null,
                    OptionA = optA,
                    OptionB = optB,
                    OptionC = optC,
                    OptionD = optD,
                    CorrectAnswer = item.TryGetProperty("correctAnswer", out var ca) ? ca.GetString() ?? "A" : "A",
                    CorrectAnswerText = item.TryGetProperty("correctAnswerText", out var cat) ? cat.GetString() : null,
                    EvidenceInPassage = item.TryGetProperty("evidenceInPassage", out var ev) ? ev.GetString() : null,
                    RecognitionKey = item.TryGetProperty("recognitionKey", out var rk) ? rk.GetString() : null,
                    Explanation = item.TryGetProperty("explanation", out var exp) ? exp.GetString() : null,
                    Trap = item.TryGetProperty("trap", out var trp) ? trp.GetString() : null
                });
            }
        }

        // Recalculate total questions
        test.TotalQuestions = test.Part1Questions.Count + test.Part2Questions.Count +
                              test.Part34Passages.Sum(p => p.Questions.Count) +
                              test.Part5Questions.Count +
                              test.Part6Passages.Sum(p => p.Questions.Count) +
                              test.Part7Passages.Sum(p => p.Questions.Count);
    }

    private static ToeicTestDetailDto MapToDetailDto(ToeicTest test)
    {
        return new ToeicTestDetailDto
        {
            Id = test.Id,
            TestId = test.TestId,
            Title = test.Title,
            Description = test.Description,
            TotalQuestions = test.TotalQuestions,
            Part1 = test.Part1Questions.Select(q => new Part1Dto
            {
                Id = q.QuestionNumber,
                ImageUrl = q.ImageUrl,
                AudioUrl = q.AudioUrl,
                CorrectAnswerText = q.CorrectAnswerText,
                Translation = q.Translation,
                Explanation = q.Explanation
            }).ToList(),
            Part2 = test.Part2Questions.Select(q => new Part2Dto
            {
                Id = q.QuestionNumber,
                AudioUrl = q.AudioUrl,
                QuestionText = q.QuestionText,
                QuestionTextVi = q.QuestionTextVi,
                CorrectAnswer = q.CorrectAnswer,
                CorrectAnswerText = q.CorrectAnswerText,
                Explanation = q.Explanation
            }).ToList(),
            Part34 = test.Part34Passages.Select(p => new Part34PassageDto
            {
                Id = p.Id,
                Title = p.Title,
                AudioUrl = p.AudioUrl,
                Transcript = p.Transcript,
                TranscriptVi = p.TranscriptVi,
                Questions = p.Questions.Select(q => new Part34QuestionDto
                {
                    Id = q.QuestionNumber,
                    Question = q.Question,
                    Translation = q.Translation,
                    CorrectAnswer = q.CorrectAnswer,
                    CorrectAnswerText = q.CorrectAnswerText,
                    Explanation = q.Explanation
                }).ToList(),
                ParaphraseMaps = p.ParaphraseMaps.Select(pm => new ParaphraseMapDto
                {
                    InTranscript = pm.InTranscript,
                    InQuestionOrAnswer = pm.InQuestionOrAnswer,
                    Color = pm.Color
                }).ToList()
            }).ToList(),
            Part5 = test.Part5Questions.Select(q => new Part5Dto
            {
                Id = q.QuestionNumber,
                Question = q.Question,
                Translation = q.Translation,
                Options = new Dictionary<string, string>
                {
                    ["A"] = q.OptionA,
                    ["B"] = q.OptionB,
                    ["C"] = q.OptionC,
                    ["D"] = q.OptionD
                },
                CorrectAnswer = q.CorrectAnswer,
                GrammarTag = q.GrammarTag,
                RecognitionKey = q.RecognitionKey,
                Explanation = q.Explanation,
                Trap = q.Trap
            }).ToList(),
            Part6 = test.Part6Passages.Select(p => new Part6PassageDto
            {
                Id = p.Id,
                PassageTitle = p.PassageTitle,
                PassageContext = p.PassageContext,
                AudioUrl = p.AudioUrl,
                Questions = p.Questions.Select(q => new Part6QuestionDto
                {
                    Id = q.QuestionNumber,
                    Question = q.Question,
                    Text = q.Text,
                    Translation = q.Translation,
                    Options = new Dictionary<string, string>
                    {
                        ["A"] = q.OptionA,
                        ["B"] = q.OptionB,
                        ["C"] = q.OptionC,
                        ["D"] = q.OptionD
                    },
                    CorrectAnswer = q.CorrectAnswer,
                    CorrectAnswerText = q.CorrectAnswerText,
                    CorrectAnswerTextVi = q.CorrectAnswerTextVi,
                    GrammarTag = q.GrammarTag,
                    RecognitionKey = q.RecognitionKey,
                    Explanation = q.Explanation,
                    Trap = q.Trap
                }).ToList()
            }).ToList(),
            Part7 = test.Part7Passages.Select(p => new Part7PassageDto
            {
                Id = p.Id,
                PassageTitle = p.PassageTitle,
                PassageText = p.PassageText,
                AudioUrl = p.AudioUrl,
                Questions = p.Questions.Select(q => new Part7QuestionDto
                {
                    Id = q.QuestionNumber,
                    Question = q.Question,
                    Translation = q.Translation,
                    Options = new Dictionary<string, string>
                    {
                        ["A"] = q.OptionA,
                        ["B"] = q.OptionB,
                        ["C"] = q.OptionC,
                        ["D"] = q.OptionD
                    },
                    CorrectAnswer = q.CorrectAnswer,
                    CorrectAnswerText = q.CorrectAnswerText,
                    EvidenceInPassage = q.EvidenceInPassage,
                    RecognitionKey = q.RecognitionKey,
                    Explanation = q.Explanation,
                    Trap = q.Trap
                }).ToList()
            }).ToList()
        };
    }
}

