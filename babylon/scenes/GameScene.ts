import {
    type AbstractMesh,
    Color3,
    Color4,
    type Engine,
    FreeCamera,
    HemisphericLight,
    Scene,
    type Vector2,
    Vector3,
    type WebGPUEngine
} from "@babylonjs/core";
import {Tile, TileState, type TileT} from "~/babylon/Tiles/Tile";

enum PairCode {
    LEFT = "left",
    RIGHT = "right",
}

export class GameScene extends Scene {
    private _tiles: Map<string, TileT> = new Map();
    private _pair = new Map<PairCode, TileT>();

    constructor(ratio: Vector2, engine: Engine | WebGPUEngine) {
        super(engine);
        this.clearColor = new Color4(0, 0, 0, 0);

        const light = new HemisphericLight("light", Vector3.Forward(), this);
        light.intensity = 0.7;

        const camera = new FreeCamera("camera", new Vector3(ratio.x * 0.5, ratio.y * 0.5, 150), this);
        camera.fov = 0.1;
        camera.target = new Vector3(ratio.x * 0.5, ratio.y * 0.5, 0);
    }

    setupTiles(ratio: Vector2) {
        for (let x = 0; x < ratio.x; x++) {
            for (let y = 0; y < ratio.y; y++) {
                const tile = new Tile(x, y, Color3.Random(), 0, this)
                this._tiles.set(tile.name, tile);
            }
        }
    }

    setupGamePlay() {
        let prevMesh: AbstractMesh | null = null;
        this.onPointerMove = () => {
            const info = this.pick(this.pointerX, this.pointerY);
            const currMesh = info.hit ? info.pickedMesh : null;

            if (prevMesh && prevMesh !== currMesh) {
                const prevAsset = this._tiles.get(prevMesh.name);
                prevAsset?.stateMachine.setState(TileState.IDLE);
            }

            if (currMesh) {
                const asset = this._tiles.get(currMesh.name);
                asset?.stateMachine.setState(TileState.ON_HOVER);
            }

            prevMesh = currMesh;
        }

        this.onPointerDown = (_, info) => {
            if (info.pickedMesh) {
                const asset = this._tiles.get(info.pickedMesh.name);
                const left = this._pair.get(PairCode.LEFT);
                const right = this._pair.get(PairCode.RIGHT);

                if (asset) {
                    if (!left && !right) {
                        this._pair.set(PairCode.LEFT, asset);
                    } else if (left && !right) {
                        this._pair.set(PairCode.RIGHT, asset);
                    } else if (left && right) {
                        if (left.rarity === right.rarity) {
                            left.itemMesh.dispose();
                            right.itemMesh.dispose();
                            this._pair.delete(PairCode.LEFT);
                            this._pair.delete(PairCode.RIGHT);
                        } else {
                            this._pair.delete(PairCode.LEFT);
                            this._pair.delete(PairCode.RIGHT);
                        }
                    }
                }

                asset?.stateMachine.setState(TileState.PICKED);
            }
        }
    }
}