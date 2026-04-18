import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Settings, Trash2, Loader2 } from 'lucide-react';

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);

  const currentConv = conversations.find(c => c.id === currentConvId);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedConvs = localStorage.getItem('conversations');
      const savedApiKey = localStorage.getItem('claude-api-key');
      if (savedConvs) {
        const parsed = JSON.parse(savedConvs);
        setConversations(parsed);
        if (parsed.length > 0) setCurrentConvId(parsed[0].id);
      }
      if (savedApiKey) setApiKey(savedApiKey);
      else setShowSettings(true);
    }
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConv?.messages]);

  const sendMessage = async () => {
    if (!input.trim() || !apiKey || isLoading) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: input.trim() };
    let convId = currentConvId;

    if (!convId) {
      convId = Date.now().toString();
      const newConv = { id: convId, title: input.trim().slice(0, 30), messages: [] };
      setConversations(prev => [newConv, ...prev]);
      setCurrentConvId(convId);
    }

    setConversations(prev => prev.map(c => 
      c.id === convId ? { ...c, messages: [...c.messages, userMessage] } : c
    ));
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('https://anthropic.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'dangerously-allow-browser': 'true'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 4096,
          messages: [{ role: 'user', content: userMessage.content }]
        })
      });

      const data = await response.json();
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content[0].text
      };

      setConversations(prev => prev.map(c =>
        c.id === convId ? { ...c, messages: [...c.messages, assistantMessage] } : c
      ));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      <div className="w-80 bg-white border-r flex flex-col shrink-0">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-purple-600" />
            <h1 className="font-bold text-xl">Claude AI</h1>
          </div>
          <button onClick={() => {
            const id = Date.now().toString();
            setConversations([{ id, title: 'New Chat', messages: [] }, ...conversations]);
            setCurrentConvId(id);
          }} className="w-full bg-purple-600 text-white p-2 rounded-lg font-medium">
            + New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map(c => (
            <div key={c.id} onClick={() => setCurrentConvId(c.id)} className={`p-3 rounded-lg cursor-pointer flex justify-between group ${currentConvId === c.id ? 'bg-purple-50' : ''}`}>
              <span className="truncate text-sm font-medium">{c.title}</span>
              <Trash2 size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500" onClick={(e) => {
                e.stopPropagation();
                setConversations(conversations.filter(conv => conv.id !== c.id));
              }}/>
            </div>
          ))}
        </div>
        <div className="p-4 border-t">
          <button onClick={() => setShowSettings(true)} className="w-full p-2 hover:bg-slate-100 rounded-lg flex items-center justify-center gap-2">
            <Settings size={16} /> Settings
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white relative">
        {showSettings && (
          <div className="absolute inset-0 bg-white/90 z-50 flex items-center justify-center">
            <div className="p-8 border rounded-xl shadow-xl bg-white w-96">
              <h2 className="font-bold mb-4">API Key Required</h2>
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="w-full p-2 border rounded mb-4" placeholder="sk-ant-..." />
              <button onClick={() => { localStorage.setItem('claude-api-key', apiKey); setShowSettings(false); }} className="w-full bg-purple-600 text-white p-2 rounded-lg">Save Key</button>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {currentConv?.messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 rounded-2xl max-w-[80%] ${m.role === 'user' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                {m.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-6 border-t">
          <div className="flex gap-4 max-w-4xl mx-auto">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} className="flex-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-purple-500" placeholder="Ask Claude anything..." />
            <button onClick={sendMessage} disabled={isLoading} className="p-3 bg-purple-600 text-white rounded-xl">
              {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
              }

