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
import {
    type ColorPicker,
    AdvancedDynamicTexture,
    type Button,
    type TextBlock
} from "@babylonjs/gui";
import {mapRange} from "~/babylon/Utils";
import {GM} from "~/babylon/GameManager";

enum PairCode {
    LEFT = "left",
    RIGHT = "right",
}

export class GameScene extends Scene {
    private _tiles: Map<string, TileT> = new Map();
    private _pair = new Map<PairCode, TileT>();
    private _selection: TileT[] = [];
    private _minColor!: Color3;
    private _maxColor!: Color3;
    private _ratio!: Vector2;

    constructor(ratio: Vector2, engine: Engine | WebGPUEngine) {
        super(engine);
        this._ratio = ratio;
        this.clearColor = new Color4(0, 0, 0, 0);

        const light = new HemisphericLight("light", Vector3.Forward(), this);
        light.intensity = 0.7;

        const camera = new FreeCamera("camera", new Vector3(ratio.x * 0.5, ratio.y * 0.5, 150), this);
        camera.fov = 0.1;
        camera.target = new Vector3(ratio.x * 0.5, ratio.y * 0.5, 0);
    }

    reset(): void {
        for (const [_, tile] of this._tiles) {
            tile.dispose();
        }
        this._tiles = new Map();
        this._pair = new Map();
    }

    setupTiles() {
        const colors: Color3[] = [];
        for (let i = 0; i < this._ratio.x * this._ratio.y; i++) {
            const v = mapRange(i, 0, this._ratio.x * this._ratio.y - 1, 0, 1);
            colors.push(new Color3(v, v, v));
        }

        const tiles: Tile[] = [];
        for (let x = 0; x < this._ratio.x; x++) {
            for (let y = 0; y < this._ratio.y; y++) {
                const id = y * this._ratio.x + x;
                const rarity = mapRange(id, 0, y * x + x, 0, 10);
                const tile = new Tile(x, y, id, colors[id], rarity, this)
                tile.setRampColor(this._minColor, this._maxColor);
                tiles.push(tile);
                this._tiles.set(tile.name, tile);
            }
        }

        const shuffledTiles = shuffleWithSeed(tiles, GM.Inst.seed);
        for (let x = 0; x < this._ratio.x; x++) {
            for (let y = 0; y < this._ratio.y; y++) {
                const id = y * this._ratio.x + x;
                shuffledTiles[id].setPosition(x, y);
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
                if (asset) {
                    if (this._selection.length < 2) {
                        this._selection.push(asset);
                    } else {
                        this._selection = [];
                    }

                    if (this._selection.length == 2) {
                        if (this._selection[0].rarity === this._selection[1].rarity) {
                            console.log(this._selection[0].rarity, this._selection[1].rarity);
                            setTimeout(() => {
                                this._selection[0].dispose();
                                this._selection[1].dispose();
                                this._selection = [];
                            }, 150);
                        } else {
                            setTimeout(() => {
                                this._selection[0].stateMachine.setState(TileState.NONE);
                                this._selection[1].stateMachine.setState(TileState.NONE);
                                this._selection = [];
                            }, 150);
                        }
                    }

                    asset.stateMachine.setState(TileState.PICKED);
                    //
                }
            }
        }
    }

    async setupGUI() {
        let texture = AdvancedDynamicTexture.CreateFullscreenUI("gui", true, this);
        texture = await texture.parseFromURLAsync("./gui-texture.json");
        const seed = <TextBlock> texture.getControlByName("InputText");
        const apply = <Button> texture.getControlByName("Button");
        const min = <ColorPicker> texture.getControlByName("Min");
        const max = <ColorPicker> texture.getControlByName("Max");
        this._minColor = min.value;
        this._maxColor = max.value;
        min.onValueChangedObservable.add(() => {
            this._setColorRamp(min.value, max.value);
            this._minColor = min.value;
            this._maxColor = max.value;
        });
        max.onValueChangedObservable.add(() => {
            this._setColorRamp(min.value, max.value);
            this._minColor = min.value;
            this._maxColor = max.value;
        });
        seed?.onEnterPressedObservable.add(() => {
            GM.Inst.seedPhrase = seed.text.trim();
            this.reset();
            this.animations = [];
            this.animationGroups = [];
            this.setupTiles();
        });
        apply.onPointerClickObservable.add(() => {
            GM.Inst.seedPhrase = seed.text.trim();
            this.reset();
            this.animations = [];
            this.animationGroups = [];
            this.setupTiles();
        });
    }

    private _setColorRamp(minColor: Color3, maxColor: Color3) {
        for (const [_, tile] of this._tiles) {
            tile.setColor(new Color3(
                mapRange(tile.baseColor.r, 0, 1, minColor.r, maxColor.r),
                mapRange(tile.baseColor.g, 0, 1, minColor.g, maxColor.g),
                mapRange(tile.baseColor.b, 0, 1, minColor.b, maxColor.b)
            ));
        }
    }
}

class SeededRandom {
    private _seed: number;

    constructor(seed: number) {
        this._seed = seed % 2147483647;
        if (this._seed <= 0) this._seed += 2147483646;
    }

    next() {
        this._seed = this._seed * 16807 % 2147483647;
        return (this._seed - 1) / 2147483646;
    }
}

function shuffleWithSeed(array: TileT[], seed: number) {
    const rng = new SeededRandom(seed);
    const shuffled = [...array]; // Create a copy to avoid mutating original

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

