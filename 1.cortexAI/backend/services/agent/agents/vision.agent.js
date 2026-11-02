
import { getModel } from "../config/llmModels.js";
import axios from "axios";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { getFromS3 } from "../utils/getFromS3.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const visionAgent = async (state) => {
    try {
        // 1. Check user's image generation limit
        await checkAgentLimit(state.userId, "image");

        // 2. Generate an improved image prompt
        const llm = await getModel("image");

        const res = await llm.invoke(`
You are an elite AI image prompt engineer.

Convert the user's request into a highly detailed image generation prompt.

Requirements:
- Cinematic lighting
- Professional composition
- Ultra realistic
- High detail
- Beautiful color palette
- Sharp focus
- 8K quality
- Photorealistic
- Depth of field
- Professional photography
- Stunning visuals

Return only the image prompt.

User Request:
${state.prompt}
        `);

        const prompt = res.content.trim();

        if (!prompt) {
            throw new Error("Failed to generate image prompt.");
        }

        // 3. Generate image using Pollinations
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

        let imageRes;
        let lastError;

        // Initial attempt + 2 retries for temporary server errors
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(`[VISION] Pollinations attempt ${attempt}/3`);

                imageRes = await axios.get(imageUrl, {
                    responseType: "arraybuffer",
                    timeout: 120000
                });

                break;

            } catch (error) {
                lastError = error;

                const status = error.response?.status;

                console.error("[POLLINATIONS ERROR]", {
                    status,
                    message: error.message,
                    attempt
                });

                // Payment/quota restriction: don't retry
                if (status === 402) {
                    throw new Error(
                        "Pollinations free image-generation limit reached. Please try again later."
                    );
                }

                // Retry temporary server errors
                if (status === 503 && attempt < 3) {
                    await delay(3000 * attempt);
                    continue;
                }

                throw error;
            }
        }

        if (!imageRes) {
            throw lastError || new Error("Image generation failed.");
        }

        // 4. Validate generated image
        const contentType = imageRes.headers["content-type"] || "";

        if (!contentType.startsWith("image/")) {
            const responseText = Buffer.from(imageRes.data)
                .toString("utf8")
                .slice(0, 500);

            console.error("[INVALID IMAGE RESPONSE]", responseText);

            throw new Error("Image provider returned an invalid image.");
        }

        const buffer = Buffer.from(imageRes.data);

        if (!buffer.length) {
            throw new Error("Generated image is empty.");
        }

        console.log("[VISION] Image received:", {
            contentType,
            size: buffer.length
        });

        // 5. Upload image to S3
        const extension = contentType.includes("jpeg") ? "jpg" : "png";
        const filename = `image-${Date.now()}.${extension}`;

        await uploadToS3(filename, buffer, contentType);

        console.log("[VISION] Image uploaded to S3:", filename);

        // 6. Generate signed download URL (10 minutes)
        const downloadUrl = await getFromS3(filename, 10 * 60);

        // 7. Deduct credits after successful generation and upload
        await deductCredits(state.userId, "vision");

        // 8. Return response
        return {
            ...state,
            aiResponse: `
![Generated Image](${downloadUrl})

📥 [Download Image](${downloadUrl})

⏳ Link expires in 10 minutes.
            `
        };

    } catch (error) {
        console.error("[VISION ERROR]", error);
        console.error("[VISION MESSAGE]", error?.message);

        if (error.response) {
            console.error("[VISION HTTP STATUS]", error.response.status);

            const responseBody = Buffer.from(error.response.data || [])
                .toString("utf8")
                .slice(0, 1000);

            console.error("[VISION HTTP BODY]", responseBody);
        }

        return {
            ...state,
            aiResponse: error.message || "Failed to generate image."
        };
    }
};
