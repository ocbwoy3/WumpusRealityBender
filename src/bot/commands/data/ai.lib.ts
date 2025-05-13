import { GoogleGenAI } from "@google/genai";
import { Command } from "@sapphire/framework";

export const gemini = new GoogleGenAI({
	apiKey: process.env.GEMINI_KEY!
})

export class _ extends Command {}
