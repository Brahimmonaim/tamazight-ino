import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Express
const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize GoogleGenAI client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper for sending safe errors
const handleServiceError = (res: express.Response, err: any) => {
  console.error("Gemini service error:", err);
  res.status(500).json({ 
    error: "Failed to connect to our intelligent wizard! Check secrets status.", 
    message: err.message || String(err) 
  });
};

/* --- API ENDPOINTS FOR SMART CHILDREN FEATURES --- */

// Endpoint 1: Story Magic (ⵜⴰⵏⴼⵓⵙⵜ)
app.post("/api/gemini/story", async (req, res) => {
  try {
    const { character, topic } = req.body;
    if (!character || !topic) {
      res.status(400).json({ error: "Missing character or topic" });
      return;
    }

    const prompt = `You are an expert children's Tamazight educator and a playful storyteller. 
Write an ultra-simple, magical, and friendly short story for children under 8.
The story features the character "${character}" (e.g., a sheep, sun, angel) exploring the topic "${topic}".
Adhere strictly to standard basic Northern Tamazight (Tifinagh script) and match words in kids' themes.
Write only 2 or 3 sentences maximum, keeping it very basic. 
Provide the story in:
1. Pure Tifinagh script
2. Latin phonetic transliteration pronunciation
3. English translation
4. Define exactly 3 vocabulary words taught in this short story.

You MUST respond strictly with a valid JSON matching the schema of custom story output.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tifinagh: { 
              type: Type.STRING, 
              description: "The simple story in pure Tamazight Tifinagh script. 2-3 short sentences max." 
            },
            latin: { 
              type: Type.STRING, 
              description: "Latin pronunciation guide/transliteration of the story" 
            },
            english: { 
              type: Type.STRING, 
              description: "English translation of the story" 
            },
            vocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tif: { type: Type.STRING, description: "Word in Tifinagh script" },
                  eng: { type: Type.STRING, description: "Meaning in English" },
                  emoji: { type: Type.STRING, description: "Appropriate single emoji" }
                },
                required: ["tif", "eng", "emoji"]
              },
              description: "Exactly 3 vocabulary words introduced in the story"
            }
          },
          required: ["tifinagh", "latin", "english", "vocabulary"]
        }
      }
    });

    const data = JSON.parse(response.text?.trim() || "{}");
    res.json(data);
  } catch (err: any) {
    handleServiceError(res, err);
  }
});

// Endpoint 2: Riddle Box (ⵜⴰⵏⵣⵣⵓⵔⵜ)
app.post("/api/gemini/riddle", async (req, res) => {
  try {
    const { category } = req.body; // e.g., 'animals', 'fruits', 'colors'
    
    const prompt = `You are a children's teacher. Generate a simple, fun educational riddle in Tamazight (Tifinagh script) for children about the category "${category || 'any topic'}".
For example, a riddle about fruits, colors, numbers, or everyday objects.
The riddle must be written in simple, beautiful Tifinagh of Northern Tamazight.
The riddle should have:
1. A questioning phrase in Tifinagh (1 sentence, e.g. "I am red, round, and sweet. What am I?").
2. 4 multiple-choice options in Tifinagh script (1 correct answer, 3 false answers).
3. Index of correct answer (0, 1, 2, or 3).
4. English translation and pronunciation guide.

You MUST respond strictly with a valid JSON matching the correct riddle schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riddleTifinagh: { 
              type: Type.STRING, 
              description: "The riddle question written in simplified Tifinagh script" 
            },
            riddleLatin: { 
              type: Type.STRING, 
              description: "Latin pronunciation translit of the riddle question" 
            },
            riddleEnglish: { 
              type: Type.STRING, 
              description: "English translation of the riddle" 
            },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 4 options in Tamazight Tifinagh script. They should be simple noun words."
            },
            correctAnswerIdx: { 
              type: Type.INTEGER, 
              description: "0 to 3 index of correct answer in the options array" 
            },
            correctAnswerEnglish: { 
              type: Type.STRING, 
              description: "The correct answer word in English (e.g. apple)" 
            },
            explanation: { 
              type: Type.STRING, 
              description: "Simple 1-sentence kid-friendly explanation in English of why that's the answer" 
            }
          },
          required: ["riddleTifinagh", "riddleLatin", "riddleEnglish", "options", "correctAnswerIdx", "correctAnswerEnglish", "explanation"]
        }
      }
    });

    const data = JSON.parse(response.text?.trim() || "{}");
    res.json(data);
  } catch (err: any) {
    handleServiceError(res, err);
  }
});

// Endpoint 3: Word Alchemist / Translation (ⴰⵡⴰⵍ)
app.post("/api/gemini/translate", async (req, res) => {
  try {
    const { word } = req.body;
    if (!word) {
      res.status(400).json({ error: "No word provided" });
      return;
    }

    const prompt = `Translate this word or phrase to standard Northern Tamazight: "${word}".
Provide:
1. The translation in standard Tifinagh script (e.g. ⴰⵎⴰⵏ, ⴰⴼⵓⵙ, ⵜⵓⵖⵎⴰⵙ ...).
2. The Latin/English pronunciation phonetic guide.
3. A very encouraging, adorable description of this word suitable for kids (1 or 2 simple sentences).
4. A highly appropriate illustrative emoji (e.g., 🦁 if tiger, 🍉 if watermelon).
5. A super simple, basic example sentence using the word in Tifinagh and its English meaning.

You MUST respond strictly with a valid JSON matching the alchemy schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            wordTifinagh: { 
              type: Type.STRING, 
              description: "Proper standard Tifinagh translation for the word" 
            },
            pronunciation: { 
              type: Type.STRING, 
              description: "Pronunciation guide in English letters" 
            },
            explanation: { 
              type: Type.STRING, 
              description: "Warm, kids-friendly simplified definition or description with positive vibes" 
            },
            emoji: { 
              type: Type.STRING, 
              description: "Exactly 1 graphic emoji representing the word/topic" 
            },
            exampleTifinagh: { 
              type: Type.STRING, 
              description: "Short simple standard sentence using the word in Tifinagh" 
            },
            exampleEnglish: { 
              type: Type.STRING, 
              description: "English translation of the example sentence" 
            }
          },
          required: ["wordTifinagh", "pronunciation", "explanation", "emoji", "exampleTifinagh", "exampleEnglish"]
        }
      }
    });

    const data = JSON.parse(response.text?.trim() || "{}");
    res.json(data);
  } catch (err: any) {
    handleServiceError(res, err);
  }
});


/* --- VITE DEV MIDDLEWARE AND PROD STATICS --- */

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Dev Mode: Integrates Vite development server
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware mounted successfully.");
  } else {
    // Production Mode: Serves generated static client bundle
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static handler mounted targeting: " + distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Tamazight Kids fullstack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
