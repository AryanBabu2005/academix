// In screens/ChatScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../firebaseConfig'; // To get user info

const ChatScreen = () => {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Define the AI's persona
  const systemPrompt = `You are "Academix," a helpful and friendly AI assistant for a college app.
  Your role is to answer student questions about academic life, campus events, and university policies.
  Be concise, friendly, and always stay in character.
  If a question is unrelated to college, university, or academics (e.g., "what is the capital of France?"),
  politely decline to answer it, reminding the user that you are a campus assistant.`;
  
  // The user object for the chat
  const chatUser = { _id: auth.currentUser.uid, name: auth.currentUser.email };
  // The AI bot object for the chat
  const botUser = { _id: 'academix-bot', name: 'Academix', avatar: 'https://placehold.co/128x128/007AFF/FFFFFF?text=A' };

  useEffect(() => {
    // Start the chat with a welcome message from the bot
    setMessages([
      {
        _id: 1,
        text: 'Hello! I am Academix, your AI campus assistant. How can I help you today?',
        createdAt: new Date(),
        user: botUser,
      },
    ]);
  }, []);

  // This function is called when the user hits "send"
  const onSend = useCallback((newMessages = []) => {
    const userMessage = newMessages[0];
    setMessages(previousMessages => GiftedChat.append(previousMessages, userMessage));
    setLoading(true);
    // Call the Gemini API with the user's message
    callGeminiAPI(userMessage.text);
  }, []);

  // This function communicates with the Gemini API
  const callGeminiAPI = async (userQuery) => {
    const apiKey = ""; // Leave this as an empty string. Canvas will handle it.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [{
        parts: [{ text: userQuery }]
      }],
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts.length > 0) {
        const botResponseText = result.candidates[0].content.parts[0].text;
        
        const botMessage = {
          _id: new Date().getTime() + 1,
          text: botResponseText,
          createdAt: new Date(),
          user: botUser,
        };
        setMessages(previousMessages => GiftedChat.append(previousMessages, botMessage));
      } else {
        throw new Error("Received an empty response from the AI.");
      }

    } catch (error) {
      console.error("Gemini API call failed:", error);
      const errorMessage = {
        _id: new Date().getTime() + 1,
        text: "Sorry, I'm having trouble connecting to the AI. Please try again later.",
        createdAt: new Date(),
        user: botUser,
      };
      setMessages(previousMessages => GiftedChat.append(previousMessages, errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={chatUser}
        isTyping={loading}
        placeholder="Ask about library hours, events, etc..."
        showUserAvatar
        alwaysShowSend
      />
    </View>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  }
});

