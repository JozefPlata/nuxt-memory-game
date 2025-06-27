import {
    Animation,
    AnimationGroup,
    Color3,
    type Mesh,
    MeshBuilder,
    type Scene,
    StandardMaterial, Texture,
    Vector3
} from "@babylonjs/core";
import {StateMachine} from "~/babylon/StateMachine";
import {GM} from "~/babylon/GameManager";
import type {ItemsDataT} from "~/babylon/App";
import {mapRange} from "~/babylon/Utils";

export type TileT = {
    id: number;
    name: string;
    rarity: number;
    frontGrid: Mesh;
    itemMesh: Mesh;
    baseColor: Color3;
    stateMachine: StateMachine;
    setColor: (color: Color3) => void;
    setRampColor: (minColor: Color3, maxColor: Color3) => void;
    setPosition: (x: number, y: number) => void;
    dispose: () => void;
}

export enum TileState {
    IDLE = "IDLE",
    ON_HOVER = "ON_HOVER",
    PICKED = "PICKED",
    NONE = "NONE",
}

export class Tile implements TileT {
    private readonly _x: number;
    private readonly _y: number;
    private readonly _rarity: number;
    private _id: number;
    name: string;
    frontGrid: Mesh;
    itemMesh: Mesh;
    baseColor = Color3.Black();
    stateMachine: StateMachine;

    constructor(x: number, y: number, id: number, color: Color3, rarity: number, scene: Scene) {
        this._x = x;
        this._y = y;
        this._id = id;
        this.baseColor = color;
        this._rarity = rarity;
        this.name = `tile_${this._x}:${this._y}`;
        this.frontGrid = this._setupMesh(color, scene);
        this.itemMesh = this._setupItem(color, scene);
        this.stateMachine = this._setStateMachine(scene);
    }

    dispose(): void {
        let mat = this.frontGrid.material as StandardMaterial;
        mat.diffuseTexture?.dispose();
        mat.dispose();
        mat = this.itemMesh.material as StandardMaterial;
        mat.diffuseTexture?.dispose();
        mat.dispose();
        this.frontGrid.dispose();
        this.itemMesh.dispose();
        this.name = "";
        this._id = -1;
    }

    get id(): number { return this._id }

    setColor(color: Color3): void {
        const mat = this.frontGrid.material as StandardMaterial;
        mat.diffuseColor = color;
    }

    setPosition(x: number, y: number): void {
        // this.name = `tile_${x}:${y}`;
        this.frontGrid.position = new Vector3(x + 0.5, y + 0.5, 0);
        this.itemMesh.position = new Vector3(x + 0.5, y + 0.5, -0.01);
    }

    get rarity(): number { return this._rarity }

    private _setupMesh(color: Color3, scene: Scene): Mesh {
        const mesh = MeshBuilder.CreatePlane(this.name, { sideOrientation: 1 }, scene);
        mesh.position = new Vector3(this._x + 0.5, this._y + 0.5, 0);
        mesh.scaling = Vector3.One().scale(0.9);
        const mat = new StandardMaterial(`mat_${this._x}:${this._y}`, scene);
        mat.specularColor = Color3.Black();
        mat.diffuseColor = color;
        mesh.material = mat;

        return mesh;
    }

    private _setupItem(color: Color3, scene: Scene): Mesh {
        const item = MeshBuilder.CreatePlane(this.name, { sideOrientation: 1 }, scene);
        item.position = new Vector3(this._x + 0.5, this._y + 0.5, -0.01);
        item.scaling = Vector3.One().scale(0.9);
        const mat = new StandardMaterial(`bg_${this._x}:${this._y}`, scene);
        mat.specularColor = Color3.Black();
        mat.useAlphaFromDiffuseTexture = true;

        const items: ItemsDataT[] = [];
        GM.Inst.itemsData.forEach((item) => {
            if (color.r * 100 <= item.rarity) {
                items.push(item);
            }
        });
        if (items.length === 0) {
            items.push({
                rarity: 0,
                img: "none.png",
            });
        }

        const itemData = items[Math.floor(GM.Inst.seed * items.length)];
        mat.diffuseTexture = new Texture(`./items/${itemData.img}`, scene);
        mat.diffuseTexture.hasAlpha = true;
        item.material = mat;
        return item;
    }

    private _setStateMachine(scene: Scene): StateMachine {
        const stateMachine = new StateMachine(this);

        //
        const animScaleUpX = new Animation("scaleUpX", "scaling.x", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const animScaleUpY = new Animation("scaleUpY", "scaling.y", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        const animTranslateZ = new Animation("translateZ", "position.z", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        animScaleUpX.setKeys([{ frame: 0, value: 0.9 }, { frame: 10, value: 1.2 }]);
        animScaleUpY.setKeys([{ frame: 0, value: 0.9 }, { frame: 10, value: 1.2 }]);
        animTranslateZ.setKeys([{ frame: 0, value: 0.0 }, { frame: 10, value: 0.1 }]);
        const grpScaleUp = new AnimationGroup("animGrp", scene);
        grpScaleUp.addTargetedAnimation(animScaleUpX, this.frontGrid);
        grpScaleUp.addTargetedAnimation(animScaleUpY, this.frontGrid);
        grpScaleUp.addTargetedAnimation(animTranslateZ, this.frontGrid);

        stateMachine.addState(TileState.ON_HOVER, {
            onEnter: () => {
                grpScaleUp.stop();
                grpScaleUp.play(false);
            },
            onExit: () => {
                grpScaleUp.stop();
                grpScaleUp.start(false, 2, 10, 0);
            },
        });

        //
        const animOpen = new Animation("open", "rotation.y", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
        animOpen.setKeys([{ frame: 0, value: 0 }, { frame: 10, value: Math.PI }]);
        const grpOpen = new AnimationGroup("animGrp", scene);
        grpOpen.addTargetedAnimation(animOpen, this.frontGrid);
        stateMachine.addState(TileState.PICKED, {
            onEnter: () => {
                grpOpen.play(false);
            },
        });

        //
        stateMachine.addState(TileState.NONE, {
            onEnter: () => {
                this.frontGrid.scaling = Vector3.One().scale(0.9);
                this.frontGrid.rotation = new Vector3(0, Math.PI, 0);
            },
        });

        stateMachine.addState(TileState.IDLE);
        stateMachine.setState(TileState.IDLE);
        return stateMachine;
    }

    setRampColor(minColor: Color3, maxColor: Color3) {
        this.setColor(new Color3(
            mapRange(this.baseColor.r, 0, 1, minColor.r, maxColor.r),
            mapRange(this.baseColor.g, 0, 1, minColor.g, maxColor.g),
            mapRange(this.baseColor.b, 0, 1, minColor.b, maxColor.b)
        ));
    }
}
