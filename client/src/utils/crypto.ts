
import crypto from "crypto-js";
const secretKey = "b4a1e7d9a81d39b60f1e8f0dc8454a705a7d54b8e16b0c33a9727b876d19b2a1"; // Use your backend key

export function encryptMessage(message: string): string {
    // Encrypt using AES-CTR mode
    return crypto.AES.encrypt(message, secretKey).toString();
}

export function decryptMessage(ciphertext: string): string {
    const bytes = crypto.AES.decrypt(ciphertext, secretKey);
    return bytes.toString(crypto.enc.Utf8);
}
