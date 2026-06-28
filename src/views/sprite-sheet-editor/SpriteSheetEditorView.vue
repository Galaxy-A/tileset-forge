<template>
  <main class="sprite-editor-page">
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark">TF</span>
        <div>
          <h1>Tileset Forge</h1>
          <p>本地 Sprite Sheet 编辑器 · Tiled-ready export</p>
        </div>
      </div>

      <div class="future-actions">
        <el-button
          v-for="feature in store.futureFeatures"
          :key="feature.key"
          size="small"
          :disabled="!feature.enabled || (feature.key === 'ai-remove-bg' && !store.sourceImage)"
          :loading="feature.key === 'ai-remove-bg' && isRemovingBackground"
          @click="handleFeatureAction(feature.key)"
        >
          {{ feature.label }}
        </el-button>
      </div>
    </header>

    <section class="workspace">
      <div class="main-column">
        <SourceImagePanel class="source-area" />
        <CapturedSpritesPanel class="captures-area" />
      </div>

      <div class="side-column">
        <LayoutBoardPanel class="layout-area" />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { getSpriteSheetDefaultConfig } from '@/api/modules/spriteSheetApi';
import { removeImageBackground } from '@/api/modules/aiJobApi';
import CapturedSpritesPanel from '@/components/business/sprite-sheet-editor/CapturedSpritesPanel.vue';
import LayoutBoardPanel from '@/components/business/sprite-sheet-editor/LayoutBoardPanel.vue';
import SourceImagePanel from '@/components/business/sprite-sheet-editor/SourceImagePanel.vue';
import { useSpriteSheetCanvas } from '@/composables/useSpriteSheetCanvas';
import { useSpriteSheetEditorStore } from '@/stores/spriteSheetEditorStore';

const store = useSpriteSheetEditorStore();
const { removeImageBackground: removeImageBackgroundFromCanvas } = useSpriteSheetCanvas();
const isRemovingBackground = ref(false);

const loadDefaultConfig = async () => {
  const response = await getSpriteSheetDefaultConfig();
  if (!response.success) {
    ElMessage.error(response.message || '默认配置加载失败');
    return;
  }
  store.applyDefaultConfig(response.body);
};

const handleRemoveBackground = async () => {
  if (!store.sourceImage) return;
  isRemovingBackground.value = true;
  try {
    const response = await removeImageBackground({
      assetId: store.sourceImage.assetId,
      fileName: store.sourceImage.fileName,
      width: store.sourceImage.width,
      height: store.sourceImage.height,
      strategy: 'corner-sample',
    });

    if (!response.success) {
      ElMessage.error(response.message || '去背景处理失败');
      return;
    }

    const processedObjectUrl = await removeImageBackgroundFromCanvas(store.sourceImage.objectUrl);
    store.replaceSourceImage({
      ...store.sourceImage,
      fileName: store.sourceImage.fileName.replace(/(\.[^.]+)?$/, '-remove-bg.png'),
      objectUrl: processedObjectUrl,
    });
    ElMessage.success(response.body.message);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '去背景处理失败');
  } finally {
    isRemovingBackground.value = false;
  }
};

const handleFeatureAction = (key: string) => {
  if (key === 'ai-remove-bg') {
    void handleRemoveBackground();
  }
};

onMounted(loadDefaultConfig);
</script>

<style scoped>
.sprite-editor-page { height: 100%; display: grid; grid-template-rows: var(--tf-toolbar-height) 1fr; background: var(--tf-color-background); }
.topbar { height: var(--tf-toolbar-height); display: grid; grid-template-columns: minmax(260px, auto) 1fr; align-items: center; gap: 12px; padding: 0 10px; border-bottom: 1px solid var(--tf-color-border); background: rgba(255,255,255,.86); backdrop-filter: blur(12px); }
.brand { display: flex; align-items: center; gap: 8px; min-width: 0; }
.brand-mark { width: 26px; height: 26px; border-radius: var(--tf-radius-sm); display: grid; place-items: center; background: var(--tf-color-primary); color: #fff; font-size: 12px; font-weight: 800; }
h1 { margin: 0; font-size: 15px; line-height: 18px; }
p { margin: 0; font-size: 12px; color: var(--tf-color-text-muted); }
.future-actions { min-width: 0; display: flex; align-items: center; justify-content: flex-end; gap: 6px; overflow: hidden; }
.workspace { min-height: 0; min-width: 0; padding: var(--tf-gutter); display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(520px, .95fr); gap: var(--tf-gutter); overflow: hidden; }
.main-column { min-width: 0; min-height: 0; display: grid; grid-template-rows: minmax(420px, 1fr) 210px; gap: var(--tf-gutter); }
.side-column { min-width: 0; min-height: 0; display: grid; }
.source-area,
.captures-area,
.layout-area { min-width: 0; min-height: 0; }
@media (max-width: 1180px) {
  .topbar { grid-template-columns: 1fr auto; height: auto; min-height: var(--tf-toolbar-height); padding: 8px 10px; }
  .future-actions { display: none; }
  .workspace { grid-template-columns: 1fr; overflow: auto; }
  .main-column { min-height: 620px; }
  .side-column { min-height: 620px; }
}

@media (max-width: 900px) {
  .main-column { grid-template-rows: minmax(380px, 1fr) minmax(180px, auto); }
  .side-column { grid-template-columns: 1fr; }
}
</style>