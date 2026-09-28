using Microsoft.AspNetCore.SignalR;
using VBaceEnglish.Api.Hubs;
using VBaceEnglish.Application.Contracts.Services;

namespace VBaceEnglish.Api.Services;

public class SignalRNotificationDispatcher : IRealTimeNotificationDispatcher
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public SignalRNotificationDispatcher(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task SendToUserAsync(int userId, object notificationPayload)
    {
        await _hubContext.Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", notificationPayload);
    }

    public async Task SendToUsersAsync(IEnumerable<int> userIds, object notificationPayload)
    {
        var groups = userIds.Select(id => $"user_{id}").ToList();
        if (groups.Count > 0)
        {
            await _hubContext.Clients.Groups(groups).SendAsync("ReceiveNotification", notificationPayload);
        }
    }

    public async Task SendToAdminsAsync(object notificationPayload)
    {
        await _hubContext.Clients.Group("admins").SendAsync("ReceiveNotification", notificationPayload);
    }

    public async Task BroadcastAsync(object notificationPayload)
    {
        await _hubContext.Clients.All.SendAsync("ReceiveNotification", notificationPayload);
    }
}
