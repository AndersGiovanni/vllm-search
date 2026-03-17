import React, { useState, useEffect } from "react";
import { Sparkles, BrainCircuit, Search, Clock, FileVideo, MessageSquareText, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

/**
 * LoadingDistraction Component
 *
 * Displays detailed status messages while the AI is processing.
 * Cycles through pseudo-technical steps to indicate progress and context awareness.
 */
export default function LoadingDistraction() {
    const [statusIndex, setStatusIndex] = useState(0);

    // Pseudo-technical status updates for video/chat context
    const statuses = [
        { text: "Scanning video content...", icon: FileVideo },
        { text: "Identifying key moments...", icon: Search },
        { text: "Processing visual context...", icon: BrainCircuit },
        { text: "Analyzing conversation history...", icon: MessageSquareText },
        { text: "Synthesizing information...", icon: Sparkles },
        { text: "Generating insights...", icon: Lightbulb },
        { text: "Formulating response...", icon: Sparkles },
        { text: "Double-checking details...", icon: Clock },
        { text: "Finalizing answer...", icon: MessageSquareText },
    ];

    // Cycle status every 4 seconds
    useEffect(() => {
        const statusInterval = setInterval(() => {
            setStatusIndex((prev) => (prev + 1) % statuses.length);
        }, 4000);

        return () => {
            clearInterval(statusInterval);
        };
    }, [statuses.length]);

    const CurrentIcon = statuses[statusIndex].icon;

    return (
        <div className="flex items-center">
            {/* Animated Icon & Status */}
            <div className="flex items-center gap-2 text-primary/80 text-sm font-medium whitespace-nowrap">
                <motion.div
                    key={statusIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-2"
                >
                    <CurrentIcon className="w-4 h-4 animate-pulse" />
                    <span>{statuses[statusIndex].text}</span>
                </motion.div>
            </div>
        </div>
    );
}
