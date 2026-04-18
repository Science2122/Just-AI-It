import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Settings, Trash2, Loader2, Plus, Zap } from 'lucide-react';

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // --- PASTE YOUR API KEY BELOW ---
  const apiKey = 'YOUR_API_KEY_HERE'; 
  // --------------------------------

  const messagesEndRef = useRef(null);
  const currentConv = conversations.find(c => c.id === currentConvId);

  // Load history from device memory (Offline storage)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedConvs = localStorage.getItem('ai-it-history');
      if (savedConvs) {
        const parsed = JSON.parse(savedConvs);
        setConversations(parsed);
        if (parsed.length > 0) setCurrentConvId(parsed[0].id);
      }
    }
  }, []);

  // Save history automatically
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('ai-it-history', JSON.stringify(conversations));
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
      console.error("Connection error. Check your internet or API key.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0f1117] text-slate-200 overflow-hidden font-sans">
      {/* Sleek Sidebar */}
      <div className="w-72 bg-[#161922] border-r border-white/5 flex flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <h1 className="font-bold text-2xl text-white tracking-tight">Just AI It</h1>
          </div>
          
          <button 
            onClick={() => {
              const id = Date.now().toString();
              setConversations([{ id, title: 'New Session', messages: [] }, ...conversations]);
              setCurrentConvId(id);
            }} 
            className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all"
          >
            <Plus size={18} />
            <span className="font-medium text-sm">New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          {conversations.map(c => (
            <div 
              key={c.id} 
              onClick={() => setCurrentConvId(c.id)} 
              className={`p-3 rounded-xl cursor-pointer flex justify-between items-center group transition-colors ${currentConvId === c.id ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-white/5 text-slate-400'}`}
            >
              <span className="truncate text-xs font-medium">{c.title}</span>
              <Trash2 
                size={14} 
                className="opacity-0 group-hover:opacity-100 hover:text-red-400" 
                onClick={(e) => {
                  e.stopPropagation();
                  setConversations(conversations.filter(conv => conv.id !== c.id));
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Main Experience */}
      <div className="flex-1 flex flex-col bg-[#0f1117]">
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {!currentConv && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <Sparkles className="text-blue-400 w-12 h-12 mb-4" />
              <h3 className="text-white font-bold text-lg">System Ready</h3>
              <p className="text-xs mt-1">Start a new chat to begin.</p>
            </div>
          )}
          
          {currentConv?.messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' : 'bg-[#1c202b] text-slate-200 border border-white/5'}`}>
                {m.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Unified Input */}
        <div className="p-8 pt-0">
          <div className="max-w-3xl mx-auto flex gap-3 bg-[#1c202b] p-2 border border-white/10 rounded-2xl shadow-2xl focus-within:border-blue-500/50 transition-all">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
              className="flex-1 bg-transparent px-4 py-2 text-white outline-none text-sm" 
              placeholder="Type your command..." 
            />
            <button 
              onClick={sendMessage} 
              disabled={isLoading} 
              className={`p-3 rounded-xl transition-all ${isLoading ? 'bg-slate-800' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'}`}
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
                                        }
