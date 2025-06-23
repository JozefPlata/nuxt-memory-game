import {Engine, WebGPUEngine} from "@babylonjs/core";

export async function initEngine(canvas: HTMLCanvasElement): Promise<Engine | WebGPUEngine> {
    let gpuSupported = true;
    if (!navigator.gpu) { gpuSupported = false }
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) { gpuSupported = false }

    if (gpuSupported) {
        const engine = new WebGPUEngine(canvas);
        await engine.initAsync();
        return engine;
    } else {
        return new Engine(canvas, true);
    }
}