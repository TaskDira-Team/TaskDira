using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;

namespace TaskDira.Api.Services;

/// <summary>
/// Keeps one WebSocket per open app screen and pings them all with "changed"
/// whenever data is saved, so every screen refreshes right away instead of
/// waiting for its next poll. Only a ping is sent, never the data itself.
/// </summary>
public sealed class LiveUpdates
{
    private const int MaxTokenBytes = 4096;
    private static readonly byte[] ChangedMessage = Encoding.UTF8.GetBytes("changed");

    private readonly ConcurrentDictionary<Guid, Client> _clients = new();

    private sealed record Client(WebSocket Socket, SemaphoreSlim SendLock);

    public async Task HandleAsync(HttpContext context, IAuthService auth)
    {
        using var socket = await context.WebSockets.AcceptWebSocketAsync();
        var aborted = context.RequestAborted;

        // Browsers can't send headers on a WebSocket, so the session token
        // arrives as the first message instead of in the URL.
        var token = await ReceiveTextAsync(socket, aborted);
        if (token is null || await auth.ValidateTokenAsync(token, aborted) is null)
        {
            await CloseQuietlyAsync(socket, WebSocketCloseStatus.PolicyViolation, "unauthorized");
            return;
        }

        var id = Guid.NewGuid();
        var client = new Client(socket, new SemaphoreSlim(1, 1));
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

    public void NotifyChanged()
    {
        foreach (var (id, client) in _clients)
        {
            _ = SendAsync(id, client);
        }
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
