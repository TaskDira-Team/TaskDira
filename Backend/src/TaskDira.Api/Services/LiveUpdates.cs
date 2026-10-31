using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using TaskDira.Api.Repositories;

namespace TaskDira.Api.Services;

/// <summary>
/// Keeps one WebSocket per open app screen and pings it with "changed" when
/// something in one of its homes is saved, so the screen refreshes right away
/// instead of waiting for its next poll. Only a ping is sent, never the data.
/// </summary>
public sealed class LiveUpdates
{
    private const int MaxTokenBytes = 4096;
    private const int MaxHouseholdsPerUser = 50;
    private static readonly byte[] ChangedMessage = Encoding.UTF8.GetBytes("changed");

    private readonly ConcurrentDictionary<Guid, Client> _clients = new();

    private sealed class Client(WebSocket socket, int userId, IReadOnlySet<int> households)
    {
        public WebSocket Socket { get; } = socket;
        public int UserId { get; } = userId;
        public SemaphoreSlim SendLock { get; } = new(1, 1);
        public volatile IReadOnlySet<int> Households = households;
        public int PingScheduled;
    }

    public async Task HandleAsync(HttpContext context, IAuthService auth, IHouseholdRepository households)
    {
        using var socket = await context.WebSockets.AcceptWebSocketAsync();
        var aborted = context.RequestAborted;

        // Browsers can't send headers on a WebSocket, so the session token
        // arrives as the first message instead of in the URL.
        var token = await ReceiveTextAsync(socket, aborted);
        var userId = token is null ? null : await auth.ValidateTokenAsync(token, aborted);
        if (userId is null)
        {
            await CloseQuietlyAsync(socket, WebSocketCloseStatus.PolicyViolation, "unauthorized");
            return;
        }

        var id = Guid.NewGuid();
        var client = new Client(socket, userId.Value, await LoadHouseholdsAsync(households, userId.Value, aborted));
        _clients[id] = client;
        try
        {
            var buffer = new byte[256];
            while (socket.State == WebSocketState.Open)
            {
                var result = await socket.ReceiveAsync(buffer, aborted);
                if (result.MessageType == WebSocketMessageType.Close) break;
            }
        }
        catch (Exception ex) when (ex is WebSocketException or OperationCanceledException)
        {
            // Tab closed or network dropped; the client reconnects on its own.
        }
        finally
        {
            _clients.TryRemove(id, out _);
            await CloseQuietlyAsync(socket, WebSocketCloseStatus.NormalClosure, "bye");
            client.SendLock.Dispose();
        }
    }

    /// <summary>
    /// Called after a signed-in user saves something: pings everyone who shares
    /// a home with them. Their own home list is reloaded first, so a home they
    /// just created or joined is included.
    /// </summary>
    public async Task NotifyHomesOfAsync(int userId, IHouseholdRepository households, CancellationToken cancellationToken)
    {
        var homes = await LoadHouseholdsAsync(households, userId, cancellationToken);
        foreach (var client in _clients.Values)
        {
            if (client.UserId == userId) client.Households = homes;
        }
        Notify(client => client.Households.Overlaps(homes));
    }

    /// <summary>Pings every open screen (used for rare anonymous saves such as joining by invite).</summary>
    public void NotifyEveryone() => Notify(_ => true);

    // Bursts of saves (a busy home) collapse into one ping per screen.
    private static readonly TimeSpan PingCoalesceWindow = TimeSpan.FromMilliseconds(300);

    private void Notify(Func<Client, bool> shouldPing)
    {
        foreach (var (id, client) in _clients)
        {
            if (shouldPing(client) && Interlocked.Exchange(ref client.PingScheduled, 1) == 0)
            {
                _ = PingSoonAsync(id, client);
            }
        }
    }

    private async Task PingSoonAsync(Guid id, Client client)
    {
        await Task.Delay(PingCoalesceWindow);
        Interlocked.Exchange(ref client.PingScheduled, 0);
        await SendAsync(id, client);
    }

    private static async Task<IReadOnlySet<int>> LoadHouseholdsAsync(IHouseholdRepository households, int userId, CancellationToken cancellationToken)
    {
        var page = await households.GetPageForUserAsync(userId, 0, MaxHouseholdsPerUser, cancellationToken);
        return page.Select(h => h.Id).ToHashSet();
    }

    private async Task SendAsync(Guid id, Client client)
    {
        try
        {
            await client.SendLock.WaitAsync();
            try
            {
                if (client.Socket.State == WebSocketState.Open)
                {
                    await client.Socket.SendAsync(ChangedMessage, WebSocketMessageType.Text, true, CancellationToken.None);
                }
            }
            finally
            {
                client.SendLock.Release();
            }
        }
        catch (Exception ex) when (ex is WebSocketException or ObjectDisposedException or OperationCanceledException)
        {
            _clients.TryRemove(id, out _);
        }
    }

    private static async Task<string?> ReceiveTextAsync(WebSocket socket, CancellationToken cancellationToken)
    {
        var buffer = new byte[MaxTokenBytes];
        var count = 0;
        try
        {
            while (true)
            {
                if (count >= buffer.Length) return null;
                var result = await socket.ReceiveAsync(buffer.AsMemory(count), cancellationToken);
                if (result.MessageType != WebSocketMessageType.Text) return null;
                count += result.Count;
                if (result.EndOfMessage) break;
            }
        }
        catch (Exception ex) when (ex is WebSocketException or OperationCanceledException)
        {
            return null;
        }

        var text = Encoding.UTF8.GetString(buffer, 0, count).Trim();
        return text.Length == 0 ? null : text;
    }

    private static async Task CloseQuietlyAsync(WebSocket socket, WebSocketCloseStatus status, string reason)
    {
        if (socket.State is not (WebSocketState.Open or WebSocketState.CloseReceived)) return;
        try
        {
            await socket.CloseAsync(status, reason, CancellationToken.None);
        }
        catch (Exception ex) when (ex is WebSocketException or OperationCanceledException)
        {
        }
    }
}
