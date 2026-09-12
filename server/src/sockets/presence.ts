class PresenceTracker {
  private activeSockets: Map<string, Set<string>> = new Map();

  userConnected(userId: string, socketId: string): number {
    if (!this.activeSockets.has(userId)) {
      this.activeSockets.set(userId, new Set());
    }
    this.activeSockets.get(userId)!.add(socketId);
    return this.getOnlineCount();
  }

  userDisconnected(userId: string, socketId: string): number {
    if (this.activeSockets.has(userId)) {
      const sockets = this.activeSockets.get(userId)!;
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.activeSockets.delete(userId);
      }
    }
    return this.getOnlineCount();
  }

  getOnlineCount(): number {
    return this.activeSockets.size;
  }

  isUserOnline(userId: string): boolean {
    return this.activeSockets.has(userId);
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.activeSockets.keys());
  }
}

export const presenceTracker = new PresenceTracker();
