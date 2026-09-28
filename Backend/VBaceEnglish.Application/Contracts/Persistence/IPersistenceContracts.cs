using Microsoft.EntityFrameworkCore.Storage;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Application.Contracts.Persistence;

public interface IToeicTestRepository
{
    Task<IEnumerable<ToeicTest>> GetAllAsync();
    Task<ToeicTest?> GetByIdAsync(int id);
    Task<ToeicTest?> GetByTestIdAsync(string testId);
    Task<ToeicTest?> GetWithDetailsAsync(int id);
    Task<ToeicTest?> GetWithDetailsByTestIdAsync(string testId, bool trackChanges = false);
    Task AddAsync(ToeicTest entity);
    void Update(ToeicTest entity);
    void Remove(ToeicTest entity);
}

public interface IUserProgressRepository
{
    Task<IEnumerable<UserStudyProgress>> GetProgressByUserAndTestAsync(int userId, int toeicTestId);
    Task<UserStudyProgress?> GetByQuestionAsync(int userId, int toeicTestId, int partNumber, int questionNumber);
    Task AddAsync(UserStudyProgress entity);
    void Update(UserStudyProgress entity);
    void RemoveRange(IEnumerable<UserStudyProgress> entities);

    Task<UserTestSummary?> GetSummaryAsync(int userId, int toeicTestId);
    Task<IEnumerable<UserTestSummary>> GetSummariesByUserAsync(int userId);
    Task<IEnumerable<UserTestSummary>> GetAllSummariesAsync();
    Task<IEnumerable<UserStudyProgress>> GetAllProgressByUserAsync(int userId);
    Task<int> GetTotalInteractionCountAsync();
    Task AddSummaryAsync(UserTestSummary summary);
    void UpdateSummary(UserTestSummary summary);

    Task<UserReflexProgress?> GetReflexProgressAsync(int userId);
    Task AddReflexProgressAsync(UserReflexProgress progress);
    void UpdateReflexProgress(UserReflexProgress progress);

    Task<UserEbookProgress?> GetEbookProgressAsync(int userId, string bookSlug);
    Task AddEbookProgressAsync(UserEbookProgress progress);
    void UpdateEbookProgress(UserEbookProgress progress);

    Task<UserVocabProgress?> GetVocabProgressAsync(int userId);
    Task AddVocabProgressAsync(UserVocabProgress progress);
    void UpdateVocabProgress(UserVocabProgress progress);
}


public interface IBinoBookRepository
{
    Task<BinoBook?> GetBookWithChaptersAsync(string slug = "chem-tieng-anh-khong-can-dong-nao", bool trackChanges = false);
    Task<Chapter?> GetChapterWithLessonsAsync(int chapterNumber);
    Task<Chapter?> GetChapterByIdAsync(int id);
    Task<IEnumerable<Chapter>> GetAllChaptersAsync(string slug = "chem-tieng-anh-khong-can-dong-nao");
    Task AddChapterAsync(Chapter chapter);
    void UpdateChapter(Chapter chapter);
    void RemoveChapter(Chapter chapter);

    Task<ChapterBonus?> GetChapterBonusAsync(int chapterNumber);
    Task<ChapterBonus?> GetChapterBonusByIdAsync(int chapterId);
    Task AddChapterBonusAsync(ChapterBonus bonus);
    void UpdateChapterBonus(ChapterBonus bonus);

    Task<DialogueLesson?> GetDialogueLessonAsync(int id, bool trackChanges = false);
    Task<DialogueLesson?> GetDialogueLessonByNumberAsync(int chapterNumber, int dialogueNumber);
    Task<IEnumerable<DialogueLesson>> GetDialoguesByChapterIdAsync(int chapterId);
    Task AddDialogueLessonAsync(DialogueLesson lesson);
    void UpdateDialogueLesson(DialogueLesson lesson);
    void RemoveDialogueLesson(DialogueLesson lesson);

    Task<IEnumerable<DialogueVocabulary>> GetVocabulariesByLessonAsync(int lessonId);
    Task<IEnumerable<DialogueVocabulary>> GetAllVocabulariesAsync();
    Task AddVocabularyAsync(DialogueVocabulary vocabulary);
    void RemoveVocabulary(DialogueVocabulary vocabulary);
    void RemoveVocabularies(IEnumerable<DialogueVocabulary> vocabularies);

