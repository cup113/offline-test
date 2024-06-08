<script lang="ts" setup>
import { Table, TableHeader, TableRow, TableCell, TableHead, TableBody } from '@/components/ui/table';
import { useStore } from '@/stores';
import { computed } from 'vue';

const store = useStore();

const students = computed(() => {
  const result: Record<string, number> = {};
  store.students.forEach((student) => {
    result[student.name] = 0;
  });
  store.items.forEach((item) => {
    store.answers[item.no].forEach((students, answer) => {
      students.forEach(student => {
        result[student] += (store.answerScores[item.no] ?? {})[answer] ?? 0;
      });
    });
  });
  return Object.entries(result).map(([name, score]) => ({ name, score }));
});

const overallStat = computed(() => {
  const full = store.items.reduce((acc, cur) => acc + cur.questions.reduce((acc, cur) => acc + cur.score, 0), 0);
  const scores = students.value.map((student) => student.score);
  const average = scores.reduce((acc, cur) => acc + cur, 0) / scores.length;
  const median = scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)];
  const max = Math.max.apply(null, scores);
  const min = Math.min.apply(null, scores);
  const std = Math.sqrt(
    scores.reduce((acc, cur) => acc + Math.pow(cur - average, 2), 0) / scores.length
  );
  return { full, average, median, max, min, std };
});
</script>

<template>
  <div>
    <h1>Statistics</h1>
    <div class="text-center">
      <div>Full Score: {{ overallStat.full }}</div>
      <div>Average: {{ overallStat.average }}</div>
      <div>Median: {{ overallStat.median }}</div>
      <div>Max: {{ overallStat.max }}</div>
      <div>Min: {{ overallStat.min }}</div>
      <div>Standard Deviation: {{ overallStat.std }}</div>
    </div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rank</TableHead>
          <TableHead>Student Name</TableHead>
          <TableHead>Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="(student, index) in students.slice().sort((a, b) => b.score - a.score)">
          <TableCell>{{ index + 1 }}</TableCell>
          <TableCell>{{ student.name }}</TableCell>
          <TableCell>{{ student.score }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
