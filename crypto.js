export const PBKDF2_ITERATIONS = 600000;
export const SALT_BYTES = 32;
export const KEY_BYTES = 32;
export const KEY_USAGE = ['encrypt', 'decrypt'];
export const ALGORITHM = { name: 'AES-GCM', length: 256 };


export async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        passwordBuffer,
        "PBKDF2",
        false,
        ["deriveBits", "deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: PBKDF2_ITERATIONS,
            hash: "SHA-256"
        },
        keyMaterial,
        ALGORITHM,
        false,
        KEY_USAGE
    );
}

export async function encryptData(data, key) {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(JSON.stringify(data));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedContent = await window.crypto.subtle.encrypt(
        {
            name: ALGORITHM.name,
            iv: iv
        },
        key,
        encodedData
    );

    return {
        iv: Array.from(iv),
        encryptedData: Array.from(new Uint8Array(encryptedContent))
    };
}

export async function decryptData(encryptedData, key) {
    const decryptedContent = await window.crypto.subtle.decrypt(
        {
            name: ALGORITHM.name,
            iv: new Uint8Array(encryptedData.iv)
        },
        key,
        new Uint8Array(encryptedData.encryptedData)
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decryptedContent));
}