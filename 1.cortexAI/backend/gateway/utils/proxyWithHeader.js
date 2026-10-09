import axios from "axios"
export const proxyWithHeader = (serviceUrl) => {
    return async (req, res) => {
        const targetPath = req.originalUrl.replace(
            /^\/api\/(chat|agent|billing)/,
            ""
        )
        const targetUrl = `${serviceUrl.replace(/\/$/, "")}${targetPath}`
        try {
            console.log("[PROXY REQUEST]", {
                method: req.method,
                targetUrl,
                userId: req.user?.userId
            })
            const headers = {
                "x-user-id": req.user?.userId
            }
            if (req.headers["content-type"]) {
                headers["content-type"] = req.headers["content-type"]
            }
            const response = await axios({
                method: req.method,
                url: targetUrl,
                data: req.body,
                headers,
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
                targetUrl,
                message: error.message,
                code: error.code,
                upstreamStatus: error.response?.status,
                upstreamData: error.response?.data
            })
            return res.status(502).json({
                message: "Upstream service request failed",
                code: error.code || "PROXY_ERROR"
            })
        }
    }
}
