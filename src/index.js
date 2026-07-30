export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.sessions = [];
  }

  async fetch(request) {
    const { 0: client, 1: server } = new WebSocketPair();
    server.accept();
    
    this.sessions.push(server);

    server.addEventListener("message", (msg) => {
      this.sessions.forEach(session => {
        if (session !== server) {
          try {
            session.send(msg.data);
          } catch (e) {}
        }
      });
    });

    let cleanup = () => {
      this.sessions = this.sessions.filter(s => s !== server);
    };
    
    server.addEventListener("close", cleanup);
    server.addEventListener("error", cleanup);

    return new Response(null, { status: 101, webSocket: client });
  }
}

export default {
  async fetch(request, env) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const url = new URL(request.url);
    const roomName = url.searchParams.get("room") || "global";

    let id = env.CHAT_ROOM.idFromName(roomName);
    let stub = env.CHAT_ROOM.get(id);
    
    return stub.fetch(request);
  }
};
