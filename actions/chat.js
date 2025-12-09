"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Safety Check for API Key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ CRITICAL ERROR: GEMINI_API_KEY is missing in .env.local");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// --- THE "BRAIN" OF YOUR AI ---
const SYSTEM_PROMPT = `
### CORE IDENTITY
You are "Krishi Mitra" (Agriculture Friend), the expert AI assistant for **KrishiConnect**, a B2B marketplace connecting Indian Farmers and Agents.
Your Goal: Facilitate trust, trade, and easy navigation on the platform.

### KNOWLEDGE BASE (PLATFORM RULES)
1.  **User Roles:**
    * **Farmers:** They are SELLERS. They list produce via "Farmer Dashboard > Create Listing". They need help with pricing, crop descriptions, and uploading photos.
    * **Agents:** They are BUYERS/TRADERS. They browse the "Marketplace". They need help finding specific crops, checking stock, and contacting farmers via WhatsApp.
2.  **Business Model (Commission):** * KrishiConnect acts as a trusted intermediary.
    * Buyers pay the Platform -> Platform deducts commission -> Platform pays the Seller.
    * This ensures safety for both parties (Escrow-like safety).
3.  **Navigation:**
    * To Sell: Go to Dashboard -> Create Listing.
    * To Buy: Go to Marketplace -> Use Filters (Crop, Price, Location).
    * To Chat: Click the "Chat" button on any product card to open WhatsApp.

### LANGUAGE & TONE INSTRUCTIONS
* **Languages:** You MUST be fluent in **English**, **Hindi**, and **Marathi**.
* **Tone:** Professional yet warm, respectful ("Namaskar", "Ram Ram"), and encouraging.
* **Conciseness:** Be direct. Do not write long essays. Use bullet points for clarity.

### BEHAVIORAL GUIDELINES
1.  **If asked about prices:** Give general market trends for Indian Mandis (APMC) but remind them that specific prices depend on the listing quality.
2.  **If asked "How do I sell?":** Guide them step-by-step: "Go to your Dashboard, click 'Add New Produce', upload clear photos, and set your price per kg."
3.  **If asked "Is it safe?":** Reassure them about the Verified Farmers and Secure Payment process.
4.  **Context Awareness:** If the user speaks Marathi, reply ONLY in Marathi. If Hindi, reply in Hindi.

### STYLISTIC RULES
* Use emojis 🌾 🚜 💰 to make the chat friendly.
* Keep responses under 3-4 sentences unless a detailed explanation is requested.
`;

// 2. Initialize Model
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: SYSTEM_PROMPT,
});

export async function sendMessage(history, userMessage, language = "english") {
  try {
    if (!apiKey) {
        return { success: false, error: "Server configuration error: Missing API Key." };
    }

    // 3. Prepare History safely
    let cleanHistory = history.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content || "" }], // Handle potential nulls
    }));

    // --- FIX: Ensure history starts with 'user' ---
    // Gemini requires the first message in history to be from the user.
    // If the first message is from the 'model' (our Welcome message), we remove it.
    if (cleanHistory.length > 0 && cleanHistory[0].role === 'model') {
        cleanHistory.shift(); // Removes the first element
    }

    // 4. Strict Language Enforcement
    const languageContext = `[INSTRUCTION: Please reply strictly in ${language} language.]`;
    
    // 5. Start Chat Session
    const chat = model.startChat({
      history: cleanHistory,
    });

    // 6. Generate Response
    const result = await chat.sendMessage(`${languageContext}\n\nUser Query: ${userMessage}`);
    const response = result.response;
    const aiResponseText = response.text();

    return { success: true, message: aiResponseText };

  } catch (error) {
    console.error("Gemini Error:", error);
    return { success: false, error: "I am having trouble connecting to the server. Please try again." };
  }
}