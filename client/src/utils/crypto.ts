
import crypto from "crypto-js";
const secretKey = "b4a1e7d9a81d39b60f1e8f0dc8454a705a7d54b8e16b0c33a9727b876d19b2a1";

export function encryptMessage(message: string): string {
    return crypto.AES.encrypt(message, secretKey).toString();
}

export function decryptMessage(ciphertext: string): string {
    const bytes = crypto.AES.decrypt(ciphertext, secretKey);
    return bytes.toString(crypto.enc.Utf8);
}
