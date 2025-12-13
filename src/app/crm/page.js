'use client';
import { useState, useEffect, useRef } from 'react';
import Layout from '@/app/components/Layout';
import { UserCircleIcon, PaperAirplaneIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

export default function CrmPage() {
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]); // This was staying empty!
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Auto-scroll ref
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // 1. Fetch Conversations (Inbox List)
    const fetchConversations = async () => {
        try {
            const res = await fetch('/api/crm/conversations');
            const data = await res.json();
            if (Array.isArray(data)) {
                setChats(data);
                // Auto-select first chat if none selected
                if (!selectedChat && data.length > 0) setSelectedChat(data[0]);
            }
        } catch (err) {
            console.error("Inbox Load Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
        // Optional: Poll inbox every 10s to see new chats
        const interval = setInterval(fetchConversations, 10000);
        return () => clearInterval(interval);
    }, []);

    // ==================================================================
    // 2. CRITICAL FIX: Fetch Messages when 'selectedChat' changes
    // ==================================================================
    useEffect(() => {
        if (!selectedChat) return;

        const fetchMessages = async () => {
            try {
                // Assuming you have this endpoint (If 404, we will create it next)
                const res = await fetch(`/api/crm/messages?conversationId=${selectedChat.id}`);
                const data = await res.json();
                
                if (Array.isArray(data)) {
                    setMessages(data); // <--- Populates the right pane!
                    setTimeout(scrollToBottom, 100);
                }
            } catch (err) {
                console.error("Message Load Error:", err);
            }
        };

        fetchMessages();

        // POLL MESSAGES: Check for new replies every 3 seconds
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);

    }, [selectedChat]); // <--- Runs whenever you click a different user


    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat) return;
        
        // Optimistic UI Update (Show immediately)
        const tempMsg = {
            id: Date.now(),
            direction: 'outbound',
            content: newMessage,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);
        setNewMessage('');
        setTimeout(scrollToBottom, 100);
        
        try {
            await fetch('/api/crm/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    conversationId: selectedChat.id, 
                    text: tempMsg.content 
                })
            });
            // Refresh to get the real DB ID and timestamp
            // fetchMessages(); 
        } catch (err) {
            alert("Error sending message");
        }
    };

    return (
        <Layout>
            <div className="h-[calc(100vh-140px)] flex bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                
                {/* --- Left Sidebar --- */}
                <div className="w-1/3 border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-600" /> Inbox
                        </h2>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        {loading && <div className="p-4 text-sm text-gray-500">Loading chats...</div>}
                        
                        {chats.map(chat => (
                            <div 
                                key={chat.id}
                                onClick={() => setSelectedChat(chat)}
                                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${selectedChat?.id === chat.id ? 'bg-purple-50 border-l-4 border-l-purple-600' : ''}`}
                            >
                                <div className="flex justify-between mb-1">
                                    <span className="font-semibold text-gray-900">{chat.contact_name || chat.external_id}</span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(chat.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 truncate">{chat.last_message}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- Right Chat Area --- */}
                <div className="w-2/3 flex flex-col bg-gray-50">
                    {selectedChat ? (
                        <>
                            <div className="p-4 bg-white border-b border-gray-200 shadow-sm z-10 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                        <UserCircleIcon className="w-6 h-6 text-gray-500" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">{selectedChat.contact_name || selectedChat.external_id}</h3>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
                                {messages.length === 0 && <div className="text-center text-gray-400 mt-10">Start the conversation...</div>}
                                
                                {messages.map((msg, idx) => (
                                    <div key={msg.id || idx} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${
                                            msg.direction === 'outbound' 
                                                ? 'bg-purple-600 text-white rounded-br-none' 
                                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                        }`}>
                                            <p>{msg.content || msg.text}</p>
                                            <p className={`text-[10px] mt-1 text-right ${msg.direction === 'outbound' ? 'text-purple-200' : 'text-gray-400'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {/* Invisible element to scroll to */}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-4 bg-white border-t border-gray-200">
                                <form onSubmit={handleSendMessage} className="flex gap-3">
                                    <input 
                                        type="text" 
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..." 
                                        className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                    <button type="submit" className="bg-purple-600 text-white p-3 rounded-xl hover:bg-purple-700">
                                        <PaperAirplaneIcon className="w-6 h-6" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            Select a chat to start messaging
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}