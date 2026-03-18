import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface TypewriterTextProps {
    content: string;
    speed?: number; // ms per character
    onComplete?: () => void;
}

export default function TypewriterText({ content, speed = 15, onComplete }: TypewriterTextProps) {
    const [displayedText, setDisplayedText] = useState(speed === 0 ? content : '');
    const [isComplete, setIsComplete] = useState(speed === 0);

    useEffect(() => {
        if (speed === 0) {
            setDisplayedText(content);
            setIsComplete(true);
            return;
        }

        let currentIndex = 0;
        let intervalId: NodeJS.Timeout;

        // Reset state when content changes and speed > 0
        setDisplayedText('');
        setIsComplete(false);

        if (!content) return;

        intervalId = setInterval(() => {
            if (currentIndex < content.length - 1) {
                setDisplayedText(prev => prev + content[currentIndex]);
                currentIndex++;
            } else {
                // Completed
                setDisplayedText(content);
                setIsComplete(true);
                clearInterval(intervalId);
                if (onComplete) onComplete();
            }
        }, speed);

        return () => clearInterval(intervalId);
    }, [content, speed, onComplete]);

    return (
        <div className="prose prose-invert max-w-none 
            prose-p:leading-relaxed prose-p:mb-3 last:prose-p:mb-0
            prose-a:text-green-400 prose-a:underline hover:prose-a:text-green-300
            prose-strong:text-green-300 prose-strong:font-bold
            prose-ul:list-disc prose-ul:ml-4 prose-ul:mb-3
            prose-ol:list-decimal prose-ol:ml-4 prose-ol:mb-3
            prose-li:mb-1
            prose-headings:text-green-400 prose-headings:font-bold prose-headings:mb-3 prose-headings:mt-4
            first:prose-headings:mt-0 relative">

            <ReactMarkdown>
                {displayedText}
            </ReactMarkdown>

            {!isComplete && (
                <span className="inline-block w-2 h-4 bg-green-400 ml-1 animate-pulse" style={{ verticalAlign: 'middle', marginTop: '-2px' }}></span>
            )}
        </div>
    );
}
