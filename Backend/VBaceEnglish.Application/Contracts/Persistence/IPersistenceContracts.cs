using Microsoft.EntityFrameworkCore.Storage;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Application.Contracts.Persistence;

public interface IToeicTestRepository
{
    Task<IEnumerable<ToeicTest>> GetAllAsync();
    Task<ToeicTest?> GetByIdAsync(int id);
    Task<ToeicTest?> GetByTestIdAsync(string testId);
    Task<ToeicTest?> GetWithDetailsAsync(int id);
    Task<ToeicTest?> GetWithDetailsByTestIdAsync(string testId);
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
}

public interface IBinoBookRepository
{
    Task<BinoBook?> GetBookWithChaptersAsync(string slug = "chem-tieng-anh-khong-can-dong-nao");
    Task<Chapter?> GetChapterWithLessonsAsync(int chapterNumber);
    Task<ChapterBonus?> GetChapterBonusAsync(int chapterNumber);
    Task<DialogueLesson?> GetDialogueLessonAsync(int id);
    Task<DialogueLesson?> GetDialogueLessonByNumberAsync(int chapterNumber, int dialogueNumber);
    Task<IEnumerable<DialogueVocabulary>> GetVocabulariesByLessonAsync(int lessonId);
    Task<IEnumerable<DialogueVocabulary>> GetAllVocabulariesAsync();
}

public interface IBinoLearningRepository
{
    Task<UserDialogueProgress?> GetProgressAsync(int userId, int dialogueLessonId);
    Task<IEnumerable<UserDialogueProgress>> GetProgressByUserAsync(int userId);
    Task AddProgressAsync(UserDialogueProgress progress);
    void UpdateProgress(UserDialogueProgress progress);

    Task<UserSRSReview?> GetSRSReviewAsync(int userId, int vocabularyId);
    Task<IEnumerable<UserSRSReview>> GetDueSRSReviewsAsync(int userId);
    Task<IEnumerable<UserSRSReview>> GetAllSRSReviewsByUserAsync(int userId);
    Task AddSRSReviewAsync(UserSRSReview review);
    void UpdateSRSReview(UserSRSReview review);
}

public interface IUnitOfWork : IDisposable
{
    IToeicTestRepository ToeicTests { get; }
    IUserProgressRepository UserProgresses { get; }
    IBinoBookRepository BinoBooks { get; }
    IBinoLearningRepository BinoLearning { get; }
    Task<int> CompleteAsync();
    Task<IDbContextTransaction> BeginTransactionAsync();
}


