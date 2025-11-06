export interface EncryptedFileData {
  salt: Uint8Array
  iv: Uint8Array
  encryptedContent: Uint8Array
  originalFilename: string
  originalMimeType: string
  version: number
}

const ENCRYPTION_VERSION = 1
const SALT_LENGTH = 16
const IV_LENGTH = 12
const KEY_ITERATIONS = 100000

// Check if Web Crypto API is available
function checkCryptoSupport() {
  if (typeof window === 'undefined') {
    throw new Error("Encryption is only available in browser environments");
  }
  
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error("Web Crypto API is not supported in this browser or context. Please use a modern browser with HTTPS.");
  }
}

// Convert string to Uint8Array
function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

// Convert Uint8Array to string
function uint8ArrayToString(arr: Uint8Array): string {
  return new TextDecoder().decode(arr)
}

// Generate cryptographic key from password
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  checkCryptoSupport();
  
  const passwordBuffer = stringToUint8Array(password)

  try {
    // Import password as key material
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw", 
      passwordBuffer, 
      "PBKDF2", 
      false, 
      ["deriveKey"]
    )

    // Derive AES key using PBKDF2
    return window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: KEY_ITERATIONS,
        hash: "SHA-256",
      },
      keyMaterial,
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["encrypt", "decrypt"],
    )
  } catch (error) {
    throw new Error(`Failed to derive encryption key: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// Read file as ArrayBuffer
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsArrayBuffer(file)
  })
}

// Serialize encrypted data to binary format
function serializeEncryptedData(data: EncryptedFileData): Uint8Array {
  const filenameBytes = stringToUint8Array(data.originalFilename)
  const mimeTypeBytes = stringToUint8Array(data.originalMimeType)

  // Calculate total size
  const totalSize =
    4 + // version (4 bytes)
    4 + // filename length (4 bytes)
    4 + // mime type length (4 bytes)
    4 + // salt length (4 bytes)
    4 + // iv length (4 bytes)
    4 + // content length (4 bytes)
    filenameBytes.length +
    mimeTypeBytes.length +
    data.salt.length +
    data.iv.length +
    data.encryptedContent.length

  const result = new Uint8Array(totalSize)
  const view = new DataView(result.buffer)

  let offset = 0

  // Write version
  view.setUint32(offset, data.version, true)
  offset += 4

  // Write filename length and data
  view.setUint32(offset, filenameBytes.length, true)
  offset += 4
  result.set(filenameBytes, offset)
  offset += filenameBytes.length

  // Write mime type length and data
  view.setUint32(offset, mimeTypeBytes.length, true)
  offset += 4
  result.set(mimeTypeBytes, offset)
  offset += mimeTypeBytes.length

  // Write salt length and data
  view.setUint32(offset, data.salt.length, true)
  offset += 4
  result.set(data.salt, offset)
  offset += data.salt.length

  // Write IV length and data
  view.setUint32(offset, data.iv.length, true)
  offset += 4
  result.set(data.iv, offset)
  offset += data.iv.length

  // Write content length and data
  view.setUint32(offset, data.encryptedContent.length, true)
  offset += 4
  result.set(data.encryptedContent, offset)

  return result
}

// Deserialize encrypted data from binary format
function deserializeEncryptedData(data: Uint8Array): EncryptedFileData {
  const view = new DataView(data.buffer)
  let offset = 0

  // Read version
  const version = view.getUint32(offset, true)
  offset += 4

  if (version !== ENCRYPTION_VERSION) {
    throw new Error("Unsupported encryption version")
  }

  // Read filename
  const filenameLength = view.getUint32(offset, true)
  offset += 4
  const filenameBytes = data.slice(offset, offset + filenameLength)
  const originalFilename = uint8ArrayToString(filenameBytes)
  offset += filenameLength

  // Read mime type
  const mimeTypeLength = view.getUint32(offset, true)
  offset += 4
  const mimeTypeBytes = data.slice(offset, offset + mimeTypeLength)
  const originalMimeType = uint8ArrayToString(mimeTypeBytes)
  offset += mimeTypeLength

  // Read salt
  const saltLength = view.getUint32(offset, true)
  offset += 4
  const salt = data.slice(offset, offset + saltLength)
  offset += saltLength

  // Read IV
  const ivLength = view.getUint32(offset, true)
  offset += 4
  const iv = data.slice(offset, offset + ivLength)
  offset += ivLength

  // Read encrypted content
  const contentLength = view.getUint32(offset, true)
  offset += 4
  const encryptedContent = data.slice(offset, offset + contentLength)

  return {
    version,
    originalFilename,
    originalMimeType,
    salt,
    iv,
    encryptedContent: new Uint8Array(encryptedContent),
  }
}

// Encrypt file
export async function encryptFile(
  file: File,
  password: string,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  try {
    checkCryptoSupport();
    onProgress?.(20)

    // Generate random salt and IV
    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH))

    onProgress?.(30)

    // Derive encryption key
    const key = await deriveKey(password, salt)

    onProgress?.(50)

    // Read file content
    const fileContent = await readFileAsArrayBuffer(file)

    onProgress?.(70)

    // Encrypt the file content
    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      fileContent,
    )

    onProgress?.(90)

    // Create encrypted file data structure
    const encryptedFileData: EncryptedFileData = {
      version: ENCRYPTION_VERSION,
      originalFilename: file.name,
      originalMimeType: file.type || "application/octet-stream",
      salt,
      iv,
      encryptedContent: new Uint8Array(encryptedContent),
    }

    // Serialize to binary format
    const serializedData = serializeEncryptedData(encryptedFileData)

    // Create and return a proper Blob
    const blob = new Blob([serializedData], { type: "application/octet-stream" })

    // Validate the blob was created successfully
    if (!blob || blob.size === 0) {
      throw new Error("Failed to create encrypted file blob")
    }

    return blob
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Decrypt file
export async function decryptFile(
  file: File,
  password: string,
  onProgress?: (progress: number) => void,
): Promise<{ decryptedData: Blob; filename: string; mimeType: string }> {
  try {
    checkCryptoSupport();
    onProgress?.(20)

    // Read encrypted file
    const encryptedBuffer = await readFileAsArrayBuffer(file)
    const encryptedData = new Uint8Array(encryptedBuffer)

    onProgress?.(40)

    // Deserialize encrypted data
    let fileData: EncryptedFileData
    try {
      fileData = deserializeEncryptedData(encryptedData)
    } catch (error) {
      throw new Error("Invalid file format: File is not a valid encrypted file")
    }

    onProgress?.(60)

    // Derive decryption key
    const key = await deriveKey(password, fileData.salt)

    onProgress?.(80)

    // Decrypt the content
    let decryptedContent: ArrayBuffer
    try {
      decryptedContent = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: fileData.iv,
        },
        key,
        fileData.encryptedContent,
      )
    } catch (error) {
      throw new Error("Invalid password or corrupted file: Decryption failed")
    }

    onProgress?.(95)

    // Create decrypted blob with proper validation
    const decryptedBlob = new Blob([decryptedContent], { type: fileData.originalMimeType })

    // Validate the blob was created successfully
    if (!decryptedBlob || decryptedBlob.size === 0) {
      throw new Error("Failed to create decrypted file blob")
    }

    return {
      decryptedData: decryptedBlob,
      filename: fileData.originalFilename,
      mimeType: fileData.originalMimeType,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Decryption failed: Unknown error")
  }
}
