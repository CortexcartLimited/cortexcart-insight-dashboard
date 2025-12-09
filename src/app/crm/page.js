'use client';
import { useState, useEffect } from 'react';
import Layout from '@/app/components/Layout';
import { UserCircleIcon, PaperAirplaneIcon, PhoneIcon, EllipsisVerticalIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

export default function CrmPage() {
    // 1. Defined all necessary state
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState(''); // <--- Added this

    // 2. Fetch Conversations on Load
    useEffect(() => {
        fetch('/api/crm/conversations')
            .then(res => res.json())
            .then(data => {
                setChats(data);
                if (data.length > 0) setSelectedChat(data[0]);
            })
            .catch(err => console.error("Failed to load chats", err));
    }, []);

    // 3. Fetch Messages when a Chat is selected
    useEffect(() => {
        if (!selectedChat) return;
        // Optional: You can create an API route to fetch specific messages for a chat later
        // For now, we clear messages or keep them empty until you build '/api/crm/messages/[id]'
        setMessages([]); 
    }, [selectedChat]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        
        const tempId = Date.now();
        const text = newMessage;
        
        // Optimistic Update
        const optimisticMsg = {
            id: tempId,
            direction: 'outbound',
            text: text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');
        
        try {
            const res = await fetch('/api/crm/send-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    conversationId: selectedChat.id, 
                    text: text 
                })
            });

            if (!res.ok) throw new Error('Failed to send');

        } catch (err) {
            console.error(err);
            alert("Failed to send message");
        }
    };

    return (
        <Layout>
            <div className="h-[calc(100vh-140px)] flex bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                
                {/* --- Left Sidebar: Chat List --- */}
                <div className="w-1/3 border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-600" /> Inbox
                        </h2>
                        <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">
                            WhatsApp Active
                        </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        {/* FIX: Loop through 'chats', not 'MOCK_CHATS' */}
                        {chats.length === 0 && <div className="p-4 text-gray-400 text-sm text-center">No active conversations.</div>}
                        
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
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-gray-500 truncate w-3/4">{chat.last_message}</p>
                                    {chat.unread_count > 0 && (
                                        <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            {chat.unread_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- Right Main: Message Thread --- */}
                <div className="w-2/3 flex flex-col">
                    {/* FIX: Check if selectedChat exists before rendering details */}
                    {selectedChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                        <UserCircleIcon className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{selectedChat.contact_name || selectedChat.external_id}</h3>
                                        <p className="text-xs text-green-600 flex items-center gap-1 font-medium">
                                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> WhatsApp
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 text-gray-400 hover:text-purple-600 transition"><PhoneIcon className="w-5 h-5" /></button>
                                    <button className="p-2 text-gray-400 hover:text-gray-600 transition"><EllipsisVerticalIcon className="w-5 h-5" /></button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                                {messages.length === 0 && <div className="text-center text-gray-400 text-sm mt-10">No messages yet.</div>}
                                
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-sm ${
                                            msg.direction === 'outbound' 
                                                ? 'bg-purple-600 text-white rounded-br-none' 
                                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                        }`}>
                                            <p className="leading-relaxed">{msg.content || msg.text}</p>
                                            <p className={`text-[10px] mt-1 text-right ${msg.direction === 'outbound' ? 'text-purple-200' : 'text-gray-400'}`}>
                                                {msg.time || new Date(msg.created_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white border-t border-gray-200">
                                <form onSubmit={handleSendMessage} className="flex gap-3">
                                    <input 
                                        type="text" 
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..." 
                                        className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                                    />
                                    <button 
                                        type="submit" 
                                        className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl transition shadow-md hover:shadow-lg active:scale-95 transform"
                                    >
                                        <PaperAirplaneIcon className="w-6 h-6" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        // Empty State if no chat selected
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                            <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 text-gray-300" />
                            <p>Select a conversation to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}