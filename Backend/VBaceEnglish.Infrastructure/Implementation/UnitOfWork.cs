using Microsoft.EntityFrameworkCore.Storage;
using VBaceEnglish.Application.Contracts.Persistence;
using VBaceEnglish.Infrastructure.Data;

namespace VBaceEnglish.Infrastructure.Implementation;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDBContext _context;
    private IToeicTestRepository? _toeicTests;
    private IUserProgressRepository? _userProgresses;

    public UnitOfWork(AppDBContext context)
    {
        _context = context;
    }

    public IToeicTestRepository ToeicTests => _toeicTests ??= new ToeicTestRepository(_context);
    public IUserProgressRepository UserProgresses => _userProgresses ??= new UserProgressRepository(_context);

    public async Task<int> CompleteAsync() => await _context.SaveChangesAsync();

    public async Task<IDbContextTransaction> BeginTransactionAsync() => await _context.Database.BeginTransactionAsync();

    public void Dispose()
    {
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}

