"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendMessage } from '@/actions/chat'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, User, X, MessageCircle, RotateCw, Sparkles } from 'lucide-react';

// --- 1. Helper: Format AI Text ---
const FormatMessage = ({ content }) => {
  const paragraphs = content.split('\n');
  return (
    <div className="space-y-2">
      {paragraphs.map((p, i) => {
        if (p.trim().startsWith('* ')) {
            return (
                <li key={i} className="ml-4 list-disc marker:text-green-600 pl-1">
                     <span dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/^\* /, '') }} />
                </li>
            )
        }
        return (
          <p key={i} className="min-h-[1rem]" dangerouslySetInnerHTML={{ 
            __html: p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
          }} />
        );
      })}
    </div>
  );
};

// --- 2. Animated Chat Icon (Restored & Improved) ---
const tooltipMessages = [
  "Namaskar! 🙏", 
  "Need help selling? 🌾", 
  "Ask about prices 📈", 
  "I am Krishi Mitra 🤖"
];

function ChatIcon({ onClick, isOpen }) {
  const [msgIndex, setMsgIndex] = useState(0);

  // Cycle through messages
  useEffect(() => {
    if (!isOpen) {
      const interval = setInterval(() => {
        setMsgIndex((prev) => (prev + 1) % tooltipMessages.length);
      }, 3000); // Change every 3 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Cycling Tooltip Bubble */}
      <AnimatePresence mode="wait">
        {!isOpen && (
            <motion.div
                key={msgIndex} // Key change triggers animation
                initial={{ opacity: 0, y: 10, x: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-24 right-0 bg-white text-gray-800 px-4 py-2 rounded-xl shadow-xl border border-green-100 text-sm font-bold whitespace-nowrap z-40 mb-1 mr-1"
            >
                {tooltipMessages[msgIndex]}
                {/* Tiny arrow pointing down */}
                <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-b border-r border-green-100 transform rotate-45"></div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Pulsing Button */}
      <motion.button
        onClick={onClick}
        className="relative p-4 bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-full shadow-2xl hover:shadow-green-500/50 transition-all z-50 flex items-center justify-center border-4 border-white/20"
        aria-label="Chat with Krishi Mitra"
        
        // Continuous Pulse Animation
        animate={{ 
            scale: isOpen ? 1 : [1, 1.05, 1],
            boxShadow: isOpen ? "0px 0px 0px rgba(0,0,0,0)" : [
                "0 10px 15px -3px rgba(22, 163, 74, 0.3)", 
                "0 20px 25px -5px rgba(22, 163, 74, 0.5)", 
                "0 10px 15px -3px rgba(22, 163, 74, 0.3)"
            ]
        }}
        transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <AnimatePresence mode="wait">
            {isOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                    <X className="w-7 h-7" />
                </motion.div>
            ) : (
                <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                    <MessageCircle className="w-7 h-7" />
                </motion.div>
            )}
        </AnimatePresence>

        {/* Notification Dot (Ping Effect) */}
        {!isOpen && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-lime-500 border-2 border-white"></span>
          </span>
        )}
      </motion.button>
    </div>
  );
}

// --- 3. Language Selection ---
function LanguageSelection({ onSelect }) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-6">
            <div className="bg-green-100 p-4 rounded-full animate-bounce-slow">
                <Sparkles className="w-8 h-8 text-green-600" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-900">Welcome to Krishi Mitra</h3>
                <p className="text-gray-500 text-sm mt-1">Select your language to start</p>
            </div>
            <div className="grid w-full gap-3">
                {['English', 'Hindi', 'Marathi'].map((lang) => (
                    <Button 
                        key={lang} 
                        onClick={() => onSelect(lang.toLowerCase())} 
                        variant="outline" 
                        className="w-full hover:border-green-500 hover:text-green-600 hover:bg-green-50 h-12 text-base transition-all border-gray-200"
                    >
                        {lang === 'English' ? 'English' : lang === 'Hindi' ? 'हिंदी (Hindi)' : 'मराठी (Marathi)'}
                    </Button>
                ))}
            </div>
        </div>
    );
}

// --- 4. Main Chatbot ---
export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState(null);
  
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
    if (isOpen && !isLoading && inputRef.current) {
        inputRef.current.focus();
    }
  }, [messages, isLoading, isOpen]);

  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    const welcomeText = lang === 'hindi' ? "नमस्ते! मैं कृषि मित्र हूँ। मैं आपकी क्या मदद कर सकता हूँ?" :
                        lang === 'marathi' ? "नमस्कार! मी कृषी मित्र आहे. मी तुम्हाला कशी मदत करू शकतो?" :
                        "Hello! I am Krishi Mitra. How can I assist you today?";
    setMessages([{ role: "model", content: welcomeText }]);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const result = await sendMessage(messages, input, language);

    if (result.success) {
      setMessages((prev) => [...prev, { role: "model", content: result.message }]);
    } else {
      setMessages((prev) => [...prev, { role: "model", content: "Connection error. Please try again." }]);
    }
    setIsLoading(false);
  };

  const handleReset = () => {
    setLanguage(null);
    setMessages([]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-6 w-[350px] sm:w-[400px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 flex items-center justify-between shadow-md z-10 text-white">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                    <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-base tracking-wide">Krishi Mitra</h3>
                    <div className="flex items-center gap-1.5 opacity-90">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-300 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-400"></span>
                        </span>
                        <span className="text-[10px] font-medium uppercase tracking-wider">AI Online</span>
                    </div>
                </div>
              </div>
              <div className="flex gap-1">
                {language && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20 rounded-full" onClick={handleReset} title="Reset Chat">
                        <RotateCw className="w-4 h-4" />
                    </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20 rounded-full" onClick={() => setIsOpen(false)}>
                    <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
                {!language ? (
                    <LanguageSelection onSelect={handleLanguageSelect} />
                ) : (
                    <>
                        {messages.map((msg, i) => (
                            <motion.div 
                                key={i} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'model' && (
                                    <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                                        <Bot size={16} className="text-green-600"/>
                                    </div>
                                )}
                                
                                <div className={`p-3.5 rounded-2xl text-sm max-w-[85%] shadow-sm leading-relaxed ${
                                    msg.role === 'user' 
                                        ? 'bg-green-600 text-white rounded-br-none' 
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                }`}>
                                    {msg.role === 'model' ? <FormatMessage content={msg.content} /> : msg.content}
                                </div>

                                {msg.role === 'user' && (
                                     <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                                        <User size={16} className="text-green-700"/>
                                     </div>
                                )}
                            </motion.div>
                        ))}
                        
                        {isLoading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 justify-start">
                                <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                    <Bot size={16} className="text-green-600"/>
                                </div>
                                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1.5 items-center">
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                                </div>
                            </motion.div>
                        )}
                        <div ref={scrollRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            {language && (
                <div className="p-3 bg-white border-t border-gray-100">
                    <form onSubmit={handleSend} className="relative flex items-center gap-2">
                        <Input 
                            ref={inputRef} 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={language === 'hindi' ? "यहाँ टाइप करें..." : "Type a message..."}
                            className="pr-12 rounded-full bg-gray-100 border-transparent focus:bg-white focus:border-green-200 focus:ring-2 focus:ring-green-100 transition-all h-12 text-base shadow-inner"
                            disabled={false} 
                            autoFocus
                        />
                        <Button 
                            type="submit" 
                            size="icon" 
                            disabled={isLoading || !input.trim()} 
                            className="absolute right-1.5 top-1.5 h-9 w-9 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                        >
                            <Send size={16} />
                        </Button>
                    </form>
                </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button */}
      <ChatIcon isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
    </div>
  );
}