using Microsoft.EntityFrameworkCore.Storage;
using VBaceEnglish.Application.Contracts.Persistence;
using VBaceEnglish.Infrastructure.Data;

namespace VBaceEnglish.Infrastructure.Implementation;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDBContext _context;
    private IToeicTestRepository? _toeicTests;
    private IUserProgressRepository? _userProgresses;
    private IBinoBookRepository? _binoBooks;
    private IBinoLearningRepository? _binoLearning;
    private IGamificationRepository? _gamification;
    private IAdminManagementRepository? _adminManagement;
    private IContentModuleRepository? _contentModules;

    public UnitOfWork(AppDBContext context)
    {
        _context = context;
    }

    public IToeicTestRepository ToeicTests => _toeicTests ??= new ToeicTestRepository(_context);
    public IUserProgressRepository UserProgresses => _userProgresses ??= new UserProgressRepository(_context);
    public IBinoBookRepository BinoBooks => _binoBooks ??= new BinoBookRepository(_context);
    public IBinoLearningRepository BinoLearning => _binoLearning ??= new BinoLearningRepository(_context);
    public IGamificationRepository Gamification => _gamification ??= new GamificationRepository(_context);
    public IAdminManagementRepository AdminManagement => _adminManagement ??= new AdminManagementRepository(_context);
    public IContentModuleRepository ContentModules => _contentModules ??= new ContentModuleRepository(_context);

    public async Task<int> CompleteAsync() => await _context.SaveChangesAsync();

    public async Task<IDbContextTransaction> BeginTransactionAsync() => await _context.Database.BeginTransactionAsync();

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
