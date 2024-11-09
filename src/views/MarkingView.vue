<script lang="ts" setup>
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableCaption, TableHeader, TableRow, TableBody, TableHead } from '@/components/ui/table';
import { computed, ref } from 'vue';
import { useStore, Item } from '@/stores';
import MarkAnswer from '@/components/MarkAnswer.vue';

const store = useStore();

const current = ref(1);
const currentItem = computed(() => store.items.find(item => item.no === current.value));
const currentFullScore = computed(() => {
  if (currentItem.value === undefined) {
    return 0;
  }
  const scores = currentItem.value.questions.map(question => question.score);
  const total = scores.reduce((acc, cur) => acc + cur, 0);
  return total;
});
const currentScoreStat = computed(() => {
  if (currentItem.value === undefined) {
    return {};
  }

  const scores: number[] = [];
  store.answers[current.value].forEach((names, answer) => {
    const score = store.answerScores[current.value][answer]?.[0] ?? 0;
    for (let i = 0; i < names.length; i++) {
      scores.push(score);
    }
  });

  const average = scores.reduce((acc, cur) => acc + cur, 0) / scores.length;
  const max = Math.max.apply(null, scores);
  const min = Math.min.apply(null, scores);
  const median = (() => {
    const sorted = scores.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  })();

  return {
    average,
    max,
    min,
    median,
  };
});
const fullScoreDisplay = computed(() => {
  if (currentItem.value === undefined) {
    return '';
  }
  const scores = currentItem.value.questions.map(question => question.score);
  if (scores.length <= 1) {
    return currentFullScore.value.toString();
  }
  return `${scores.join(' + ')} = ${currentFullScore.value}`
});

function handle_stu_file(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    store.students.splice(0, store.students.length);
    Array.from(target.files).forEach(file => {
      file.text().then(text => {
        store.students.push(JSON.parse(text));
      });
    });
  }
}
</script>

<template>
  <div class="px-4 py-2 flex flex-col gap-4">
    <div class="flex items-center">
      <div class="w-32">考生答题文件</div><Input type="file" multiple @change="handle_stu_file"></Input>
    </div>
    <div class="flex flex-wrap justify-center gap-4">
      <Button v-for="item in store.items" :key="item.no" v-show="item.no !== Item.META_NO" @click="current = item.no"
        :class="{ 'bg-green-800': Object.keys(store.answerScores[item.no] ?? {}).length !== 0, 'bg-green-500': current === item.no }">
        {{ item.no }}</Button>
    </div>
    <div>
      <div v-if="currentItem !== undefined" class="text-center">
        <div>满分: <b>{{ fullScoreDisplay }}</b></div>
        <div>平均分: <b>{{ currentScoreStat.average?.toFixed(2) }}</b>（得分率：<b>{{ ((currentScoreStat.average ?? 0) / (currentFullScore ?? 1) * 100).toFixed(2) }}%</b>）</div>
        <div>最高分: <b>{{ currentScoreStat.max }}</b>；中位分: <b>{{ currentScoreStat.median }}</b>；最低分: <b>{{ currentScoreStat.min }}</b></div>
      </div>
      <Table>
        <TableCaption>Students Marking</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>姓名</TableHead>
            <TableHead>答案</TableHead>
            <TableHead>评语</TableHead>
            <TableHead>评分</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <MarkAnswer v-for="answer in store.answers[current]" :answer="answer[0]" :current="current"
            :full-score="currentFullScore" :names="answer[1]" :key="current + answer[0]"></MarkAnswer>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
