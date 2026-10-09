import axios from "axios"
export const proxyWithHeader = (serviceUrl) => {
    return async (req, res) => {
        try {
            // Express removes the mounted /api/chat prefix from req.url.
            // Use req.url to forward the remaining path and query string.
            const targetUrl =
                `${serviceUrl.replace(/\/$/, "")}${req.url.startsWith("/") ? "" : "/"}${req.url}`
            console.log("[PROXY REQUEST]", {
                method: req.method,
                targetUrl,
                userId: req.user?.userId
            })
            const response = await axios({
                method: req.method,
                url: targetUrl,
                data: req.body,
                headers: {
                    "x-user-id": req.user?.userId
                },
                timeout: 60000,
                validateStatus: () => true
            })
            console.log("[PROXY RESPONSE]", {
                targetUrl,
                status: response.status
            })
            return res.status(response.status).send(response.data)
        } catch (error) {
            console.error("[PROXY ERROR]", {
                message: error.message,
                code: error.code,
                upstreamStatus: error.response?.status
            })
            return res.status(502).json({
                message: "Upstream service request failed",
                code: error.code || "PROXY_ERROR"
            })
        }
    }
}
