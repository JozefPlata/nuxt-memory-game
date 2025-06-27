import type {Engine, WebGPUEngine} from "@babylonjs/core";
import type {ItemsDataT} from "~/babylon/App";
import seedrandom from "seedrandom";


export class GM {
    private static _instance: GM;
    private _engine!: Engine | WebGPUEngine;
    private _seedPhrase: string = "0123456789";
    private _itemsData!: ItemsDataT[];

    private constructor() {}

    static get Inst() { return this._instance || (this._instance = new this()) }

    set engine(engine: Engine | WebGPUEngine) { this._engine  = engine }

    get engine(): Engine | WebGPUEngine  { return this._engine }

    set seedPhrase(seed: string) { this._seedPhrase = seed }

    set itemsData(data: ItemsDataT[]) { this._itemsData = data }

    get itemsData(): ItemsDataT[] { return this._itemsData }

    get seed(): number { return seedrandom(this._seedPhrase)() }
}