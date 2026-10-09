import axios from "axios"
import { graph } from "../graph/graph.js"
import { addMessage } from "../config/memory.js"
export const agent = async (req, res, next) => {
    try {
        const { prompt, conversationId, agent } = req.body
        const file = req.file
        const userId = req.headers["x-user-id"]
        console.log("[AGENT] Request received", {
            agent, conversationId, userId, hasPrompt: Boolean(prompt)
        })
        console.log("[AGENT] Saving user message to Chat service")
        await axios.post(
            `${process.env.CHAT_SERVICE}/save-message`,
            { conversationId, role: "user", content: prompt },
            { timeout: 15000 }
        )
        console.log("[AGENT] User message saved")
        console.log("[AGENT] Invoking graph")
        const result = await graph.invoke({
            prompt, conversationId, agent, userId, file
        })
        console.log("[AGENT] Graph completed", {
            hasResponse: Boolean(result?.aiResponse),
            responseType: typeof result?.aiResponse
        })
        console.log("[AGENT] Saving user message to memory")
        await addMessage(conversationId, "user", prompt)
        console.log("[AGENT] User memory saved")
        console.log("[AGENT] Saving assistant message to memory")
        await addMessage(conversationId, "assistant", result.aiResponse)
        console.log("[AGENT] Assistant memory saved")
        console.log("[AGENT] Saving assistant message to Chat service")
        await axios.post(
            `${process.env.CHAT_SERVICE}/save-message`,
            {
                conversationId,
                role: "assistant",
                content: result?.aiResponse,
                images: result?.images,
                artifacts: result?.artifacts
            },
            { timeout: 15000 }
        )
        console.log("[AGENT] Assistant message saved")
        console.log("[AGENT] Returning successful response")
        return res.status(200).json({
            answer: result?.aiResponse,
            images: result?.images,
            artifacts: result?.artifacts
        })
    } catch (err) {
        console.error("[AGENT CONTROLLER ERROR]", {
            message: err?.message,
            code: err?.code,
            status: err?.response?.status,
            response: err?.response?.data,
            stack: err?.stack
        })
        return next(err)
    }
}
