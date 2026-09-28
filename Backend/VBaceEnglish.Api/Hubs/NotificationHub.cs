using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace VBaceEnglish.Api.Hubs;

public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");

            if (Context.User?.IsInRole("Admin") == true)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "admins");
            }
        }

        await base.OnConnectedAsync();
    }

    public async Task SendNotification(string userId, string message)
    {
        await Clients.Group($"user_{userId}").SendAsync("ReceiveNotification", message);
    }

    public async Task BroadcastProgress(string userName, string testTitle, int percent)
    {
        await Clients.All.SendAsync("UserProgressUpdated", new { userName, testTitle, percent });
    }
}
