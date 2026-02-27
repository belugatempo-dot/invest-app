type Listener = (data: string) => void;

class SSEBroadcaster {
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const listener of this.listeners) {
      listener(payload);
    }
  }
}

// Singleton — shared across all route handlers in the same process
export const sse = new SSEBroadcaster();
