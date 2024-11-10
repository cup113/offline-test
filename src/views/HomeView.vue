<script setup lang="ts">
import { Button } from '@/components/ui/button';

function clearLocalStorage() {
  if (!confirm("确定要清除本地缓存吗？")) {
    return;
  }
  localStorage.clear();
  window.location.reload();
}
</script>

<template>
  <div class="py-2 px-8">
    <p>这里是Offline Test的首页，请点击上方“Exam”按钮开始测试。</p>
    <Button @click="clearLocalStorage()" variant="destructive">清除本地缓存</Button>
  </div>
</template>
