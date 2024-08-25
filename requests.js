import { makeRequest } from "./api.js";
import { getCurrentUser, getCurrentKey } from './store.js';
import { loadData, saveData } from './dataManager.js';

export async function loadRequests() {
    const requests = await fetchRequests();
    displayRequests(requests);
}

export function displayRequests(requests) {
    const requestsList = document.getElementById('requestsList');
    requestsList.innerHTML = requests.map(request => `
        <div class="request-item">
            <h3>${request.title}</h3>
            <p>${request.message}</p>
            <p>Requested data: ${request.requestedData.join(', ')}</p>
            <p>Date range: ${request.dateRange.start} to ${request.dateRange.end}</p>
            <div class="request-actions">
                <button onclick="handleRequestAction(${request.id}, true)">Accept</button>
                <button onclick="handleRequestAction(${request.id}, false)">Decline</button>
            </div>
        </div>
    `).join('');
}

export async function handleRequestAction(requestId, isAccepted) {
    if (isAccepted) {
        const confirmationResult = await showConfirmationDialog(requestId);
        if (confirmationResult) {
            await sendRequestedData(requestId, confirmationResult);
        }
    } else {
        await declineRequest(requestId);
    }
    await loadRequests(); // Refresh the requests list
}

export async function encryptDataForRequest(data, requestId) {
    // Implement encryption using the requestId as the public key
    // This is a placeholder and should be replaced with actual encryption logic
    return JSON.stringify(data); // For now, we're just stringifying the data
}

export async function fetchRequests() {
    try {
        const response = await makeRequest('fetchRequests');
        return response.requests || [];
    } catch (error) {
        console.error('Failed to fetch requests:', error);
        return [];
    }
}

export function showConfirmationDialog(requestId) {
    return new Promise((resolve) => {
        // Implement a modal or dialog here to confirm data sharing
        // For simplicity, we'll use a basic confirm dialog
        const confirmed = confirm("Are you sure you want to share the requested data?");
        if (confirmed) {
            const message = prompt("Enter a message for the healthcare provider (optional):");
            resolve({ confirmed, message });
        } else {
            resolve(null);
        }
    });
}

export async function sendRequestedData(requestId, confirmationResult) {
    const currentUser = getCurrentUser();
    const currentKey = getCurrentKey();
    try {
        const data = await loadData(currentUser, currentKey);
        const requestedData = {}; // Collect and structure the requested data here
        
        // Encrypt the data using the requestId as the public key
        const encryptedData = await encryptDataForRequest(requestedData, requestId);
        
        // Send the encrypted data
        await makeRequest('sendRequestedData', {
            requestId,
            encryptedData,
            message: confirmationResult.message
        });
        
        alert('Data sent successfully!');
    } catch (error) {
        console.error('Failed to send requested data:', error);
        alert('Failed to send data. Please try again.');
    }
}
