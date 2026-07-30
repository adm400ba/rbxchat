export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    const [client, server] = Object.values(new WebSocketPair());
    this.state.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws, message) {
    const sockets = this.state.getWebSockets();
    for (let s of sockets) {
      s.send(message);
    }
  }

  async webSocketClose(ws, code, reason, wasClean) {
    ws.close(code, reason);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const roomName = url.searchParams.get("room") || "global";
    
    const id = env.CHAT_ROOM.idFromName(roomName);
    const stub = env.CHAT_ROOM.get(id);

    return stub.fetch(request);
  }
};
