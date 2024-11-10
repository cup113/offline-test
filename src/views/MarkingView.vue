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
const currentResults = computed(() => store.get_item_mark_results(current.value));

const currentScoreStat = computed(() => {
  if (currentItem.value === undefined) {
    return {};
  }

  const scores: number[] = [];
  const results = store.get_item_mark_results(current.value);
  if (!results.length) {
    return {};
  }
  results.forEach(({ names, score }) => {
    names.forEach(() => scores.push(score || 0));
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
        const student = JSON.parse(text) as { name: string, answers: string[][] };
        store.students.push(student);
        student.answers.forEach((answers, i) => {
          if (store.markResults.length <= i) {
            store.markResults.push([]);
          }
          const answer = answers.map(line => line.trim()).map(line => line ? line : '<EMPTY>').join('\n');
          if (!store.markResults[i].find(result => result.answer === answer)) {
            store.markResults[i].push({
              names: [student.name],
              answer,
              comment: '',
              score: undefined,
            });
          }
          const index = store.markResults[i].findIndex(result => result.answer === answer);
          if (!store.markResults[i][index].names.includes(student.name)) {
            store.markResults[i][index].names.push(student.name);
          }
        })
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
      <Button v-for="item in store.items" :key="item.no" v-show="item.no !== Item.META_NO" @click="current = item.no" :class="{ 'bg-green-600': current === item.no }">
        {{ item.no }}</Button>
    </div>
    <div>
      <div v-if="currentItem !== undefined" class="text-center">
        <div>满分: <b>{{ fullScoreDisplay }}</b></div>
        <div>平均分: <b>{{ currentScoreStat.average?.toFixed(2) }}</b>（得分率：<b>{{ ((currentScoreStat.average ?? 0) /
          (currentFullScore ?? 1) * 100).toFixed(2) }}%</b>）</div>
        <div>最高分: <b>{{ currentScoreStat.max }}</b>；中位分: <b>{{ currentScoreStat.median }}</b>；最低分: <b>{{
          currentScoreStat.min }}</b></div>
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
          <MarkAnswer v-for="markResult in currentResults" :mark-result="markResult" :no="current"
            :full-score="currentFullScore" :key="current + markResult.answer"></MarkAnswer>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
