<script setup lang="ts">
import {App, type ItemsDataT} from "~/babylon/App";
import {Vector2} from "@babylonjs/core";

const { data } = await useAsyncData(() => queryCollection("content").first());
const babylonCanvas = ref<HTMLCanvasElement | null>(null);

onMounted(async () => {
  if (babylonCanvas.value && data.value && data.value.items.length > 0) {
    const app = new App(babylonCanvas.value, {
      ratio: new Vector2(16, 9),
      itemsData: data.value.items as ItemsDataT[],
    });
    await app.initAsync();
  }
})
</script>

<template>
  <canvas id="babylonCanvas" ref="babylonCanvas"/>
</template>

<style>
html, body {
  overflow: hidden;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #c7c7c7;
}

#babylonCanvas {
  width: 100%;
  height: 100vh;
  touch-action: none;
}
</style>