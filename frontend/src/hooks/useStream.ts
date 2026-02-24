import { useState, useCallback } from 'react';
import { streamService } from '../services/api';

interface StreamState {
    isLive: boolean;
    isStarting: boolean;
    isStopping: boolean;
    streamId: string | null;
    viewerCount: number;
    uptimeSeconds: number;
    error: string | null;
}

interface UseStreamReturn extends StreamState {
    startStream: (title?: string, description?: string) => Promise<void>;
    stopStream: () => Promise<void>;
    clearError: () => void;
}

export function useStream(onAction?: (title: string, body: string) => void): UseStreamReturn {
    const [state, setState] = useState<StreamState>({
        isLive: false,
        isStarting: false,
        isStopping: false,
        streamId: null,
        viewerCount: 0,
        uptimeSeconds: 0,
        error: null,
    });

    const startStream = useCallback(async (
        title = 'My SwanyThree Stream',
        description = 'Powered by SwanyThree AI'
    ) => {
        setState((s: StreamState) => ({ ...s, isStarting: true, error: null }));
        try {
            const res = await streamService.createStream({ title, description });
            const streamId = res.data?.id ?? 'demo-stream';
            setState((s: StreamState) => ({
                ...s,
                isLive: true,
                isStarting: false,
                streamId,
                viewerCount: 0,
            }));
            onAction?.('Broadcast Started', 'Your stream is now live reaching thousands of viewers.');
        } catch {
            // Graceful fallback for demo mode
            setState((s: StreamState) => ({
                ...s,
                isLive: true,
                isStarting: false,
                streamId: 'demo-stream',
                viewerCount: 0,
            }));
            onAction?.('Demo Mode Active', 'Stream started in demo mode. Backend not connected.');
        }
    }, [onAction]);

    const stopStream = useCallback(async () => {
        setState((s: StreamState) => ({ ...s, isStopping: true }));
        try {
            if (state.streamId && state.streamId !== 'demo-stream') {
                await streamService.endStream(state.streamId);
            } else {
                await new Promise(r => setTimeout(r, 800));
            }
            setState((s: StreamState) => ({
                ...s,
                isLive: false,
                isStopping: false,
                streamId: null,
                viewerCount: 0,
                uptimeSeconds: 0,
            }));
            onAction?.('Stream Ended', 'Your broadcast has ended. Highlights are being processed.');
        } catch {
            setState((s: StreamState) => ({ ...s, isStopping: false, error: 'Failed to end stream cleanly.' }));
        }
    }, [onAction, state.streamId]);

    const clearError = useCallback(() => {
        setState((s: StreamState) => ({ ...s, error: null }));
    }, []);

    return { ...state, startStream, stopStream, clearError };
}
