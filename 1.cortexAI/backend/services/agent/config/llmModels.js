import dotenv from "dotenv"
dotenv.config()
import { ChatGroq } from "@langchain/groq"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatOpenRouter } from "@langchain/openrouter";
const groq=new ChatGroq({
    model:"openai/gpt-oss-120b"
})

// const gemini=new ChatGoogleGenerativeAI({
//     model:"gemini-3.8-flash"
// })



const gemini = new ChatGoogleGenerativeAI({
    model: "gemini-3.5-flash-lite",
    temperature: 0,
    maxOutputTokens: 1024
});

const openrouter=new ChatOpenRouter({
    model:"deepseek/deepseek-chat",
    temperature:0,
    maxTokens:2500
})



export const getModel = async (agent) => {
    switch (agent) {
        case "pdf":
        case "pdf-rag":
            return gemini;

        case "chat":
        case "search":
            return groq;

        case "coding":
            return openrouter;

        case "imageAnalyzer":
            return gemini;

        default:
            return groq;
    }
};
