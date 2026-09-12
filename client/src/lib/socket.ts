import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let currentToken: string | null = null;

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:5000");

export const getSocket = (token?: string): Socket => {
  if (!socket || (token && token !== currentToken)) {
    if (socket) {
      socket.disconnect();
    }
    currentToken = token || null;

    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      console.log("[WebSocket] Connected to server:", socket?.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("[WebSocket] Connection error:", err.message);
    });
  }

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
};
