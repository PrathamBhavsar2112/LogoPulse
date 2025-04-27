document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const imageInput = document.getElementById('imageInput');
    const uploadButton = document.getElementById('uploadButton');
    const previewDiv = document.getElementById('preview');
    const statusDiv = document.getElementById('status');
    const resultsDiv = document.getElementById('results');
    const historyDiv = document.getElementById('history');

    const apiUrl = window.location.origin || 'http://localhost:3000';

    let selectedFile = null;

    async function fetchHistory() {
        try {
            const response = await fetch(`${apiUrl}/history`);
            if (!response.ok) throw new Error('Failed to fetch history');
            const history = await response.json();
            historyDiv.innerHTML = '<h2>Upload History</h2>';
            historyDiv.innerHTML += '<table><tr><th>Image</th><th>Key</th><th>Label</th></tr>' + 
                history.map(item => `
                    <tr>
                        <td><img src="${item.ImageUrl}" width="100"></td>
                        <td>${item.ImageKey}</td>
                        <td>${item.Label && item.Label.Name !== 'None' ? `${item.Label.Name} (${item.Label.Confidence.toFixed(1)}%)` : 'None'}</td>
                    </tr>
                `).join('') + '</table>';
        } catch (error) {
            console.error('Error fetching history:', error);
            historyDiv.innerHTML = '<p>Error loading history.</p>';
        }
    }
    
    function drawBoundingBox(imageElement, label) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = imageElement.width;
        canvas.height = imageElement.height;
        ctx.drawImage(imageElement, 0, 0);
        
        if (label && label.BoundingBox && Object.keys(label.BoundingBox).length > 0) {
            const box = label.BoundingBox;
            const x = box.Left * canvas.width;
            const y = box.Top * canvas.height;
            const width = box.Width * canvas.width;
            const height = box.Height * canvas.height;
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
            ctx.fillStyle = 'red';
            ctx.font = '16px Arial';
            ctx.fillText(`${label.Name} (${label.Confidence.toFixed(1)}%)`, x, y - 5);
        }
        
        imageElement.parentNode.replaceChild(canvas, imageElement);
    }

    function resetUI() {
        previewDiv.innerHTML = '';
        statusDiv.textContent = '';
        statusDiv.className = 'status';
        resultsDiv.innerHTML = '';
        uploadButton.disabled = true;
        imageInput.value = '';
        selectedFile = null;
    }

    imageInput.addEventListener('change', (event) => {
        selectedFile = event.target.files[0];
        if (!selectedFile) {
            resetUI();
            return;
        }

        if (!selectedFile.type.match('image/(jpeg|png)')) {
            alert('Please select a JPEG or PNG image.');
            resetUI();
            return;
        }

        uploadButton.disabled = false;

        const reader = new FileReader();
        reader.onload = (e) => {
            previewDiv.innerHTML = `<img src="${e.target.result}" alt="Image preview">`;
        };
        reader.readAsDataURL(selectedFile);
    });

    uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!selectedFile) {
            alert('Please select an image file.');
            return;
        }

        uploadButton.disabled = true;
        statusDiv.textContent = 'Uploading image...';
        statusDiv.className = 'status loading';
        resultsDiv.innerHTML = '';

        try {
            const fileExtension = selectedFile.name.split('.').pop();
            const timestamp = new Date().getTime();
            const randomString = Math.random().toString(36).substring(2, 15);
            const key = `${timestamp}-${randomString}.${fileExtension}`;

            console.log('Uploading file:', {
                name: selectedFile.name,
                size: selectedFile.size,
                type: selectedFile.type,
                key: key
            });

            const blob = await selectedFile.arrayBuffer();
            const contentType = selectedFile.type;
            console.log('File blob size:', blob.byteLength);

            const uploadUrl = `${apiUrl}/upload/${key}`;
            console.log('Upload URL:', uploadUrl);

            const response = await fetch(uploadUrl, {
                method: 'POST',
                body: blob,
                headers: {
                    'Content-Type': contentType
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload failed with status:', response.status, 'Response:', errorText);
                throw new Error(`Upload failed: ${response.status} - ${errorText}`);
            }

            const responseData = await response.json();
            console.log('Upload response:', responseData);

            const imageId = responseData.imageId;
            if (!imageId || imageId === 'unknown') {
                throw new Error('Invalid imageId received from upload response');
            }

            statusDiv.textContent = 'Image uploaded! Processing...';
            const results = await pollForResults(imageId);
            statusDiv.textContent = 'Processing complete!';
            statusDiv.className = 'status success';
            resultsDiv.innerHTML = `
                <p>Image processed successfully!</p>
                <p>Image key: ${responseData.key}</p>
                <p>Detected label: ${results.Label && results.Label.Name !== 'None' ? `${results.Label.Name} (${results.Label.Confidence.toFixed(1)}%)` : 'None'}</p>
            `;

            const imgElement = previewDiv.querySelector('canvas') || previewDiv.querySelector('img');
            if (results.Label && results.Label.Name !== 'None') {
                drawBoundingBox(imgElement, results.Label);
            }

            fetchHistory();
            uploadButton.disabled = false;

        } catch (error) {
            console.error('Error during upload:', error);
            statusDiv.textContent = `Error: ${error.message}`;
            statusDiv.className = 'status error';
            resetUI();
        }
    });

    async function pollForResults(imageId) {
        const resultUrl = `${apiUrl}/results/${imageId}`;
        console.log('Starting polling for imageId:', imageId);

        for (let i = 0; i < 30; i++) {
            try {
                console.log(`Polling attempt ${i + 1}/30: ${resultUrl}`);
                const response = await fetch(resultUrl, { method: 'GET' });
                console.log('Poll response status:', response.status);

                if (response.status === 200) {
                    const results = await response.json();
                    console.log('Poll results:', results);
                    return results;
                }
                if (response.status !== 404) {
                    const errorText = await response.text();
                    console.error('Poll failed with status:', response.status, 'Response:', errorText);
                    throw new Error(`Failed to fetch results: ${response.status} - ${errorText}`);
                }
                console.info(`Results not ready yet (attempt ${i + 1}/30), status: 404`);
            } catch (error) {
                console.error('Poll error:', error);
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        throw new Error('Timeout waiting for label detection results');
    }

    fetchHistory();
});