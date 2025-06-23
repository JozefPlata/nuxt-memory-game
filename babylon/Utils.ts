
export async function hash(msg: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(msg);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(e => e.toString(16).padStart(2, "0")).join("");
}