    Task AddDialogueLineAsync(DialogueLine line);
    void RemoveDialogueLine(DialogueLine line);
    void RemoveDialogueLines(IEnumerable<DialogueLine> lines);
}

public interface IBinoLearningRepository
{
    Task<UserDialogueProgress?> GetProgressAsync(int userId, int dialogueLessonId);
    Task<IEnumerable<UserDialogueProgress>> GetProgressByUserAsync(int userId);
    Task<IEnumerable<UserDialogueProgress>> GetAllProgressesAsync();
    Task AddProgressAsync(UserDialogueProgress progress);
    void UpdateProgress(UserDialogueProgress progress);
    void RemoveProgressRange(IEnumerable<UserDialogueProgress> progresses);

    Task<UserSRSReview?> GetSRSReviewAsync(int userId, int vocabularyId);
    Task<IEnumerable<UserSRSReview>> GetDueSRSReviewsAsync(int userId);
    Task<IEnumerable<UserSRSReview>> GetAllSRSReviewsByUserAsync(int userId);
    Task<IEnumerable<UserSRSReview>> GetAllSRSReviewsAsync();
    Task AddSRSReviewAsync(UserSRSReview review);
    void UpdateSRSReview(UserSRSReview review);
    void RemoveSRSReview(UserSRSReview review);
}

public interface IGamificationRepository
{
    Task<UserGamification?> GetByUserIdAsync(int userId);
    Task UpsertAsync(UserGamification entity);
    Task AddXPTransactionAsync(XPTransaction transaction);
    Task<IEnumerable<UserGamification>> GetWeeklyLeaderboardAsync(int top = 20);
    Task<int> GetUserRankAsync(int userId);
}

public interface IAdminManagementRepository
{
    // Notifications
    Task<List<Notification>> GetUserNotificationsAsync(int userId, int limit = 40);
    Task<int> GetUnreadCountAsync(int userId);
    Task<Notification?> GetNotificationByIdAsync(int id);
    Task AddNotificationsAsync(IEnumerable<Notification> notifications);
    Task<bool> MarkAsReadAsync(int userId, int notificationId);
    Task<int> MarkAllAsReadAsync(int userId);
    Task<int> DeleteNotificationOrBatchAsync(string idOrBatchId);
    Task<List<Notification>> GetAllAdminNotificationsAsync(int limit = 500);
    Task<int> DeleteOldNotificationsAsync(DateTime olderThan);

    // SystemSettings
    Task<List<SystemSetting>> GetAllSettingsAsync();
    Task<SystemSetting?> GetSettingByKeyAsync(string key);
    Task UpsertSettingsAsync(Dictionary<string, string> updates, int? updatedByUserId);
    Task ResetAllSettingsAsync(IEnumerable<SystemSetting> defaultSettings, int? updatedByUserId);

    // AdminActivityLogs
    Task AddActivityLogAsync(AdminActivityLog log);
    Task<(List<AdminActivityLog> Items, int TotalCount)> GetActivityLogsAsync(string? action, string? entityType, string? search, int page = 1, int pageSize = 50);
    Task<List<AdminActivityLog>> GetRecentActivityLogsAsync(int limit = 200);
    Task<int> DeleteOldActivityLogsAsync(DateTime olderThan);
    Task<int> DeleteOldAiChatLogsAsync(DateTime olderThan);

    // Analytics & System Metrics
    Task<Dictionary<string, int>> GetDatabaseTableCountsAsync();
    Task<List<UserVocabProgress>> GetAllVocabProgressesAsync();
    Task<List<UserReflexProgress>> GetAllReflexProgressesAsync();
    Task<List<UserGamification>> GetAllGamificationsAsync();
}

public interface IUnitOfWork : IDisposable
{
    IToeicTestRepository ToeicTests { get; }
    IUserProgressRepository UserProgresses { get; }
    IBinoBookRepository BinoBooks { get; }
    IBinoLearningRepository BinoLearning { get; }
    IGamificationRepository Gamification { get; }
    IAdminManagementRepository AdminManagement { get; }
    Task<int> CompleteAsync();
    Task<IDbContextTransaction> BeginTransactionAsync();
}


