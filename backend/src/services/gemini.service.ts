import { GoogleGenAI } from "@google/genai";
import { config } from "../config/env";
import { logger } from '../utils/logger';
import { WebSocket } from "ws";

export class GeminiService {
    private client: GoogleGenAI;
    private session: any = null; // Store session reference for external injection
    
    // Model string must be exact
    private model: string = "gemini-2.0-flash-exp"; 

    constructor() {
        this.client = new GoogleGenAI({ apiKey: config.geminiApiKey });
    }

    /**
     * Injects a command from the Remote Expert into the live AI conversation.
     * This is the "Ghost Mode" bridge.
     */
    public injectExpertCommand(text: string) {
        if (this.session) {
            logger.info(`Injecting Expert instruction into Gemini: ${text}`);
            this.session.send({
                realtimeInput: {
                    mediaChunks: [{
                        mimeType: "text/plain",
                        data: Buffer.from(text).toString("base64")
                    }]
                }
            });
        } else {
            logger.warn("Cannot inject expert command: No active Gemini session.");
        }
    }

    public async startLiveSession(ws: WebSocket) {
        logger.info("Initializing Gemini Live Session...");

        try {
            // Connect to the Live API
            this.session = await (this.client as any).live.connect({
                model: this.model,
                config: {
                    responseModalities: ["AUDIO" as any], 
                    systemInstruction: {
                        parts: [{
                            text: "You are OmniSight, an expert field technician AI. You are assisting a user via live camera. Keep responses extremely brief (under 2 sentences). If the user is about to make a mistake, say 'Stop'. A remote senior engineer may occasionally send you instructions; relay them naturally to the user."
                        }]
                    }
                },
                callbacks: {
                    onopen: () => {
                        logger.info("Connected to Gemini Live API.");
                        ws.send(JSON.stringify({ type: "connection_status", status: "ready" }));
                    },
                    onmessage: (geminiResponse: any) => {
                        // Forward AI audio/transcript back to the technician
                        ws.send(JSON.stringify(geminiResponse));
                    },
                    onerror: (error: any) => {
                        logger.error("Gemini Live API Error: ", error);
                        ws.send(JSON.stringify({ type: "error", message: "AI Engine Error." }));
                    },
                    onclose: () => {
                        logger.info("Gemini Live API Connection Closed.");
                    }
                }
            });

            // Handle incoming data from the Technician's phone
            ws.on("message", (message: string | Buffer) => {
                try {
                    if (!this.session) return;

                    if (Buffer.isBuffer(message)) {
                        // Stream raw PCM audio
                        this.session.send({
                            realtimeInput: {
                                mediaChunks: [{
                                    mimeType: "audio/pcm;rate=16000",
                                    data: message.toString("base64")
                                }]
                            }
                        });
                    } else {
                        // Stream JSON (Video Frames / Control Messages)
                        const data = JSON.parse(message.toString());
                        this.session.send(data);
                    }
                } catch (err) {
                    logger.error("Error parsing technician message", err);
                }
            });

            ws.on("close", () => {
                logger.info("❌ Technician disconnected. Ending AI session.");
                this.session = null;
            });

        } catch (error) {
            logger.error("Failed to start Live Session", error);
            ws.send(JSON.stringify({ type: "error", message: "Failed to connect to the Live Agent model." }));
            ws.close();
        }
    }
}