

import React, { useEffect, useRef, useState } from "react";
import {
  Paperclip,
  Send,
  X,
  FileText,
  Image as ImageIcon,
  Mic,
  MicOff,
  ChevronDown,
  Bot,
  Loader2,

} from "lucide-react";

import { useDispatch, useSelector } from "react-redux";

import {
  addMessage,
  setArtifacts,
  setIsLoading,
  setMessages
} from "../redux/messageSlice";

import {
  addConversation,
  setSelectedConversation,
  setConvTitle,
} from "../redux/conversationSlice";

import { createConversation } from "../features/createConversation";
import { updateConversation } from "../features/updateConversation";
import  sendMessage  from "../features/sendMessage";

// Available agents
const agents = [
  { id: "auto", name: "Auto", description: "Automatically choose an agent" },
  { id: "chat", name: "Chat", description: "General conversations" },
  { id: "coding", name: "Coding", description: "Programming and debugging" },
  { id: "pdf", name: "PDF", description: "PDF document analysis" },
  { id: "ppt", name: "PPT", description: "Presentation assistance" },
  { id: "vision", name: "Vision", description: "Image understanding" },
  { id: "search", name: "Search", description: "Web research and search" },
];

function ChatInput() {
  const dispatch = useDispatch();

  const { selectedConversation } = useSelector(
    (state) => state.conversation
  );

  const { isLoading } = useSelector((state) => state.message);

  const [value, setValue] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("auto");
  const [selectedFile, setSelectedFile] = useState(null);
  const [showAgents, setShowAgents] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const fileRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const agentMenuRef = useRef(null);

  // Check browser speech recognition support
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN";

      recognition.onresult = (event) => {
        let transcript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        if (transcript) {
          setValue((previous) => {
            const finalTranscript = event.results[event.results.length - 1]
              .isFinal
              ? transcript
              : "";

            return finalTranscript
              ? `${previous}${previous ? " " : ""}${finalTranscript}`
              : previous;
          });
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  // Close agent menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        agentMenuRef.current &&
        !agentMenuRef.current.contains(event.target)
      ) {
        setShowAgents(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);
  };

  const removeFile = () => {
    setSelectedFile(null);

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const toggleMicrophone = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Microphone error:", error);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!value.trim() && !selectedFile) return;
    if (isLoading) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    dispatch(setIsLoading(true));

    try {
      let conversation = selectedConversation;

      // Create a conversation if none exists or ID is missing
      if (!conversation?._id) {
        dispatch(setMessages([]));

        const conv = await createConversation();

        if (!conv?._id) {
          console.error(
            "Conversation creation failed: Invalid conversation ID"
          );
          return;
        }

        dispatch(setSelectedConversation(conv));
        dispatch(addConversation(conv));

        conversation = conv;
      }

      // Update title for a new conversation
      if (conversation.title === "New Chat") {
        const title = value.trim().slice(0, 40);

        if (title) {
          await updateConversation({
            id: conversation._id,
            title,
          });

          dispatch(
            setConvTitle({
              conversationId: conversation._id,
              title,
            })
          );
        }
      }

      // Prepare request
      const formData = new FormData();

      formData.append("prompt", value.trim());
      formData.append("conversationId", conversation._id);
      formData.append("agent", selectedAgent.toLowerCase());

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      // Optimistically add user message
      dispatch(
        addMessage({
          role: "user",
          content: value.trim(),
        })
      );

      const messageText = value.trim();

      setValue("");

      const data = await sendMessage(formData);

      if (!data) {
        console.error("Agent request failed. Check backend logs.");
        return;
      }

      dispatch(setArtifacts(data.artifacts || []));

      dispatch(
        addMessage({
          role: "assistant",
          content: data.answer,
          images: data.images,
          artifacts: data.artifacts || [],
        })
      );

      setSelectedFile(null);

      if (fileRef.current) {
        fileRef.current.value = "";
      }

      console.log("Agent response:", data);
    } catch (error) {
      console.error(
        "Chat error:",
        error.response?.data || error.message
      );
    } finally {
      dispatch(setIsLoading(false));
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const currentAgent =
    agents.find((agent) => agent.id === selectedAgent) || agents[0];

  const isImage = selectedFile?.type?.startsWith("image/");

  return (
    <div className="w-full px-4 pb-5 pt-3 bg-[#0d0f14]">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl border border-white/[0.09] bg-[#151821] shadow-lg">

          {/* Selected file preview */}
          {selectedFile && (
            <div className="px-4 pt-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] p-2">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400">
                  {isImage ? (
                    <ImageIcon size={18} />
                  ) : (
                    <FileText size={18} />
                  )}
                </div>

                <div className="min-w-0 max-w-[180px]">
                  <p className="text-xs font-medium text-slate-200 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>

                <button
                  type="button"
                  onClick={removeFile}
                  className="flex items-center justify-center w-6 h-6 rounded-full text-slate-500 hover:text-white hover:bg-white/10"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Message input */}
          <div className="px-4 pt-4">
            <textarea
              ref={inputRef}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message CortexAI..."
              rows={2}
              disabled={isLoading}
              className="w-full resize-none bg-transparent border-none outline-none text-[14px] text-slate-100 placeholder:text-slate-600 min-h-[55px] max-h-[180px] disabled:opacity-60"
            />
          </div>

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between gap-2 px-3 pb-3">

            <div className="flex items-center gap-1.5">

              {/* File upload */}
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
              />

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={isLoading}
                title="Attach file"
                className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-colors disabled:opacity-40"
              >
                <Paperclip size={17} />
              </button>

              {/* Agent selector */}
              <div className="relative" ref={agentMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowAgents((previous) => !previous)}
                  disabled={isLoading}
                  className="flex items-center gap-2 h-9 px-3 rounded-xl border border-white/[0.07] bg-white/[0.03] text-xs font-medium text-slate-300 hover:bg-white/[0.07] transition-colors disabled:opacity-40"
                >
                  <Bot size={14} className="text-indigo-400" />
                  {currentAgent.name}
                  <ChevronDown size={13} />
                </button>

                {showAgents && (
                  <div className="absolute bottom-12 left-0 z-30 w-60 rounded-xl border border-white/[0.09] bg-[#1b1f2a] shadow-2xl p-1.5">
                    {agents.map((agent) => (
                      <button
                        type="button"
                        key={agent.id}
                        onClick={() => {
                          setSelectedAgent(agent.id);
                          setShowAgents(false);
                        }}
                        className={`w-full flex flex-col items-start gap-0.5 px-3 py-2 rounded-lg text-left transition-colors ${
                          selectedAgent === agent.id
                            ? "bg-indigo-500/10 text-indigo-300"
                            : "text-slate-300 hover:bg-white/[0.05]"
                        }`}
                      >
                        <span className="text-xs font-medium">
                          {agent.name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {agent.description}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">

              {/* Microphone */}
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleMicrophone}
                  disabled={isLoading}
                  title={isListening ? "Stop listening" : "Voice input"}
                  className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${
                    isListening
                      ? "bg-red-500/15 text-red-400"
                      : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.06]"
                  }`}
                >
                  {isListening ? (
                    <MicOff size={17} />
                  ) : (
                    <Mic size={17} />
                  )}
                </button>
              )}

              {/* Send button */}
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={isLoading || (!value.trim() && !selectedFile)}
                title="Send message"
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-2">
          CortexAI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}

export default ChatInput;
