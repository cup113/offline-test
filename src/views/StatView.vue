<script lang="ts" setup>
import { Table, TableHeader, TableRow, TableCell, TableHead, TableBody } from '@/components/ui/table';
import { useStore } from '@/stores';
import { computed } from 'vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const store = useStore();

const students = computed(() => {
  const result = new Map<string, number>();
  store.items.forEach((item) => {
    store.get_item_mark_results(item.no).forEach(({ names, score }) => {
      names.forEach((name) => {
        result.set(name, (result.get(name) ?? 0) + (score || 0));
      });
    });
  });
  return Array.from(result.entries()).map(([name, score]) => ({ name, score }));
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

function on_import(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  files?.item(0)?.text()?.then(text => store.import_marking(text));
}
</script>

<template>
  <div class="px-4 py-2">
    <h2 class="text-2xl font-bold text-center mb-2">答题统计</h2>
    <div class="text-center">
      <div>满分: <b>{{ overallStat.full }}</b></div>
      <div>平均分: <b>{{ overallStat.average.toFixed(2) }}</b>（得分率：<b>{{ ((overallStat.average ?? 0) / (overallStat.full ??
        1) * 100).toFixed(2) }}%</b>）；标准差：<b>{{ overallStat.std.toFixed(2) }}</b></div>
      <div>最高分: <b>{{ overallStat.max }}</b>；中位分: <b>{{ overallStat.median }}</b>；最低分: <b>{{ overallStat.min }}</b>
      </div>
    </div>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>排名</TableHead>
          <TableHead>学生姓名</TableHead>
          <TableHead>分数</TableHead>
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
    <div class="flex gap-8 items-center">
      <Button @click="store.export_marking()">导出阅卷结果</Button>
      <div class="flex gap-2 flex-grow items-center border rounded-lg px-4 border-collapse">
        <div class="w-32 text-gray-500">导入阅卷结果</div>
        <Input type="file" accept=".json" @change="on_import" />
      </div>
    </div>
  </div>
</template>
