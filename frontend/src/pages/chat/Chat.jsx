
import React, { useState, useEffect } from 'react';
import { chatAPI } from '../../services/api';
import './Chat.css';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Chat = () => {
    const { user } = useAuth();
    const { darkMode } = useTheme();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const socket = React.useRef(null);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.id);
            connectWebSocket(selectedConversation.id);
        }

        return () => {
            if (socket.current) {
                socket.current.close();
            }
        };
    }, [selectedConversation]);

    const connectWebSocket = (conversationId) => {
        // Close existing connection if any
        if (socket.current) {
            socket.current.close();
        }

        // Construct WebSocket URL
        // Assuming backend runs on localhost:8000. Adjust based on your environment config.
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Note: Using hardcoded localhost:8000 as per common dev setup. 
        // In production, this should be dynamic based on window.location.host
        const wsUrl = `${wsProtocol}//localhost:8000/ws/chat/${conversationId}/?token=${localStorage.getItem('access_token')}`;

        socket.current = new WebSocket(wsUrl);

        socket.current.onopen = () => {
            console.log('WebSocket Connected');
        };

        socket.current.onmessage = (e) => {
            const data = JSON.parse(e.data);
            console.log("WebSocket Message Received:", data);

            if (data.type === 'error') {
                alert("Connection Error: " + data.message);
            }

            if (data.type === 'chat_message') {
                const newMsg = {
                    id: Date.now(), // Temporary ID for list key
                    sender: data.sender_name, // Backend sends sender_name
                    content: data.message,
                    created_at: new Date().toISOString(), // Or use server timestamp if available
                    // Add other fields if necessary to match your Message model shape
                };
                setMessages((prevMessages) => [...prevMessages, newMsg]);
            }
        };

        socket.current.onclose = (e) => {
            console.error('Chat socket closed unexpectedly');
        };
    };

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const response = await chatAPI.getConversations();
            setConversations(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch conversations", err);
            setError("Failed to load conversations.");
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId) => {
        try {
            const response = await chatAPI.getMessages(conversationId);
            setMessages(response.data);
            // Mark as read immediately when fetching messages
            await chatAPI.markAsRead(conversationId);
        } catch (err) {
            console.error("Failed to fetch messages", err);
            // Optionally handle message fetch error specifically
        }
    };

    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to JPEG with 0.7 quality
                };
            };
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedConversation) return;

        try {
            if (file.size > 5 * 1024 * 1024) {
                alert("Image size too large. Please select an image under 5MB.");
                return;
            }

            if (socket.current && socket.current.readyState === WebSocket.OPEN) {
                const compressedBase64 = await compressImage(file);
                socket.current.send(JSON.stringify({ message: compressedBase64 }));
                // No need to manually fetchMessages, the onmessage handler will append it (echo)
            } else {
                alert("Connection lost. Please try again.");
            }
        } catch (err) {
            console.error("Failed to send image", err);
            alert("Failed to send image.");
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            // Send via WebSocket
            if (socket.current && socket.current.readyState === WebSocket.OPEN) {
                socket.current.send(JSON.stringify({ message: newMessage }));
                setNewMessage('');
            } else {
                alert("Connection not established. Please wait or refresh.");
            }
        } catch (err) {
            console.error("Failed to send message", err);
            alert("Failed to send message. The backend may not support sending messages yet.");
        }
    };

    const getOtherParticipantName = (conversation) => {
        // If current user is the customer, show seller name, and vice-versa
        // Adjust logic based on your auth user object structure
        if (user && user.username === conversation.customer_name) {
            return `${conversation.seller_name} (Seller)`;
        }
        return `${conversation.customer_name} (Customer)`;
    };

    const isImageUrl = (url) => {
        return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || (url.startsWith('http') && url.includes('/media/')) || url.startsWith('data:image/');
    };

    const renderMessageContent = (content) => {
        if (isImageUrl(content)) {
            return (
                <div className="message-image-container">
                    <img
                        src={content}
                        alt="Shared content"
                        className="message-image"
                        onClick={() => window.open(content, '_blank')}
                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', cursor: 'pointer' }}
                    />
                </div>
            );
        }
        return <div className="message-content">{content}</div>;
    };

    return (
        <div className={`chat-container ${darkMode ? 'dark-mode' : ''}`}>
            <div className="chat-sidebar">
                <div className="chat-sidebar-header">
                    <h3>Messages</h3>
                </div>
                <div className="conversation-list">
                    {loading ? (
                        <p className="loading-text">Loading...</p>
                    ) : conversations.length === 0 ? (
                        <p className="no-conversations">No conversations yet.</p>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                                onClick={() => setSelectedConversation(conv)}
                            >
                                <div className="conversation-avatar">
                                    {getOtherParticipantName(conv).charAt(0).toUpperCase()}
                                </div>
                                <div className="conversation-details">
                                    <div className="conversation-name">{getOtherParticipantName(conv)}</div>
                                    <div className="conversation-product">
                                        {conv.product_image && (
                                            <img src={conv.product_image} alt="Prod" style={{ width: '20px', height: '20px', borderRadius: '4px', marginRight: '5px', objectFit: 'cover', verticalAlign: 'text-bottom' }} />
                                        )}
                                        {conv.product_name}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="chat-main">
                {selectedConversation ? (
                    <>
                        <div className="chat-header">
                            <div className="header-info">
                                <h3>{getOtherParticipantName(selectedConversation)}</h3>
                                <span className="product-label">
                                    {selectedConversation.product_image && (
                                        <img src={selectedConversation.product_image} alt={selectedConversation.product_name} style={{ width: '30px', height: '30px', borderRadius: '4px', marginRight: '8px', verticalAlign: 'middle' }} />
                                    )}
                                    Re: {selectedConversation.product_name}
                                </span>
                            </div>
                        </div>
                        <div className="messages-area">
                            {messages.length === 0 ? (
                                <p className="no-messages">No messages in this conversation.</p>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`message ${msg.sender === user?.id || (user?.username && msg.sender === user?.username) ? 'sent' : 'received'}`}
                                    // Note: Adjustment needed if msg.sender is ID vs Username. Assuming ID for now based on models
                                    >
                                        {renderMessageContent(msg.content)}
                                        <div className="message-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="message-input-area">
                            <input
                                type="file"
                                id="image-upload"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleImageUpload}
                            />
                            <form onSubmit={handleSendMessage} style={{ display: 'flex', width: '100%', gap: '10px' }}>
                                <button
                                    type="button"
                                    className="btn-icon"
                                    title="Upload Image"
                                    onClick={() => document.getElementById('image-upload').click()}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', display: 'flex', alignItems: 'center', padding: '0 5px' }}
                                >
                                    ➕
                                </button>
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                <button type="submit" disabled={!newMessage.trim()}>
                                    Send
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <div className="placeholder-content">
                            <h3>Select a conversation to start chatting</h3>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;
