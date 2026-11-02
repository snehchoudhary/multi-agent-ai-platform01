
import { getModel } from "../config/llmModels.js";
import { generatePdf } from "../utils/generatePdf.js";
import { getFromS3 } from "../utils/getFromS3.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

const pdfSchema = {
    type: "object",
    properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        sections: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    heading: { type: "string" },
                    points: {
                        type: "array",
                        items: { type: "string" }
                    }
                },
                required: ["heading", "points"]
            }
        }
    },
    required: ["title", "subtitle", "sections"]
};

export const pdfAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "pdf");

        const llm = await getModel("pdf");
        const structuredLlm = llm.withStructuredOutput(pdfSchema);

        const data = await structuredLlm.invoke(`
            You are an expert document writer.

            Create a detailed, well-organized document on:

            ${state.prompt}

            Requirements:
            - Generate 4 to 8 sections.
            - Each section must have 3 to 6 concise points.
            - Use informative headings.
            - Follow the provided output schema.
        `);

        if (
            !data ||
            !data.title ||
            !Array.isArray(data.sections) ||
            data.sections.length === 0
        ) {
            throw new Error("Invalid document content returned by AI.");
        }

        const pdfBuffer = await generatePdf(data);

        if (!pdfBuffer) {
            throw new Error("PDF generation returned an empty file.");
        }

        const filename = `pdf-${Date.now()}.pdf`;

        await uploadToS3(filename, pdfBuffer, "application/pdf");

        const downloadUrl = await getFromS3(filename, 24 * 60);

        await deductCredits(state.userId, "pdf");

        return {
            ...state,
            aiResponse: `# PDF Generated

**${data.title}**

📥 [Download PDF](${downloadUrl})

_Link expires in 10 minutes._`
        };

    } catch (error) {
        console.error("[PDF AGENT ERROR]", error);

        return {
            ...state,
            aiResponse: error?.message || "Failed to generate PDF."
        };
    }
};
