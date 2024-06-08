<script lang="ts" setup>
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableCaption, TableHeader, TableRow, TableBody, TableCell, TableHead } from '@/components/ui/table';
import { computed, ref } from 'vue';
import { useStore, Item } from '@/stores';

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
    const score = store.answerScores[current.value][answer] ?? 0;
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
  <div>
    <Textarea v-model="store.examCode"></Textarea>
    <Input type="file" multiple @change="handle_stu_file"></Input>
  </div>
  <div>
    <Button v-for="item in store.items" :key="item.no" v-show="item.no !== Item.META_NO" @click="current = item.no"
      :class="{ 'bg-green-800': Object.keys(store.answerScores[item.no] ?? {}).length !== 0, 'bg-green-500': current === item.no }">
      {{ item.no }}</Button>
  </div>
  <div>
    <div v-if="currentItem !== undefined" class="text-center">
      <div>Full score: {{ fullScoreDisplay }}</div>
      <div>Average score: {{ currentScoreStat.average }}</div>
      <div>Median score: {{ currentScoreStat.median }}</div>
      <div>Max score: {{ currentScoreStat.max }}</div>
      <div>Min score: {{ currentScoreStat.min }}</div>
    </div>
    <Table>
      <TableCaption>Students Marking</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Answer</TableHead>
          <TableHead>Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="answer in store.answers[current]" :key="answer[0]">
          <TableCell>
            <div v-for="name, in answer[1]" :key="name">{{ name }}</div>
          </TableCell>
          <TableCell>
            <div v-for="ans, i in answer[0].split('\n')" :key="i">{{ ans }}</div>
          </TableCell>
          <TableCell class="flex">
            <Input type="number" min="0" :max="currentFullScore" class="w-40" v-model="store.answerScores[current][answer[0]]"></Input>
            <div class="w-60">
              <Button class="bg-green-500" @click="store.answerScores[current][answer[0]] = currentFullScore">Full</Button>
              <Button class="bg-yellow-500" @click="store.answerScores[current][answer[0]] = currentFullScore / 2">Half</Button>
              <Button class="bg-red-500" @click="store.answerScores[current][answer[0]] = 0">Zero</Button>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
