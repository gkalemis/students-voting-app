from collections import defaultdict
from fastapi import WebSocket


class SessionHub:
    def __init__(self):
        self.connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, public_id: str, websocket: WebSocket):
        await websocket.accept()
        self.connections[public_id].add(websocket)

    def disconnect(self, public_id: str, websocket: WebSocket):
        self.connections[public_id].discard(websocket)
        if not self.connections[public_id]:
            self.connections.pop(public_id, None)

    async def broadcast(self, public_id: str, event: str):
        dead = []
        for socket in list(self.connections.get(public_id, ())):
            try:
                await socket.send_json({"type": event})
            except Exception:
                dead.append(socket)
        for socket in dead:
            self.disconnect(public_id, socket)


hub = SessionHub()
