namespace VBaceEnglish.Application.Helpers;

public class Response<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }

    public static Response<T> SuccessResult(string message, T data)
        => new() { Success = true, Message = message, Data = data };

    public static Response<T> Failure(string errorMessage)
        => new() { Success = false, Message = errorMessage };
}

