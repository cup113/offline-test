<script lang="ts" setup>
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStore, Item } from '@/stores/index';
import Question from '@/components/Question.vue';

const store = useStore();
</script>

<template>
  <div>
    Design Code:
    <Textarea v-model="store.examCode" class="h-80" placeholder="Input your design code here" />
  </div>
  <div class="border-2 border-gray-500 m-4 p-4">
    <div v-for="item, i in store.items" :key="i" class="flex border-b-2 border-green-800">
      <div v-if="item.no !== Item.META_NO" class="w-8 text-right pr-1 font-bold text-xl my-1">{{ item.no }}</div>
      <div class="flex gap-1 items-center py-1">
        <h2 v-if="item.type === 'heading'" class="text-2xl font-bold">
          {{ item.content }}
        </h2>
        <template v-else-if="item.type === 'name'">
          <span>Name</span><Input v-model="store.name" placeholder="Enter your name..."></Input>
        </template>
        <template v-else-if="item.type === 'question'">
          <Question v-for="question in item.questions" :key="question.no" :question="question" :item="item">
          </Question>
        </template>
      </div>
    </div>
  </div>
  <div>
    <Button @click="store.export_answers()">Export Answers</Button>
  </div>
</template>
