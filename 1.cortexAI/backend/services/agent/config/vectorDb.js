
import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings } from "./embeddings.js";
import dotenv from "dotenv";

dotenv.config();

export const vectorStore = async (docs, collectionName) => {
    const url = new URL(process.env.QDRANT_URL);
    url.port = "6333";

    console.log("[QDRANT] Connecting to:", url.origin);

    return await QdrantVectorStore.fromDocuments(
        docs,
        embeddings,
        {
            url: url.origin,
            apiKey: process.env.QDRANT_API_KEY,
            collectionName,
            checkCompatibility: false
        }
    );
};
