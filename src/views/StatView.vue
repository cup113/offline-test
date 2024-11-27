<script lang="ts" setup>
import { Table, TableHeader, TableRow, TableCell, TableHead, TableBody } from '@/components/ui/table';
import { useStore } from '@/stores';
import { RouterLink } from 'vue-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const store = useStore();

function on_import(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  files?.item(0)?.text()?.then(text => store.import_marking(text));
}
</script>

<template>
  <div class="px-4 py-2">
    <h2 class="text-2xl font-bold text-center mb-2">答题统计</h2>
    <div class="text-center">
      <div>满分: <b>{{ store.overallStat.full }}</b></div>
      <div>平均分: <b>{{ store.overallStat.average.toFixed(2) }}</b>（得分率：<b>{{ ((store.overallStat.average ?? 0) / (store.overallStat.full ??
        1) * 100).toFixed(2) }}%</b>）；标准差：<b>{{ store.overallStat.std.toFixed(2) }}</b></div>
      <div>最高分: <b>{{ store.overallStat.max }}</b>；中位分: <b>{{ store.overallStat.median }}</b>；最低分: <b>{{ store.overallStat.min }}</b>
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
        <TableRow v-for="student in store.markedStudents" :key="student.name">
          <TableCell>{{ student.rank }}</TableCell>
          <TableCell><RouterLink :to="`/paper/${student.name}`" class="underline">{{ student.name }}</RouterLink></TableCell>
          <TableCell class="font-bold">{{ student.score }}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
    <div class="flex gap-8 items-center mt-4">
      <Button @click="store.export_marking()">导出阅卷结果</Button>
      <div class="flex gap-2 flex-grow items-center border rounded-lg px-4 border-collapse">
        <div class="w-32 text-gray-500">导入阅卷结果</div>
        <Input type="file" accept=".json" @change="on_import" />
      </div>
    </div>
  </div>
</template>
