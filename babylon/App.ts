import type {Vector2} from "@babylonjs/core";
import {initEngine} from "~/babylon/Engine";
import {render} from "~/babylon/Render";
import {GM} from "~/babylon/GameManager";
import {GameScene} from "~/babylon/scenes/GameScene";

export type ItemsDataT = {
    rarity: number;
    img: string;
}

export class App {
    private readonly _canvas: HTMLCanvasElement;
    private readonly _ratio;
    constructor(
        canvas: HTMLCanvasElement,
        config: {
            ratio: Vector2;
            itemsData: ItemsDataT[],
            seedPhrase: string,
        },
    ) {
        this._canvas = canvas;
        this._ratio = config.ratio;
        GM.Inst.itemsData = config.itemsData;
        GM.Inst.seedPhrase = config.seedPhrase;
    }

    async initAsync() {
        GM.Inst.engine = await initEngine(this._canvas);
        const scene = new GameScene(this._ratio, GM.Inst.engine);
        scene.setupTiles(this._ratio);
        scene.setupGamePlay();
        // const { Inspector } = await import("@babylonjs/inspector");
        // Inspector.Show(scene, {});
        render(scene);
    }
}

