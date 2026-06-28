import { createRouter, createWebHashHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/editor',
    },
    {
      path: '/editor',
      name: 'sprite-sheet-editor',
      component: () => import('@/views/sprite-sheet-editor/SpriteSheetEditorView.vue'),
    },
  ],
});