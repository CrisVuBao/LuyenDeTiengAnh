using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using VBaceEnglish.Application.Contracts.Services;

namespace VBaceEnglish.Infrastructure.Services;

public class GeminiAiChatService : IAiChatService
{
    private readonly string? _apiKey;
    private readonly HttpClient _httpClient;

    public GeminiAiChatService(IConfiguration config, HttpClient httpClient)
    {
        _apiKey = config["Gemini:ApiKey"];
        _httpClient = httpClient;
    }

    public async Task<string> GenerateChatAsync(string prompt)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            return "Trợ lý AI chưa được cấu hình ApiKey trong appsettings.json. Vui lòng thêm Gemini:ApiKey để kích hoạt giải thích thông minh.";
        }

        try
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={_apiKey}";
            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                }
            };

            var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(url, content);

            if (!response.IsSuccessStatusCode)
            {
                return $"Không thể kết nối tới AI API (Mã lỗi: {response.StatusCode})";
            }

            var responseJson = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseJson);

            if (doc.RootElement.TryGetProperty("candidates", out var candidates) && 
                candidates.GetArrayLength() > 0)
            {
                var firstCandidate = candidates[0];
                if (firstCandidate.TryGetProperty("content", out var cProp) &&
                    cProp.TryGetProperty("parts", out var parts) &&
                    parts.GetArrayLength() > 0)
                {
                    return parts[0].GetProperty("text").GetString() ?? "";
                }
            }

            return "Không có phản hồi từ mô hình AI.";
        }
        catch (Exception ex)
        {
            return $"Lỗi gọi AI: {ex.Message}";
        }
    }

    public async Task<string> ExplainQuestionAsync(string question, string correctAnswer, string? options, string? context)
    {
        var prompt = new StringBuilder();
        prompt.AppendLine("Bạn là chuyên gia luyện thi TOEIC 990 điểm. Hãy phân tích ngắn gọn, dễ hiểu và súc tích câu hỏi TOEIC sau đây bằng tiếng Việt:");
        if (!string.IsNullOrWhiteSpace(context))
        {
            prompt.AppendLine($"[Ngữ cảnh / Đoạn văn]:\n{context}");
        }
        prompt.AppendLine($"[Câu hỏi]: {question}");
        if (!string.IsNullOrWhiteSpace(options))
        {
            prompt.AppendLine($"[Các lựa chọn]: {options}");
        }
        prompt.AppendLine($"[Đáp án đúng]: {correctAnswer}");
        prompt.AppendLine("\nYêu cầu phân tích:\n1. Dấu hiệu nhận biết nhanh (hack speed reflex)\n2. Giải thích ngữ pháp / từ vựng cốt lõi\n3. Bẫy thường gặp của câu này");

        return await GenerateChatAsync(prompt.ToString());
    }
}

