using System.Text.RegularExpressions;
using VBaceEnglish.Domain.Models;

namespace VBaceEnglish.Application.Helpers;

public static partial class PhoneNumberHelper
{
    // Đầu số di động Việt Nam chuẩn 10 số: 03x, 05x, 07x, 08x, 09x
    // Hỗ trợ thêm đầu số cố định 02x (10 hoặc 11 số)
    [GeneratedRegex(@"^(0(3|5|7|8|9)[0-9]{8}|02[0-9]{8,9})$", RegexOptions.Compiled)]
    private static partial Regex ValidVietnamPhoneRegex();

    [GeneratedRegex(@"^[0-9]+$", RegexOptions.Compiled)]
    private static partial Regex DigitsOnlyRegex();

    /// <summary>
    /// Chuẩn hóa số điện thoại về định dạng chuẩn 10 chữ số Việt Nam (VD: 0912345678).
    /// Trả về null nếu chuỗi rỗng hoặc chỉ chứa khoảng trắng.
    /// </summary>
    public static string? Normalize(string? rawPhone)
    {
        if (string.IsNullOrWhiteSpace(rawPhone))
            return null;

        // Loại bỏ khoảng trắng, dấu chấm, gạch ngang, dấu ngoặc
        var cleaned = rawPhone.Trim()
            .Replace(" ", "")
            .Replace(".", "")
            .Replace("-", "")
            .Replace("(", "")
            .Replace(")", "");

        if (string.IsNullOrWhiteSpace(cleaned))
            return null;

        // Chuyển đổi mã quốc gia +84 / 0084 / 84 về số 0 đầu
        if (cleaned.StartsWith("+840", StringComparison.Ordinal))
        {
            cleaned = "0" + cleaned[4..];
        }
        else if (cleaned.StartsWith("+84", StringComparison.Ordinal))
        {
            cleaned = "0" + cleaned[3..];
        }
        else if (cleaned.StartsWith("00840", StringComparison.Ordinal))
        {
            cleaned = "0" + cleaned[5..];
        }
        else if (cleaned.StartsWith("0084", StringComparison.Ordinal))
        {
            cleaned = "0" + cleaned[4..];
        }
        else if (cleaned.Length == 11 && cleaned.StartsWith("84", StringComparison.Ordinal) &&
                 "235789".Contains(cleaned[2]))
        {
            cleaned = "0" + cleaned[2..];
        }

        return string.IsNullOrWhiteSpace(cleaned) ? null : cleaned;
    }

    /// <summary>
    /// Kiểm tra tính hợp lệ và chuẩn hóa số điện thoại Việt Nam.
    /// </summary>
    public static bool Validate(
        string? rawPhone,
        bool isRequired,
        out string? normalizedPhone,
        out string? errorMessage)
    {
        normalizedPhone = Normalize(rawPhone);
        errorMessage = null;

        if (string.IsNullOrEmpty(normalizedPhone))
        {
            if (isRequired)
            {
                errorMessage = "Vui lòng nhập số điện thoại để sử dụng tính năng đăng nhập bằng Email hoặc Số điện thoại.";
                return false;
            }
            normalizedPhone = null;
            return true;
        }

        if (!DigitsOnlyRegex().IsMatch(normalizedPhone))
        {
            errorMessage = "Số điện thoại chỉ được chứa chữ số (VD: 0912345678 hoặc +84912345678).";
            return false;
        }

        if (!normalizedPhone.StartsWith('0'))
        {
            errorMessage = "Số điện thoại phải bắt đầu bằng số 0 hoặc mã vùng +84 (VD: 0912345678).";
            return false;
        }

        if (!normalizedPhone.StartsWith("02", StringComparison.Ordinal) && normalizedPhone.Length != 10)
        {
            errorMessage = $"Số điện thoại di động phải gồm đúng 10 chữ số (hiện tại bạn nhập {normalizedPhone.Length} chữ số).";
            return false;
        }

        if (!ValidVietnamPhoneRegex().IsMatch(normalizedPhone))
        {
            errorMessage = "Đầu số điện thoại không hợp lệ. Vui lòng nhập số điện thoại chuẩn nhà mạng Việt Nam (03, 05, 07, 08, 09).";
            return false;
        }

        return true;
    }

    /// <summary>
    /// Tìm tài khoản đang sử dụng số điện thoại này (đã chuẩn hóa, bất kể dữ liệu cũ có dấu cách hay +84).
    /// </summary>
    public static ApplicationUser? FindUserByPhone(
        IQueryable<ApplicationUser> usersQuery,
        string? rawOrNormalizedPhone,
        int? excludeUserId = null)
    {
        var target = Normalize(rawOrNormalizedPhone);
        if (string.IsNullOrEmpty(target))
            return null;

        var intlVariant = target.StartsWith('0') ? "+84" + target[1..] : target;

        // 1. Truy vấn nhanh trên SQL với các định dạng phổ biến
        var directQuery = usersQuery.Where(u =>
            u.PhoneNumber != null &&
            u.PhoneNumber != "" &&
            (u.PhoneNumber == target || u.PhoneNumber == intlVariant || u.PhoneNumber == rawOrNormalizedPhone));

        if (excludeUserId.HasValue)
        {
            directQuery = directQuery.Where(u => u.Id != excludeUserId.Value);
        }

        var directMatch = directQuery.FirstOrDefault();
        if (directMatch != null)
            return directMatch;

        // 2. Fallback kiểm tra các bản ghi cũ có chứa khoảng trắng hoặc dấu gạch ngang
        var candidatesQuery = usersQuery.Where(u => u.PhoneNumber != null && u.PhoneNumber != "");
        if (excludeUserId.HasValue)
        {
            candidatesQuery = candidatesQuery.Where(u => u.Id != excludeUserId.Value);
        }

        foreach (var candidate in candidatesQuery.ToList())
        {
            if (string.Equals(Normalize(candidate.PhoneNumber), target, StringComparison.Ordinal))
            {
                return candidate;
            }
        }

        return null;
    }

    /// <summary>
    /// Tìm tất cả các tài khoản trùng số điện thoại (dùng khi đăng nhập nếu DB cũ từng có bản ghi trùng).
    /// </summary>
    public static List<ApplicationUser> FindAllUsersByPhone(
        IQueryable<ApplicationUser> usersQuery,
        string? rawOrNormalizedPhone)
    {
        var target = Normalize(rawOrNormalizedPhone);
        if (string.IsNullOrEmpty(target))
            return [];

        var candidates = usersQuery
            .Where(u => u.PhoneNumber != null && u.PhoneNumber != "")
            .ToList();

        return candidates
            .Where(u => string.Equals(Normalize(u.PhoneNumber), target, StringComparison.Ordinal))
            .ToList();
    }
}
