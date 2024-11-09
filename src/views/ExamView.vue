<script lang="ts" setup>
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStore, Item } from '@/stores/index';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Question from '@/components/Question.vue';

const store = useStore();
</script>

<template>
  <div class="px-4">
    <div>
      <Collapsible class="mt-2 rounded-xl px-4 py-2">
        <CollapsibleTrigger class="w-full py-1 border-b border-slate-200">
          <h2 class="text-xl font-bold text-center">此处输入试题代码</h2>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Textarea v-model="store.examCode" class="h-80" placeholder="Input your design code here" />
        </CollapsibleContent>
      </Collapsible>
    </div>
    <div class="border-2 border-gray-500 m-4 p-4 flex flex-col gap-3">
      <h2 class="text-2xl font-bold text-center">{{ store.id }}</h2>
      <div v-for="item, i in store.items" :key="i" class="flex gap-3">
        <div v-if="item.no !== Item.META_NO" class="w-8 text-right pr-1 font-bold text-lg my-1">{{ item.no }}.</div>
        <div class="flex gap-1 items-center py-1 flex-grow">
          <h3 v-if="item.type === 'heading'" class="text-xl font-bold">
            <span>{{ item.content }}</span>
            <span class="text-base text-yellow-600 pl-2">({{ item.score }}分)</span>
          </h3>
          <div v-else-if="item.type === 'name'" class="flex flex-grow gap-2 items-center justify-center">
            <div class="w-16 font-bold">姓名：</div><Input v-model="store.name" placeholder="请输入你的姓名..."></Input>
          </div>
          <div v-else-if="item.type === 'question'" class="flex flex-col gap-2 flex-grow">
            <Question v-for="question in item.questions" :key="question.no" :question="question" :item="item">
            </Question>
          </div>
        </div>
      </div>
      <Button @click="store.export_answers()" variant="outline" class="text-xl font-bold text-lime-700">导出答案</Button>
    </div>
  </div>
</template>
