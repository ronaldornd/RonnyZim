import { useState } from 'react';

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    content: string;
    type?: 'text' | 'analysis' | 'knowledge_gap' | 'quest_generated';
    analysisData?: any;
    gapData?: any;
    questData?: any;
}

export interface ActiveLearningContext {
    question: string;
    property_key: string;
    category: string;
}

interface UseAgentChatProps {
    userId: string;
    agentId?: string;
    dynamicSystemPrompt?: string;
    onAgentSwitch?: (newAgentId: string) => void;
}

export function useAgentChat({ userId, agentId, dynamicSystemPrompt, onAgentSwitch }: UseAgentChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeLearningContext, setActiveLearningContext] = useState<ActiveLearningContext | null>(null);

    const sendMessage = async (content: string, hiddenForResume = false) => {
        if (!content.trim()) return;

        const newMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content,
        };

        const newMessages = [...messages, newMessage];

        if (!hiddenForResume) {
            setMessages(newMessages);
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    agent_id: agentId,
                    dynamic_system_prompt: dynamicSystemPrompt,
                    user_id: userId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Server API Error details:", errorData);
                throw new Error(errorData.details || errorData.error || 'Falha na resposta do servidor.');
            }

            const data = await response.json();

            // Semantic Router Hook - Trigger visual update if agent was auto-switched
            if (data.active_agent_id && data.active_agent_id !== agentId && onAgentSwitch) {
                onAgentSwitch(data.active_agent_id);
            }

            // Intercept Action: GAP Engine (Knowledge Gap middleware)
            if (data.type === 'knowledge_gap' && data.gapData) {
                const gapMessage: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: 'model',
                    content: '', // No text content, strictly UI driven
                    type: 'knowledge_gap',
                    gapData: data.gapData
                };

                // Track internally to keep track of the key if needed, or we rely on the gapData in UI
                setActiveLearningContext({
                    question: data.gapData.question_to_user,
                    property_key: data.gapData.category, // Storing under category as property_key format
                    category: data.gapData.category
                });

                setMessages((prev) => [...prev, gapMessage]);
                setIsLoading(false);
                return;
            }

            // Intercept Action: Daily Quest Assignment 
            if (data.type === 'quest_generated' && data.questData) {
                const questMessage: ChatMessage = {
                    id: crypto.randomUUID(),
                    role: 'model',
                    content: '', // Purely UI driven
                    type: 'quest_generated',
                    questData: data.questData
                };
                
                setMessages((prev) => [...prev, questMessage]);
                setIsLoading(false);
                return;
            }

            // Default Text Response
            const assistantMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'model',
                content: data.content,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const resolveKnowledgeGap = async (value: string) => {
        if (!activeLearningContext || !value.trim()) return;

        try {
            await fetch('/api/facts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    agent_id: agentId || 'system',
                    fact_key: activeLearningContext.property_key,
                    fact_value: value,
                }),
            });

            setActiveLearningContext(null);

            // AUTO-RESUME LOOP: Resubmit silently
            // We append a system fact injection logically, but hide it from the user's view, allowing the Model
            // to process the whole history again with the new fact loaded in memory.
            const resumePrompt = `[Fact Acquired via declare_knowledge_gap tool]: For the category/topic "${activeLearningContext.category}", the user answered: "${value}". Please resume your thought process and provide the final answer now.`;

            await sendMessage(resumePrompt, true);

        } catch (err) {
            console.error('Failed to resolve knowledge gap:', err);
        }
    };

    const addSystemMessage = (content: string, type: 'text' | 'analysis' = 'text', analysisData?: any) => {
        setMessages(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                role: 'model',
                content,
                type,
                analysisData
            }
        ]);
    };

    const clearMessages = () => {
        setMessages([]);
        setActiveLearningContext(null);
    };

    return {
        messages,
        isLoading,
        activeLearningContext,
        sendMessage,
        addSystemMessage,
        resolveKnowledgeGap,
        cancelKnowledgeGap: () => setActiveLearningContext(null),
        clearMessages,
    };
}
