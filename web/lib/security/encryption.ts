import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Recomendado para GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Obtém a chave de criptografia do ambiente.
 * Deve ter exatamente 32 bytes para AES-256.
 */
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY is not defined in environment variables.');
    }
    
    // Se a chave for hexadecimal ou base64, converta. 
    // Por simplicidade, assumimos uma string que será hasheada para garantir 32 bytes.
    return crypto.createHash('sha256').update(key).digest();
}

/**
 * Criptografa um texto plano.
 * Retorna uma string no formato iv:authTag:encryptedText
 */
export function encrypt(text: string): string {
    if (!text) return '';
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decriptografa um texto cifrado.
 */
export function decrypt(encryptedData: string): string {
    if (!encryptedData) return '';
    
    // Se não estiver no formato esperado (ex: dados antigos legados), retorna como está
    if (!encryptedData.includes(':')) return encryptedData;

    try {
        const [ivHex, authTagHex, encryptedText] = encryptedData.split(':');
        
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const key = getEncryptionKey();
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Encryption: Failed to decrypt data.', error);
        // Em caso de erro (ex: chave errada), retorna o dado cifrado para evitar crash, 
        // mas a aplicação provavelmente falhará na chamada da API.
        return encryptedData;
    }
}
