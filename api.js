const API_URL = 'https://isa-scavenger-761151e3e681.herokuapp.com';

export async function getProxyToken(action) {
    const requestBody = { script_id: 'hospital_script', action };
    const response = await fetch(`${API_URL}/get_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    const data = await response.json();
    if (data.token) return data.token;
    throw new Error('Failed to get token: ' + JSON.stringify(data));
}

export async function makeRequest(action, additionalData = {}) {
    try {
        const token = await getProxyToken(action);
        const requestBody = { 
            token, 
            action, 
            script_id: 'hospital_script', // Make sure this matches what the backend expects
            ...additionalData 
        };
        const response = await fetch(`${API_URL}/proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        return response.json();
    } catch (error) {
        console.error('makeRequest error:', error);
        throw error;
    }
}