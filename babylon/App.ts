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
        },
    ) {
        this._canvas = canvas;
        this._ratio = config.ratio;
        GM.Inst.itemsData = config.itemsData;
    }

    async initAsync() {
        GM.Inst.engine = await initEngine(this._canvas);
        const scene = new GameScene(this._ratio, GM.Inst.engine);
        await scene.setupGUI();
        scene.setupTiles();
        scene.setupGamePlay();
        const { Inspector } = await import("@babylonjs/inspector");
        Inspector.Show(scene, {});
        render(scene);
    }
}

