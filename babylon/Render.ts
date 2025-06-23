import type {Scene} from "@babylonjs/core";
import {GM} from "~/babylon/GameManager";

export function render(scene: Scene) {
    GM.Inst.engine.runRenderLoop(function () {
        scene.render();
    });

    window.addEventListener("resize", function () {
        GM.Inst.engine.resize();
    });
}

