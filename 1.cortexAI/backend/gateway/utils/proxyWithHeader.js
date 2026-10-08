import axios from "axios"
export const proxyWithHeader = (serviceUrl) => {
    return async (req, res, next) => {
        try {
            const targetPath = req.originalUrl.replace(
                /^\/api\/(chat|agent|billing)/,
                ""
            )
            const targetUrl = `${serviceUrl}${targetPath}`
            console.log("========== PROXY DEBUG ==========")
            console.log("Service:", serviceUrl)
            console.log("Original URL:", req.originalUrl)
            console.log("Target URL:", targetUrl)
            console.log("Method:", req.method)
            console.log("User ID:", req.user?.userId)
            console.log("=================================")
            const response = await axios({
                method: req.method,
                url: targetUrl,
                data: req.body,
                headers: {
                    "x-user-id": req.user?.userId,
                    "content-type": req.headers["content-type"]
                },
                params: req.query,
                validateStatus: () => true
            })
            console.log("========== PROXY RESPONSE ==========")
            console.log("Status:", response.status)
            console.log("Data:", response.data)
            console.log("====================================")
            return res.status(response.status).send(response.data)
        } catch (error) {
            console.log("========== PROXY ERROR ==========")
            console.log("Message:", error.message)
            console.log("Code:", error.code)
            console.log("Status:", error.response?.status)
            console.log("Response:", error.response?.data)
            console.log("=================================")
            next(error)
        }
    }
}
