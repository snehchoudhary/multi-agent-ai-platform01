// import fs, { stat } from "fs"
// import {PDFParse} from "pdf-parse"
// import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
// import { vectorStore } from "../config/vectorDb.js"
// import { getModel } from "../config/llmModels.js"
// import { HumanMessage, SystemMessage } from "@langchain/core/messages"
// import { deductCredits } from "../utils/deductCredits.js"
// import { checkAgentLimit } from "../config/agentLimit.js"
// export const pdfRag=async (state)=>{
//    try {
//     await checkAgentLimit(state.userId,"pdf")
//       const buffer=fs.readFileSync(state.file.path)
//       const pdf=new PDFParse({
//         data:buffer
//       })

//       const result=await pdf.getText()
//       const text=result.text

//       const spilliter=new RecursiveCharacterTextSplitter({
//         chunkSize:1000,
//         chunkOverlap:200
//       })

//       const docs=await spilliter.createDocuments([text])
//       const collectionName=`pdf-${Date.now()}`;
//       const store=await vectorStore(docs,collectionName)

//       const relevantDocs=await store.similaritySearch(state.prompt,5)
      
//       const context=relevantDocs.map(d=>d.pageContent).join("\n\n")
      
//       const llm=await getModel("pdf-rag")

//        const messages=[
//         new SystemMessage(`You are CortexAI PDF Assistant.

// Rules:

// - Answer ONLY from the uploaded PDF.

// - Never make up information.

// - If the answer is not present in the PDF, reply:

// "I couldn't find this information in the uploaded PDF."

// - Use Markdown formatting.
// `),

// new HumanMessage(`
//     Context:${context}
//      Question:${state.prompt}
//     `)
//        ]


//       const response=await llm.invoke(messages)
//       await deductCredits(state.userId,"pdf")
//       console.log(response)
//       return {
//         ...state,
//         aiResponse:response.content
//       }



//    } catch (error) {
//     console.log(error)
//          return {
//             ...state,
//             aiResponse:error?.data?.message || "failed to analyze pdf"
//         }
//    }finally{
//          fs.unlinkSync(state.file.path)
//    }


// }






import fs from "fs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorStore } from "../config/vectorDb.js";
import { getModel } from "../config/llmModels.js";
import {
    HumanMessage,
    SystemMessage
} from "@langchain/core/messages";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

export const pdfRag = async (state) => {

    try {
        console.log("[PDF RAG] Starting PDF analysis");

        // 1. Check agent usage limit
        await checkAgentLimit(state.userId, "pdf");

        // 2. Validate uploaded file
        if (!state.file?.path) {
            throw new Error("PDF file path is missing");
        }

        console.log("[PDF RAG] Reading PDF:", state.file.originalname);

        // 3. Read PDF
        const buffer = fs.readFileSync(state.file.path);

        const pdf = new PDFParse({
            data: buffer
        });

        // 4. Extract PDF text
        const result = await pdf.getText();
        const text = result.text;

        console.log("[PDF RAG] Extracted text length:", text.length);

        if (!text || !text.trim()) {
            throw new Error("No readable text found in the uploaded PDF");
        }

        // 5. Split extracted text into chunks
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200
        });

        const docs = await splitter.createDocuments([text]);

        console.log("[PDF RAG] Total chunks:", docs.length);

        // 6. Create a unique Qdrant collection
        const collectionName = `pdf-${Date.now()}`;

        console.log("[PDF RAG] Connecting to Qdrant");

        const store = await vectorStore(
            docs,
            collectionName
        );

        console.log("[PDF RAG] Documents stored in Qdrant");

        // 7. Search relevant PDF chunks
        const relevantDocs = await store.similaritySearch(
            state.prompt,
            3
        );

        console.log("[PDF RAG] Relevant documents found:", relevantDocs.length);

        if (!relevantDocs.length) {
            throw new Error("No relevant information found in the PDF");
        }

        // 8. Prepare context
        const context = relevantDocs
            .map(doc => doc.pageContent)
            .join("\n\n");

        // 9. Get LLM
        const llm = await getModel("pdf-rag");

        // 10. Prepare messages
        const messages = [
            new SystemMessage(`
You are CortexAI PDF Assistant.

Rules:

- Answer ONLY using information from the uploaded PDF.
- Never make up information.
- If the answer is not present in the PDF, reply:
"I couldn't find this information in the uploaded PDF."
- Use Markdown formatting.
- Give clear and concise answers.
            `),

            new HumanMessage(`
PDF Context:

${context}

User Question:

${state.prompt}
            `)
        ];

        // 11. Generate response
        console.log("[PDF RAG] Generating answer");

        // const response = await llm.invoke(messages);
        const startTime = Date.now();

const response = await llm.invoke(messages);

console.log(
    "[PDF RAG] Gemini response time:",
    (Date.now() - startTime) / 1000,
    "seconds"
);

        console.log("[PDF RAG] Answer generated successfully");

        // 12. Deduct credits
        await deductCredits(state.userId, "pdf");

        return {
            ...state,
            aiResponse: response.content
        };

    } catch (error) {

        console.error("\n========== PDF RAG ERROR ==========");
        console.error("[PDF RAG ERROR]", error);
        console.error("[PDF RAG MESSAGE]", error?.message);
        console.error("[PDF RAG CAUSE]", error?.cause);
        console.error("===================================\n");

        return {
            ...state,
            aiResponse: error?.message || "Failed to analyze PDF"
        };

    } finally {

        // 13. Safely delete uploaded temporary file
        try {
            if (state.file?.path && fs.existsSync(state.file.path)) {
                fs.unlinkSync(state.file.path);
                console.log("[PDF RAG] Temporary PDF file deleted");
            }
        } catch (cleanupError) {
            console.error(
                "[PDF RAG] File cleanup error:",
                cleanupError.message
            );
        }
    }
};
