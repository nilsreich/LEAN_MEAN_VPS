import { useEffect, useRef, useState } from 'hono/jsx';
import { Button, Card, Input } from '../../../core/ui';

interface Message {
  id: number;
  content: string;
  username: string;
  createdAt: string;
}

export default function ChatIsland() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-Scroll nach unten
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 1. Initial History Load
  useEffect(() => {
    fetch('/api/chat/history')
      .then(res => res.json())
      .then(data => {
        if (data.success) setMessages(data.data);
      });
  }, []);

  // 2. SSE Connection (Realtime)
  useEffect(() => {
    const evtSource = new EventSource('/api/chat/stream');

    evtSource.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data);
      setMessages(prev => {
        // Dubletten vermeiden (falls durch History schon geladen)
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      evtSource.close();
    };
  }, []);

  const sendMessage = async (e: any) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Optimistic UI (optional, hier weggelassen für Simplicity)

    await fetch('/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // CSRF Token holen
        'X-CSRF-Token': document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1] || ''
      },
      body: JSON.stringify({ content: input })
    });

    setInput('');
  };

  return (
    <Card className="h-[500px] flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-4 p-2" ref={scrollRef}>
        {messages.map(msg => (
          <div key={msg.id} className="bg-white/5 p-3 rounded-lg animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-sm font-bold text-primary">{msg.username}</span>
              <span className="text-[10px] text-text-muted">{new Date(msg.createdAt).toLocaleTimeString()}</span>
            </div>
            <p className="text-text">{msg.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="mt-4 flex gap-2 pt-4 border-t border-white/10">
        <Input
          value={input}
          onChange={(e: any) => setInput(e.target.value)}
          placeholder="Nachricht schreiben..."
          className="flex-1"
        />
        <Button type="submit">Senden</Button>
      </form>
    </Card>
  );
}
