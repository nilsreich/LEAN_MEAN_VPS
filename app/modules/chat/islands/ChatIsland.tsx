import { useEffect, useRef, useState } from 'hono/jsx';
import { t } from '../../../core/i18n/client';
import { Button, Card, Input } from '../../../core/ui';

interface Message {
  id: number;
  content: string;
  username: string;
  createdAt: string;
  room?: string;
}

export default function ChatIsland() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [room, setRoom] = useState('general');
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-Scroll nach unten
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // WebSocket Connection
  useEffect(() => {
    setStatus('connecting');
    // Protokoll (ws:// oder wss://) automatisch erkennen
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/chat/ws?room=${room}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      // History laden beim Wechseln des Raumes (optional)
      // fetch(`/api/chat/history?room=${room}`).then(...)
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'message') {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(), // Temporäre ID
              content: msg.content,
              username: msg.username || 'Anon',
              createdAt: msg.createdAt,
              room: msg.room,
            },
          ]);
        }
      } catch (e) {
        console.error('WS Parse Error', e);
      }
    };

    ws.onclose = () => {
      setStatus('disconnected');
    };

    return () => {
      ws.close();
    };
  }, [room]);

  const sendMessage = (e: Event) => {
    e.preventDefault();
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        content: input,
        room: room,
      }),
    );

    setInput('');
  };

  return (
    <Card className="h-[600px] flex flex-col">
      {/* Header & Room Selector */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
            {t(`chat.status.${status}`)}
          </span>
        </div>
        <select
          value={room}
          onChange={(e) => {
            setMessages([]);
            setRoom((e.target as HTMLSelectElement).value);
          }}
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-text outline-none focus:border-primary/50"
        >
          <option value="general">#general</option>
          <option value="dev">#dev</option>
          <option value="random">#random</option>
        </select>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 p-2" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div
            key={i}
            className="bg-white/5 p-3 rounded-lg animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-sm font-bold text-primary">{msg.username}</span>
              <span className="text-[10px] text-text-muted">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-text break-words">{msg.content}</p>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="mt-4 flex gap-2 pt-4 border-t border-white/10">
        <Input
          value={input}
          onChange={(e) => setInput((e.target as HTMLInputElement).value)}
          placeholder={`${t('chat.placeholder')}${room}...`}
          className="flex-1"
          disabled={status !== 'connected'}
        />
        <Button type="submit" disabled={status !== 'connected'}>
          {t('chat.send')}
        </Button>
      </form>
    </Card>
  );
}
