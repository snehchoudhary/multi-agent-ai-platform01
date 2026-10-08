import proxy from "express-http-proxy"
export const proxyWithHeader = (serviceUrl) => {
    return proxy(serviceUrl, {
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            console.log("========== PROXY DEBUG ==========")
            console.log("Service URL:", serviceUrl)
            console.log("Original URL:", srcReq.originalUrl)
            console.log("Proxy URL:", srcReq.url)
            console.log("User:", srcReq.user)
            if (srcReq.user) {
                proxyReqOpts.headers["x-user-id"] = srcReq.user.userId
            }
            console.log("Headers:", proxyReqOpts.headers)
            console.log("=================================")
            return proxyReqOpts
        },
        proxyErrorHandler: (err, res, next) => {
            console.log("========== PROXY ERROR ==========")
            console.log(err)
            console.log("=================================")
            next(err)
        }
    })
}
