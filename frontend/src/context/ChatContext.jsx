import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [hasNewChats, setHasNewChats] = useState(false);
    const previousConversationsRef = useRef(null); // Use null to indicate initially empty/not loaded

    useEffect(() => {
        let interval;
        if (isAuthenticated) {
            checkChats(true); // Initial check
            interval = setInterval(() => checkChats(false), 10000); // Poll every 10s (frequent enough for demo)
        } else {
            previousConversationsRef.current = null;
            setHasNewChats(false);
        }
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    const checkChats = async (isInitial = false) => {
        try {
            const response = await chatAPI.getConversations();
            const currentConversations = response.data;

            // Calculate total unread messages
            const totalUnread = currentConversations.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);

            if (!isInitial) {
                // Check if we have more unread messages than before
                const prevUnread = previousConversationsRef.current || 0;
                if (totalUnread > prevUnread) {
                    toast.info(`You have new messages!`);
                }
            }

            setHasNewChats(totalUnread > 0);
            previousConversationsRef.current = totalUnread;

        } catch (error) {
            console.error("Failed to poll chats", error);
        }
    };

    const markAsRead = () => {
        // Optimistically clear badge, but it will come back if backend still says unread
        // In a real app, we would mark messages as read on the backend here
        setHasNewChats(false);
    };

    return (
        <ChatContext.Provider value={{ hasNewChats, markAsRead }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
