import React, { useState, useRef, useEffect } from "react";
import {
    Box,
    TextField,
    IconButton,
    Paper,
    Typography,
    Avatar,
    Fab,
    CircularProgress,
    Tooltip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy"; // Robot icon
import CloseIcon from "@mui/icons-material/Close";
import ReactMarkdown from "react-markdown";

// You might need to adjust the API URL based on your environment
const API_URL = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const MediBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "Hello! I am MediBot 🤖. I can help you with blood donation queries and speak in Indian languages. How can I assist you today?",
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleToggle = () => setIsOpen(!isOpen);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            // Prepare history (exclude images from history to save tokens if needed, 
            // but OpenRouter might handle it. For now, sending text history only to maintain context cheaply)
            const history = messages.map(m => ({ role: m.role, content: m.content }));

            const response = await fetch(`${API_URL}/api/medibot/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: history,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: data.reply },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: "⚠️ Sorry, I encountered an error. Please try again." },
                ]);
            }
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "⚠️ Network error. Please check your connection." },
            ]);
        }

        setIsLoading(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <Paper
                    elevation={10}
                    className="w-80 sm:w-96 h-[500px] flex flex-col bg-white rounded-lg shadow-2xl overflow-hidden mb-4 border border-gray-200"
                >
                    {/* Header */}
                    <Box className="bg-gradient-to-r from-red-600 to-red-800 p-4 flex justify-between items-center text-white">
                        <Box className="flex items-center gap-2">
                            <SmartToyIcon />
                            <Typography variant="h6" className="font-bold">
                                MediBot AI
                            </Typography>
                        </Box>
                        <IconButton onClick={handleToggle} size="small" className="text-white hover:bg-red-700">
                            <CloseIcon fontSize="small" sx={{ color: 'white' }} />
                        </IconButton>
                    </Box>

                    {/* Messages Area */}
                    <Box className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
                        {messages.map((msg, index) => (
                            <Box
                                key={index}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${msg.role === "user"
                                        ? "bg-red-600 text-white rounded-tr-none"
                                        : "bg-white text-gray-800 border border-gray-200 rounded-tl-none"
                                        }`}
                                >
                                    {/* Markdown Content */}
                                    <ReactMarkdown
                                        components={{
                                            p: ({ node, ...props }) => <p className="mb-1 last:mb-0" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                            li: ({ node, ...props }) => <li className="mb-0.5" {...props} />
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </Box>
                        ))}
                        {isLoading && (
                            <Box className="flex justify-start">
                                <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm flex items-center gap-2">
                                    <CircularProgress size={16} color="error" />
                                    <span className="text-gray-500 text-xs animate-pulse">Analyzing...</span>
                                </div>
                            </Box>
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    {/* Input Area */}
                    <Box className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
                        <TextField
                            variant="outlined"
                            placeholder="Ask about blood donation..."
                            size="small"
                            fullWidth
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    borderRadius: "20px",
                                    backgroundColor: "#f9fafb",
                                },
                            }}
                        />
                        <IconButton
                            color="error"
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Paper>
            )}

            {/* Floating Action Button */}
            {!isOpen && (
                <Fab
                    color="error"
                    aria-label="chat"
                    onClick={handleToggle}
                    className="animate-bounce"
                    sx={{ width: 64, height: 64 }}
                >
                    <SmartToyIcon fontSize="large" />
                </Fab>
            )}
        </div>
    );
};

export default MediBot;
