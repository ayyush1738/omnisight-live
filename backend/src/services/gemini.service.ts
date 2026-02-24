import { GoogleGenAI } from "@google/genai";
import { config } from "../config/env";
import { logger } from '../utils/logger';
import { WebSocket } from "ws";

export class GeminiService {
    private client: GoogleGenAI;
    
    // 🚨 FIX 1: Removed "models/Preview: ". It MUST be exactly this string.
    private model: string = "gemini-2.5-flash-native-audio-preview-12-2025";

    constructor() {
        this.client = new GoogleGenAI({ apiKey: config.geminiApiKey });
    }

    public async startLiveSession(ws: WebSocket) {
        logger.info("Initializing Gemini Live Session...");

        try {
            const session = await this.client.live.connect({
                model: this.model,
                config: {
                    // 🚨 FIX 2: Cast to 'any' to bypass incomplete SDK types
                    responseModalities: ["AUDIO" as any], 
                    systemInstruction: {
                        parts: [{
                            text: "You are OmniSight, an expert field technician AI. You are assisting the user via a live camera feed. Keep responses extremely brief, under 2 sentences. If you see a dangerous or incorrect action, interrupt immediately with 'Stop'."
                        }]
                    }
                },
                callbacks: {
                    onopen: () => {
                        logger.info("Connected to Gemini Live API.");
                        ws.send(JSON.stringify({ type: "connection_status", status: "ready" }));
                    },
                    onmessage: (geminiResponse) => {
                        ws.send(JSON.stringify(geminiResponse));
                    },
                    onerror: (error) => {
                        logger.error("Gemini Live API Error: ", error);
                        ws.send(JSON.stringify({ type: "error", message: "AI Engine Error." }));
                    },
                    onclose: () => {
                        logger.info("Gemini Live API Connection Closed.");
                    }
                }
            });

            ws.on("message", (message: string | Buffer) => {
                try {
                    if (Buffer.isBuffer(message)) {
                        // Raw Audio Buffer from Mic
                        // 🚨 FIX 3: Cast session to 'any' because 'send' is missing from the preview types
                        (session as any).send({
                            realtimeInput: {
                                mediaChunks: [{
                                    mimeType: "audio/pcm;rate=16000",
                                    data: message.toString("base64")
                                }]
                            }
                        });
                    } else {
                        // JSON data (Video Frames)
                        const data = JSON.parse(message.toString());
                        (session as any).send(data);
                    }
                } catch (err) {
                    logger.error("Error parsing frontend message", err);
                }
            });

            ws.on("close", () => {
                logger.info("❌ Frontend client disconnected. Cleaning up AI session.");
            });

        } catch (error) {
            logger.error("Failed to start Live Session", error);
            ws.send(JSON.stringify({ type: "error", message: "Failed to connect to the Live Agent model." }));
            ws.close();
        }
    }
}