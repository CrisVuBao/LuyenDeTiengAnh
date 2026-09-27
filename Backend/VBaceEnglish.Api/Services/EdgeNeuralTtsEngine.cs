using System.Collections.Concurrent;
using System.Net;
using System.Net.Sockets;
using System.Net.WebSockets;
using System.Security;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace VBaceEnglish.Api.Services;

/// <summary>
/// Động cơ tổng hợp giọng nói AI chuẩn Studio (Microsoft Edge Neural TTS)
/// Giúp mọi trình duyệt (Chrome, Samsung Internet, Brave, Safari, Mobile & PC)
/// đều phát được giọng đọc Neural tự nhiên như người thật nói, kèm bộ nhớ đệm (Disk Cache) tốc độ cao.
/// </summary>
public static class EdgeNeuralTtsEngine
{
    private const string BaseUrl = "speech.platform.bing.com/consumer/speech/synthesize/readaloud";
    private const string TrustedClientToken = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
    private const string ChromiumFullVersion = "143.0.3650.75";
    private const string ChromiumMajorVersion = "143";
    private const string SecMsGecVersion = $"1-{ChromiumFullVersion}";
    private const long WinEpoch = 11644473600L;

    public const string DefaultBinoVoice = "en-US-AndrewMultilingualNeural";
    public const string DefaultFemaleVoice = "en-US-AvaMultilingualNeural";
    public const string DefaultMalePartnerVoice = "en-US-BrianMultilingualNeural";
    public const string DefaultChildVoice = "en-US-AnaNeural";

    private static double _clockSkewSeconds = 0.0;
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> _keyLocks = new();
    private static readonly ConcurrentDictionary<string, byte[]> MemoryAudioCache = new();
    private static readonly ConcurrentQueue<string> MemoryAudioOrder = new();
    private const int MaxMemoryAudioItems = 300;

    private static void StoreInMemoryCache(string cacheKey, byte[] audioBytes)
    {
        if (MemoryAudioCache.TryAdd(cacheKey, audioBytes))
        {
            MemoryAudioOrder.Enqueue(cacheKey);
            while (MemoryAudioCache.Count > MaxMemoryAudioItems && MemoryAudioOrder.TryDequeue(out var oldestKey))
            {
                MemoryAudioCache.TryRemove(oldestKey, out _);
            }
        }
    }

