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

public interface IUnitOfWork : IDisposable
{
    IToeicTestRepository ToeicTests { get; }
    IUserProgressRepository UserProgresses { get; }
    Task<int> CompleteAsync();
    Task<IDbContextTransaction> BeginTransactionAsync();
}

