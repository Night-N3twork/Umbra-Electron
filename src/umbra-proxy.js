export function UmbraProxy(app, axios, URL, contentType) {
    app.post("/api/fetch", async (req, res) => {
        try {
            const response = await axios.post("https://api.cobalt.tools/api/json", req.body, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            });
            res.status(response.status).send(response.data);
        } catch (error) {
            console.error(`Error while proxying request: ${error.message}`);
            if (error.response) {
                res.status(error.response.status).send(error.response.data);
            } else {
                res.status(500).send("Internal Server Error");
            }
        }
    });
    
    app.use('/api/proxy/:url(*)', async (req, res) => {
        const { url } = req.params;
        let decodedUrl, proxiedUrl;
        try {
            decodedUrl = decodeURIComponent(url);
            proxiedUrl = decodedUrl;
        } catch (err) {
            console.error(`Failed to decode or decrypt URL: ${err}`);
            return res.status(400).send("Invalid URL");
        }
    
        try {
            const assetUrl = new URL(proxiedUrl);
            const assetResponse = await axios.get(assetUrl.toString(), { responseType: 'arraybuffer' });
    
            const contentTypeHeader = assetResponse.headers['content-type'];
            const parsedContentType = contentTypeHeader ? contentType.parse(contentTypeHeader).type : '';
    
            res.writeHead(assetResponse.status, {
                "Content-Type": parsedContentType
            });
    
            res.end(Buffer.from(assetResponse.data));
        } catch (err) {
            console.error(`Failed to fetch proxied URL: ${err}`);
            res.status(500).send("Failed to fetch proxied URL");
        }
    });
}