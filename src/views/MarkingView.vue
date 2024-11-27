<script lang="ts" setup>
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableBody, TableHead, TableCell } from '@/components/ui/table';
import { computed, ref } from 'vue';
import { useStore, Item } from '@/stores';
import MarkAnswer from '@/components/MarkAnswer.vue';

const store = useStore();

const summaryView = ref(false);
const current = ref(1);

const currentStat = computed(() => store.questionStats.get(current.value));

const fullScoreDisplay = computed(() => {
  if (currentStat.value === undefined) {
    return '';
  }
  const scores = currentStat.value.item.questions.map(q => q.score);
  if (scores.length === 1) {
    return currentStat.value.fullScore.toString();
  }
  return `${scores.join(' + ')} = ${currentStat.value.fullScore}`;
});

function handle_stu_file(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    store.students.splice(0, store.students.length);
    Array.from(target.files).forEach(file => {
      file.text().then(text => {
        try {
          store.add_student(text);
        } catch (e) {
          console.error(e);
        }
      });
    });
  }
}
</script>

<template>
  <div class="px-4 py-2 flex flex-col gap-4">
    <div class="flex items-center">
      <div class="w-32">考生答题文件</div><Input type="file" multiple @change="handle_stu_file"></Input>
      <div><Button @click="summaryView = !summaryView">切换总览模式<!--TODO--></Button></div>
    </div>
    <div class="flex flex-wrap justify-center gap-4">
      <div v-for="item in store.items" :key="item.no" v-show="item.no !== Item.META_NO" @click="current = item.no" class="flex flex-col items-center" >
        <Button :class="{ 'bg-green-600': current === item.no, 'hover:bg-green-700': current === item.no }">
          {{ item.no }}
        </Button>
        <span>{{ ((store.questionStats.get(item.no)?.average ?? 0) / (store.questionStats.get(item.no)?.fullScore ?? 1) * 100).toFixed(0) }}%</span>
        <span>{{ store.questionStats.get(item.no)?.markProgress === 1 ? '已阅' : '未阅' }}</span>
      </div>
    </div>
    <div>
      <div v-if="currentStat !== undefined" class="text-center">
        <div>满分: <b>{{ fullScoreDisplay }}</b></div>
        <div>平均分: <b>{{ currentStat.average?.toFixed(2) }}</b>（得分率：<b>{{ ((currentStat.average ?? 0) /
          (currentStat.fullScore ?? 1) * 100).toFixed(2) }}%</b>）；标准差： <b>{{ currentStat.std?.toFixed(2) }}</b></div>
        <div>最高分: <b>{{ currentStat.max }}</b>；最低分: <b>{{ currentStat.min }}</b>；区分度：<b>{{
          currentStat.discrimination?.toFixed(2) ?? '/' }} </b></div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>姓名</TableHead>
            <TableHead>答案</TableHead>
            <TableHead>评语</TableHead>
            <TableHead>评分</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <MarkAnswer v-for="markResult in currentStat?.results" :mark-result="markResult" :no="current"
            :full-score="currentStat?.fullScore ?? 0" :key="current + markResult.answer"></MarkAnswer>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
