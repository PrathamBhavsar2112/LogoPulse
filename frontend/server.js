const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const port = 3000;

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'https://<your-api-id>.execute-api.us-east-1.amazonaws.com/prod';

app.use(express.static(path.join(__dirname)));
app.use(express.raw({ type: '*/*', limit: '10mb' }));

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.post('/upload/:key', async (req, res) => {
    try {
        const key = req.params.key;
        const apiUrl = `${API_GATEWAY_URL}/upload/${key}`;

        const contentType = req.headers['content-type'] || 'application/octet-stream';
        if (!contentType.match(/image\/(jpeg|png)/)) {
            console.error('Invalid Content-Type:', contentType);
            return res.status(400).json({ error: 'Unsupported Content-Type. Only image/jpeg and image/png are supported.' });
        }

        console.log('Upload request received:', {
            key: key,
            bodyLength: req.body.length,
            contentType: contentType
        });

        const response = await axios.post(apiUrl, req.body, {
            headers: {
                'Content-Type': contentType
            },
            responseType: 'json'
        });

        console.log('Upload response from API Gateway:', response.data);
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Proxy error in /upload:', error);
        if (error.response) {
            console.error('API Gateway error response:', {
                status: error.response.status,
                data: error.response.data
            });
            res.status(error.response.status).json({ error: error.response.data });
        } else {
            console.error('Network or other error:', error.message);
            res.status(500).json({ error: 'Internal server error: ' + error.message });
        }
    }
});

app.get('/results/:imageId', async (req, res) => {
    try {
        const imageId = req.params.imageId;
        const apiUrl = `${API_GATEWAY_URL}/results/${imageId}`;

        console.log('Results request received for imageId:', imageId);

        const response = await axios.get(apiUrl, {
            responseType: 'json'
        });

        console.log('Results response from API Gateway:', response.data);
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Proxy error in /results:', error);
        if (error.response) {
            console.error('API Gateway error response:', {
                status: error.response.status,
                data: error.response.data
            });
            res.status(error.response.status).json({ error: error.response.data });
        } else {
            console.error('Network or other error:', error.message);
            res.status(500).json({ error: 'Internal server error: ' + error.message });
        }
    }
});

app.get('/history', async (req, res) => {
    try {
        const apiUrl = `${API_GATEWAY_URL}/history`;
        console.log('History request received');

        const response = await axios.get(apiUrl, {
            responseType: 'json'
        });

        // Add the S3 URL to each history item
        const history = response.data.map(item => ({
            ...item,
            ImageUrl: `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${item.ImageKey}`
        }));

        console.log('History response from API Gateway:', history);
        res.status(response.status).json(history);
    } catch (error) {
        console.error('Proxy error in /history:', error);
        if (error.response) {
            console.error('API Gateway error response:', {
                status: error.response.status,
                data: error.response.data
            });
            res.status(error.response.status).json({ error: error.response.data });
        } else {
            console.error('Network or other error:', error.message);
            res.status(500).json({ error: 'Internal server error: ' + error.message });
        }
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Label Detection App running on port ${port}`);
});