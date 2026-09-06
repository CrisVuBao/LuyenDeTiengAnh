using Microsoft.AspNetCore.SignalR;

namespace VBaceEnglish.Api.Hubs;

public class NotificationHub : Hub
{
    public async Task SendNotification(string userId, string message)
    {
        await Clients.User(userId).SendAsync("ReceiveNotification", message);
    }

    public async Task BroadcastProgress(string userName, string testTitle, int percent)
    {
        await Clients.All.SendAsync("UserProgressUpdated", new { userName, testTitle, percent });
    }
}

