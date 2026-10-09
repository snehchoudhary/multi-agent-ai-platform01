import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware"
export const proxyWithHeader = (serviceUrl) => {
    return createProxyMiddleware({
        target: serviceUrl,
        changeOrigin: true,
        on: {
            proxyReq: (proxyReq, req, res) => {
                if (req.user?.userId) {
                    proxyReq.setHeader("x-user-id", req.user.userId)
                }
                // Restore parsed JSON bodies; multipart uploads remain streamed.
                fixRequestBody(proxyReq, req, res)
                console.log("[PROXY REQUEST]", {
                    method: req.method,
                    path: req.url,
                    target: serviceUrl,
                    userId: req.user?.userId
                })
            },
            error: (err, req, res) => {
                console.error("[PROXY ERROR]", {
                    message: err.message,
                    code: err.code,
                    path: req.url
                })
                if (!res.headersSent) {
                    res.status(502).json({
                        message: "Upstream service request failed"
                    })
                }
            }
        }
    })
}
