
export async function hash(msg: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(msg);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(e => e.toString(16).padStart(2, "0")).join("");
}

export function mapRange(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number {
    const normalized = (value - fromMin) / (fromMax - fromMin);
    return toMin + normalized * (toMax - toMin);
}