    private static readonly SocketsHttpHandler SharedSocketsHandler = new()
    {
        UseProxy = false,
        UseCookies = false,
        PooledConnectionLifetime = TimeSpan.FromMinutes(10),
        ConnectCallback = async (context, token) =>
        {
            var addresses = await Dns.GetHostAddressesAsync(context.DnsEndPoint.Host, AddressFamily.InterNetwork, token);
            var socket = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp)
            {
                NoDelay = true
            };
            try
            {
                await socket.ConnectAsync(addresses, context.DnsEndPoint.Port, token);
                return new NetworkStream(socket, ownsSocket: true);
            }
            catch
            {
                socket.Dispose();
                throw;
            }
        }
    };

    private static readonly HttpMessageInvoker SharedWsInvoker = new(SharedSocketsHandler);
    private static readonly HttpClient _httpClient = new(SharedSocketsHandler, disposeHandler: false)
    {
        Timeout = TimeSpan.FromSeconds(10)
    };

    private static readonly Regex SafeVoiceRegex = new(@"^[a-zA-Z0-9\-]+$", RegexOptions.Compiled);
    private static readonly Regex SafeRatePitchRegex = new(@"^[+\-]?[0-9]{1,3}(%|Hz)$", RegexOptions.Compiled);

    public static async Task<byte[]?> GetOrSynthesizeAudioAsync(
        string text,
        string? voice,
        string? rate,
        string? pitch,
        string webRootPath,
        CancellationToken cancellationToken = default)
    {
        var cleanText = RemoveIncompatibleCharacters(text).Trim();
        if (string.IsNullOrWhiteSpace(cleanText))
            return null;

        if (cleanText.Length > 1200)
            cleanText = cleanText[..1200];

        var safeVoice = NormalizeVoice(voice);
        var safeRate = NormalizeProsodyParam(rate, "+0%");
        var safePitch = NormalizeProsodyParam(pitch, "+0Hz");

        var cacheKey = ComputeCacheHash($"{safeVoice}|{safeRate}|{safePitch}|{cleanText}");

        // L1 RAM Cache (< 0.02ms, 0 Disk I/O)
        if (MemoryAudioCache.TryGetValue(cacheKey, out var cachedRamBytes))
        {
            return cachedRamBytes;
        }

        var cacheDir = Path.Combine(webRootPath, "tts-cache");
        if (!Directory.Exists(cacheDir))
        {
            Directory.CreateDirectory(cacheDir);
        }

        var cacheFilePath = Path.Combine(cacheDir, $"{cacheKey}.mp3");

        if (File.Exists(cacheFilePath))
        {
            var info = new FileInfo(cacheFilePath);
            if (info.Length > 256)
            {
                var diskBytes = await File.ReadAllBytesAsync(cacheFilePath, cancellationToken);
                StoreInMemoryCache(cacheKey, diskBytes);
                return diskBytes;
            }
        }

        var sem = _keyLocks.GetOrAdd(cacheKey, _ => new SemaphoreSlim(1, 1));
        await sem.WaitAsync(cancellationToken);
        try
        {
            if (MemoryAudioCache.TryGetValue(cacheKey, out var ramBytesAfterLock))
            {
                return ramBytesAfterLock;
            }

            if (File.Exists(cacheFilePath))
            {
                var info = new FileInfo(cacheFilePath);
                if (info.Length > 256)
                {
                    var diskBytes = await File.ReadAllBytesAsync(cacheFilePath, cancellationToken);
                    StoreInMemoryCache(cacheKey, diskBytes);
                    return diskBytes;
                }
            }

            byte[]? audioBytes = null;
            try
            {
                audioBytes = await SynthesizeEdgeNeuralAsync(cleanText, safeVoice, safeRate, safePitch, cancellationToken);
            }
            catch
            {
                // Synchronize server clock skew and retry once
                await SyncClockSkewAsync(cancellationToken);
                try
                {
                    audioBytes = await SynthesizeEdgeNeuralAsync(cleanText, safeVoice, safeRate, safePitch, cancellationToken);
                }
                catch
                {
                    audioBytes = null;
                }
            }

            if (audioBytes != null && audioBytes.Length > 256)
            {
                StoreInMemoryCache(cacheKey, audioBytes);
                try
                {
                    await File.WriteAllBytesAsync(cacheFilePath, audioBytes, cancellationToken);
                }
                catch
                {
                    // Ignore disk write race errors
                }
                return audioBytes;
            }

            // Fallback to HTTPS TTS if WebSocket is blocked by network firewall
            return await SynthesizeFallbackAsync(cleanText, cancellationToken);
        }
        finally
        {
            sem.Release();
        }
    }

    private static async Task<byte[]> SynthesizeEdgeNeuralAsync(
        string text,
        string voice,
        string rate,
        string pitch,
        CancellationToken cancellationToken)
    {
        var connectId = Guid.NewGuid().ToString("N");
        var secMsGec = GenerateSecMsGec();
        var muid = Convert.ToHexString(RandomNumberGenerator.GetBytes(16));

        var wssUri = new Uri(
            $"wss://{BaseUrl}/edge/v1?TrustedClientToken={TrustedClientToken}" +
            $"&ConnectionId={connectId}" +
            $"&Sec-MS-GEC={secMsGec}" +
            $"&Sec-MS-GEC-Version={SecMsGecVersion}");

        using var ws = new ClientWebSocket();
        ws.Options.SetRequestHeader("Pragma", "no-cache");
        ws.Options.SetRequestHeader("Cache-Control", "no-cache");
        ws.Options.SetRequestHeader("Origin", "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold");
        ws.Options.SetRequestHeader(
            "User-Agent",
            $"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{ChromiumMajorVersion}.0.0.0 Safari/537.36 Edg/{ChromiumMajorVersion}.0.0.0");
        ws.Options.SetRequestHeader("Accept-Encoding", "gzip, deflate, br, zstd");
        ws.Options.SetRequestHeader("Accept-Language", "en-US,en;q=0.9");
        ws.Options.SetRequestHeader("Cookie", $"muid={muid};");

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(10));

        await ws.ConnectAsync(wssUri, SharedWsInvoker, cts.Token);

        var timestamp = DateTime.UtcNow.ToString("R");
        var configMsg =
            $"X-Timestamp:{timestamp}\r\n" +
            "Content-Type:application/json; charset=utf-8\r\n" +
            "Path:speech.config\r\n\r\n" +
            "{\"context\":{\"synthesis\":{\"audio\":{\"metadataoptions\":{\"sentenceBoundaryEnabled\":\"false\",\"wordBoundaryEnabled\":\"false\"},\"outputFormat\":\"audio-24khz-96kbitrate-mono-mp3\"}}}}\r\n";

        await ws.SendAsync(
            Encoding.UTF8.GetBytes(configMsg),
            WebSocketMessageType.Text,
            true,
            cts.Token);

        var escapedText = SecurityElement.Escape(text) ?? string.Empty;
        var requestId = Guid.NewGuid().ToString("N");
        var ssml =
            "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>" +
            $"<voice name='{voice}'>" +
            $"<prosody pitch='{pitch}' rate='{rate}' volume='+25%'>" +
            escapedText +
            "</prosody></voice></speak>";

        var ssmlMsg =
            $"X-RequestId:{requestId}\r\n" +
            "Content-Type:application/ssml+xml\r\n" +
            $"X-Timestamp:{timestamp}Z\r\n" +
            "Path:ssml\r\n\r\n" +
            ssml;

        await ws.SendAsync(
            Encoding.UTF8.GetBytes(ssmlMsg),
            WebSocketMessageType.Text,
            true,
            cts.Token);

        using var audioStream = new MemoryStream();
        using var frameBuffer = new MemoryStream();
        var buffer = new byte[16384];

        while (ws.State == WebSocketState.Open)
        {
            frameBuffer.SetLength(0);
            WebSocketReceiveResult result;
            do
            {
                result = await ws.ReceiveAsync(buffer, cts.Token);
                if (result.MessageType == WebSocketMessageType.Close)
                    break;
                frameBuffer.Write(buffer, 0, result.Count);
            } while (!result.EndOfMessage);

            if (result.MessageType == WebSocketMessageType.Close)
                break;

            var messageBytes = frameBuffer.ToArray();
            if (result.MessageType == WebSocketMessageType.Text)
            {
                var messageText = Encoding.UTF8.GetString(messageBytes);
                if (messageText.Contains("Path:turn.end", StringComparison.Ordinal))
                {
                    break;
                }
            }
            else if (result.MessageType == WebSocketMessageType.Binary)
            {
                if (messageBytes.Length > 2)
                {
                    int headerLen = (messageBytes[0] << 8) | messageBytes[1];
                    int audioStartIndex = 2 + headerLen;
                    if (audioStartIndex < messageBytes.Length)
                    {
                        var headerText = Encoding.ASCII.GetString(messageBytes, 2, headerLen);
                        if (headerText.Contains("Path:audio", StringComparison.OrdinalIgnoreCase))
                        {
                            audioStream.Write(messageBytes, audioStartIndex, messageBytes.Length - audioStartIndex);
                        }
                    }
                }
            }
        }

        return audioStream.ToArray();
    }

    private static async Task SyncClockSkewAsync(CancellationToken cancellationToken)
    {
        try
        {
            using var req = new HttpRequestMessage(
                HttpMethod.Head,
                $"https://{BaseUrl}/voices/list?trustedclienttoken={TrustedClientToken}");
            req.Headers.UserAgent.ParseAdd(
                $"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{ChromiumMajorVersion}.0.0.0 Safari/537.36 Edg/{ChromiumMajorVersion}.0.0.0");
            using var res = await _httpClient.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            if (res.Headers.Date.HasValue)
            {
                var serverUnix = res.Headers.Date.Value.ToUnixTimeSeconds();
                var localUnix = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                _clockSkewSeconds = serverUnix - localUnix;
            }
        }
        catch
        {
            // ignore
        }
    }

    private static async Task<byte[]?> SynthesizeFallbackAsync(string text, CancellationToken cancellationToken)
    {
        try
        {
            var trimmed = text.Length > 200 ? text[..200] : text;
            var url = $"https://translate.googleapis.com/translate_tts?ie=UTF-8&q={Uri.EscapeDataString(trimmed)}&tl=en&client=tw-ob";
            using var req = new HttpRequestMessage(HttpMethod.Get, url);
            req.Headers.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            using var res = await _httpClient.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            if (!res.IsSuccessStatusCode)
                return null;
            return await res.Content.ReadAsByteArrayAsync(cancellationToken);
        }
        catch
        {
            return null;
        }
    }

    private static string GenerateSecMsGec()
    {
        double ticks = DateTimeOffset.UtcNow.ToUnixTimeSeconds() + _clockSkewSeconds;
        ticks += WinEpoch;
        ticks -= ticks % 300.0;
        ticks *= 10_000_000.0;
        var strToHash = $"{ticks:F0}{TrustedClientToken}";
        var hash = SHA256.HashData(Encoding.ASCII.GetBytes(strToHash));
        return Convert.ToHexString(hash);
    }

    private static string NormalizeVoice(string? voice)
    {
        if (string.IsNullOrWhiteSpace(voice))
            return DefaultBinoVoice;

        var trimmed = voice.Trim();
        if (SafeVoiceRegex.IsMatch(trimmed) && trimmed.EndsWith("Neural", StringComparison.Ordinal))
            return trimmed;

        return DefaultBinoVoice;
    }

    private static string NormalizeProsodyParam(string? param, string fallback)
    {
        if (string.IsNullOrWhiteSpace(param))
            return fallback;
        var trimmed = param.Trim();
        return SafeRatePitchRegex.IsMatch(trimmed) ? trimmed : fallback;
    }

    private static string RemoveIncompatibleCharacters(string input)
    {
        if (string.IsNullOrEmpty(input))
            return string.Empty;

        var sb = new StringBuilder(input.Length);
        foreach (var ch in input)
        {
            int code = ch;
            if ((code >= 0 && code <= 8) || (code >= 11 && code <= 12) || (code >= 14 && code <= 31))
                sb.Append(' ');
            else
                sb.Append(ch);
        }
        return sb.ToString();
    }

    private static string ComputeCacheHash(string input)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(bytes).ToLowerInvariant()[..32];
    }
}
