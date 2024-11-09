<script setup lang="ts">
import { watch } from 'vue';
import { TableRow, TableCell } from '@/components/ui/table';
import { useStore } from '@/stores/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const props = defineProps<{
  names: string[];
  answer: string;
  current: number;
  fullScore: number;
}>();

const store = useStore();

watch(() => [props.answer, props.current], () => {
  store.answerScores[props.current] ??= {};
  store.answerScores[props.current][props.answer] ??= [0, ''];
}, { immediate: true });
</script>

<template>
  <TableRow>
    <TableCell>
      <div v-for="name in names" :key="name">{{ name }}</div>
    </TableCell>
    <TableCell>
      <div v-for="ans, i in answer.split('\n')" :key="i">{{ ans }}</div>
    </TableCell>
    <TableCell><Input type="text" v-model="store.answerScores[current][answer][1]"></Input></TableCell>
    <TableCell class="flex">
      <Input type="number" min="0" :max="fullScore" class="w-40"
        v-model="store.answerScores[current][answer][0]"></Input>
      <div class="w-60">
        <Button class="bg-green-500" @click="store.answerScores[current][answer][0] = fullScore">Full</Button>
        <Button class="bg-yellow-500" @click="store.answerScores[current][answer][0] = fullScore / 2">Half</Button>
        <Button class="bg-red-500" @click="store.answerScores[current][answer][0] = 0">Zero</Button>
      </div>
    </TableCell>
  </TableRow>
</template>