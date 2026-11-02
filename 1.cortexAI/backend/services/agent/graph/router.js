
import { getModel } from "../config/llmModels.js"

export const router = async (state) => {

  // 1. First check uploaded files
  if (state.file) {

    if (state.file.mimetype === "application/pdf") {
      console.log("[ROUTER] PDF uploaded → pdfRag");

      return {
        ...state,
        agent: "pdfRag"
      };
    }

    if (state.file.mimetype?.startsWith("image/")) {
      console.log("[ROUTER] Image uploaded → imageAnalyzer");

      return {
        ...state,
        agent: "imageAnalyzer"
      };
    }
  }

  // 2. If no file, use explicitly selected agent
  if (state.agent && state.agent !== "auto") {
    console.log("[ROUTER] Explicit agent:", state.agent);

    return {
      ...state,
      agent: state.agent
    };
  }

  // 3. Otherwise, let LLM decide
  const llm = await getModel("router");

  const prompt = `You are an agent router.

Available agents:

- chat
- search
- coding
- pdf
- ppt
- vision

Rules:

chat:
General conversation, explanations, learning, questions.

search:
Current events, latest information, news, recent developments, internet lookup.

coding:
Generate code, debug code, build projects, architecture, API design.

pdf:
Questions about generating PDFs or document context.

ppt:
Questions about generating PPTs or PPT context.

vision:
Generate images or create images.

Return ONLY one word:

chat
search
coding
pdf
ppt
vision

User Query:
${state.prompt}
`;

  const response = await llm.invoke(prompt);

  return {
    ...state,
    agent: response.content.trim().toLowerCase()
  };
};
