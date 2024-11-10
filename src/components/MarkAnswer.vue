<script setup lang="ts">
import { computed } from 'vue';
import { TableRow, TableCell } from '@/components/ui/table';
import { useStore, type MarkResult } from '@/stores/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MAX_STEPS = 16;
const MIN_INTERVAL = 1;

const props = defineProps<{
  no: number;
  fullScore: number;
  markResult: MarkResult;
}>();

const store = useStore();

const answerLines = computed(() => {
  return props.markResult.answer.split('\n');
});

const comment = computed({
  get() { return props.markResult.comment; },
  set(value: string) {
    return store.set_mark_result(props.no, props.markResult.answer, 'comment', value).mapErr(err => {
      console.error(err);
      alert(err);
    });
  }
});

const score = computed({
  get() { return props.markResult.score; },
  set(value: number | undefined) {
    return store.set_mark_result(props.no, props.markResult.answer, 'score', value).mapErr(err => {
      console.error(err);
      alert(err);
    });
  }
});

const scoreSteps = computed(() => {
  const interval = Math.max(MIN_INTERVAL, props.fullScore / (MAX_STEPS - 1));
  const steps = new Array<number>();
  for (let i = 0; i <= props.fullScore; i += interval) {
    steps.push(Math.round(i / MIN_INTERVAL) * MIN_INTERVAL);
  }
  return steps.reverse().slice(1, -1);
})

</script>

<template>
  <TableRow>
    <TableCell>
      <div v-for="name in markResult.names" :key="name">{{ name }}</div>
    </TableCell>
    <TableCell>
      <div v-for="ans in answerLines" :key="ans">{{ ans }}</div>
    </TableCell>
    <TableCell><Input type="text" v-model="comment"></Input></TableCell>
    <TableCell class="flex gap-1">
      <Input type="number" min="0" :max="fullScore" class="w-40" v-model="score"></Input>
      <div class="w-60 flex flex-wrap gap-2">
        <Button class="w-4 py-1 bg-green-700 hover:bg-green-800 font-bold" @click="score = fullScore">{{ fullScore
          }}</Button>
        <Button class="w-4 py-1 bg-blue-600 hover:bg-blue-700" @click="score = s" v-for="s in scoreSteps" :key="s">{{ s
          }}</Button>
        <Button class="w-4 py-1 bg-red-700 hover:bg-red-800 font-bold" @click="score = 0">0</Button>
      </div>
    </TableCell>
  </TableRow>
</template>