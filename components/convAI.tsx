"use dom";

import React, { useCallback, useEffect, useRef } from "react";
import { DOMImperativeFactory, useDOMImperativeHandle } from "expo/dom";
import { useConversation } from "@11labs/react";
import { Platform } from 'react-native';
// If you have a Message type, import it; otherwise, use 'any'
// import type { Message } from "../components/ChatMessage";

type Message = any;

export interface ConvAiRef extends DOMImperativeFactory {
  startConversation: () => void;
  stopConversation: () => void;
}

interface ConvAiDOMComponentProps {
  platform: string;
  onMessage: (message: Message) => void;
  setMessage: (msg: string) => void;
  setStatus: any;
  dom?: import("expo/dom").DOMProps;
  setIsConversationStarting: any;
  setMode: any;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setActiveAnimation: React.Dispatch<
    React.SetStateAction<"idle" | "speaking" | "listening">
  >;
  setAudioLevel: React.Dispatch<React.SetStateAction<number[]>>;
  activeAnimation: "idle" | "speaking" | "listening";
  setIsSpeaking: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentSpokenWordIndex: any;
  setWords: any;
  currentMessageRef: any;
  userId: string | null;
}

const ConvAiDOMComponent = React.forwardRef<ConvAiRef, ConvAiDOMComponentProps>(
  (
    {
      platform,
      onMessage,
      setMessage,
      setStatus,
      setIsConversationStarting,
      setMode,
      setError,
      setActiveAnimation,
      setAudioLevel,
      activeAnimation,
      setIsSpeaking,
      setCurrentSpokenWordIndex,
      setWords,
      currentMessageRef,
      userId,
    },
    ref
  ) => {
    const isActive = useRef(false);

    const conversation = useConversation({
      onConnect: () => {
        console.log("[ConvAI] ✅ Connected to ElevenLabs");
        setStatus("connected");
        isActive.current = true;
      },
      onDisconnect: () => {
        console.log("[ConvAI] ❌ Disconnected from ElevenLabs");
        setStatus("disconnected");
        isActive.current = false;
        setActiveAnimation("idle");
      },
      onMessage: (message: any) => {
        if (!isActive.current) {
          console.log(
            "[ConvAI] ⚠️ Ignored message (conversation inactive):",
            message.message
          );
          return;
        }
        // console.log("[ConvAI] 📨 Message:", message.message, "Source:", message.source);
        setMessage(message.message); // Parent might not use this if only audio
        setMode(message.source);
        onMessage?.(message); // For any parent-specific handling
        if (message.source == "user") {
          setActiveAnimation("listening");
        } else {
          const newWords = message.message;
          setWords(newWords);
          currentMessageRef.current = message.message;
          setCurrentSpokenWordIndex(0);
          setActiveAnimation("speaking");
        }
      },
      onStart: () => {
        console.log("[ConvAI] 🎙️ Conversation started (SDK event)");
        setStatus("started");
        setActiveAnimation("listening");
      },
      onStop: () => {
        console.log("[ConvAI] 🛑 Conversation stopped (SDK event)");
        setStatus("stopped");
        isActive.current = false;
        setActiveAnimation("idle");
      },
      onError: (error: any) => {
        console.error("[ConvAI] ⚠️ SDK onError:", JSON.stringify(error, null, 2));
        setStatus("error");
        isActive.current = false;
        setActiveAnimation("idle");
        setError(error?.message || "A connection error occurred with the voice service.");
      },
    });

    const startConversation = useCallback(async () => {
      console.log("[ConvAI] startConversation called");
      setIsConversationStarting(true);
      try {
        if (Platform.OS === 'web') {
          console.log("[ConvAI] Requesting microphone access via getUserMedia...");
          await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log("[ConvAI] ✅ Microphone access granted via getUserMedia.");
        } else {
          // On native, permissions are already handled in CallScreen
          console.log("[ConvAI] Skipping getUserMedia on native platform.");
        }

        console.log("[ConvAI] Starting ElevenLabs session...");
        if (!userId) {
          console.error("[ConvAI] ❌ Cannot start session: userId is missing.");
          setError("User ID is missing, cannot start the call.");
          setIsConversationStarting(false);
          setActiveAnimation("idle");
          return;
        }
        await conversation.startSession({
          agentId: "agent_01jwdxxnscf15r0tr36jwjh363",
          dynamicVariables: {
            user_id: userId 
          }
        });
        console.log("[ConvAI] ✅ ElevenLabs session started with userId:", userId);
      } catch (err: any) {
        console.error("[ConvAI] ❌ Error during startConversation:", JSON.stringify(err, null, 2));
        let errorMessage = "Failed to start the conversation.";
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = "Microphone permission was denied. Please enable it in your browser/app settings.";
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = "No microphone was found on your device.";
        } else if (err.message && typeof err.message === 'string') {
          errorMessage = err.message; // Use error message from SDK if available
        }
        setError(errorMessage);
        setActiveAnimation("idle");
      } finally {
        setIsConversationStarting(false);
      }
    }, [conversation, setIsConversationStarting, setError, setActiveAnimation, userId]);

    const stopConversation = useCallback(async () => {
      console.log("[ConvAI] Attempting to stop conversation...");
      setActiveAnimation("idle");
      setAudioLevel(Array(15).fill(0)); // Reset audio level visualization
      if (conversation.status !== "disconnected" && conversation.status !== "disconnecting") {
        await conversation.endSession();
        console.log("[ConvAI] ✅ ElevenLabs session ended.");
      } else {
        console.log("[ConvAI] Session already disconnected or disconnecting.");
      }
    }, [conversation, setActiveAnimation, setAudioLevel]); // Added dependencies

    useDOMImperativeHandle(
      ref,
      () => ({
        startConversation,
        stopConversation,
      }),
      [startConversation, stopConversation]
    );

    return null; // This component does not render any UI itself
  }
);

export default ConvAiDOMComponent;