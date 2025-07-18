import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateQuestion = async (req, res) => {
  const apikey = process.env.AI_STUDIO_API_KEY;
  const { prompt } = req.body;

  if (!prompt) {
    return res.json({ success: false, message: "Prompt cannot be empty" });
  }

  try {
    const fullPrompt = `Generate a quiz question based on the given text: ${prompt}, the question should not be an MCQ but a good quiz question. The question should not be conceptual but factual or logical`;

    const ai = new GoogleGenerativeAI(apikey);
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(fullPrompt);
    const response = await result.response.text();

    return res.json({ success: true, content: response });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
