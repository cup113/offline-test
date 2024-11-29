<script lang="ts" setup>
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableBody, TableHead } from '@/components/ui/table';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { computed, ref } from 'vue';
import { useStore } from '@/stores';
import MarkAnswer from '@/components/MarkAnswer.vue';
import { groupBy } from 'es-toolkit/array'

const store = useStore();

const summaryView = ref(false);
const current = ref(1);

const currentStat = computed(() => store.questionStats.get(current.value));

const fullScoreDisplay = computed(() => {
  if (currentStat.value === undefined) {
    return '';
  }
  const scores = currentStat.value.item.questions.map(q => q.score);
  if (scores.length === 1) {
    return currentStat.value.fullScore.toString();
  }
  return `${scores.join(' + ')} = ${currentStat.value.fullScore}`;
});

const itemControllers = computed(() => {
  return store.items.filter(item => item.type === 'question').map(item => {
    const itemStat = store.questionStats.get(item.no);
    const average = itemStat?.average ?? 0;
    const fullScore = itemStat?.fullScore ?? 1;
    const markProgress = itemStat?.markProgress ?? 0;
    return {
      no: item.no,
      isCurrent: current.value === item.no,
      scoreRate: average / fullScore,
      markProgress,
    }
  });
});

const sortedResults = computed(() => {
  if (currentStat.value === undefined) {
    return [];
  }
  const results = currentStat.value.results.slice();
  const groups = Object.entries(groupBy(results, item => item.score ?? 0)).map(([score, items]) => (
    { score: parseFloat(score), items, people: items.reduce((acc, cur) => acc + cur.names.length, 0) }));
  return groups.sort((a, b) => b.score - a.score);
})

function handle_stu_file(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    Array.from(target.files).forEach(file => {
      file.text().then(text => {
        try {
          store.add_student(text);
        } catch (e) {
          console.error(e);
        }
      });
    });
  }
}
</script>

<template>
  <div class="px-4 py-2 flex flex-col gap-4">
    <div class="flex items-center">
      <div class="w-32">考生答题文件</div><Input type="file" multiple @change="handle_stu_file"></Input>
      <div><Button @click="summaryView = !summaryView">切换至{{ summaryView ? '评分' : '总览' }}模式</Button></div>
    </div>
    <div class="flex flex-wrap justify-center gap-4">
      <div v-for="item in itemControllers" :key="item.no" @click="current = item.no" class="flex flex-col items-center">
        <Button class="w-10" :class="{ 'bg-green-600': item.isCurrent, 'hover:bg-green-700': item.isCurrent }">
          {{ item.no }}
        </Button>
        <meter :value="item.markProgress" min="0" max="1" class="w-8"></meter>
        <span class="text-sm">{{ (item.scoreRate * 100).toFixed(0) }}%</span>
      </div>
    </div>
    <div>
      <div v-if="currentStat !== undefined" class="text-center">
        <div>满分: <b>{{ fullScoreDisplay }}</b></div>
        <div>平均分: <b>{{ currentStat.average?.toFixed(2) }}</b>（得分率：<b>{{ ((currentStat.average ?? 0) /
          (currentStat.fullScore ?? 1) * 100).toFixed(2) }}%</b>）；标准差： <b>{{ currentStat.std?.toFixed(2) }}</b></div>
        <div>最高分: <b>{{ currentStat.max }}</b>；最低分: <b>{{ currentStat.min }}</b>；区分度：<b>{{
          currentStat.discrimination?.toFixed(2) ?? '/' }} </b></div>
      </div>
      <Table v-if="!summaryView && currentStat !== undefined">
        <TableHeader>
          <TableRow>
            <TableHead>姓名</TableHead>
            <TableHead>答案</TableHead>
            <TableHead>评语</TableHead>
            <TableHead>评分</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <MarkAnswer v-for="markResult in currentStat?.results" :mark-result="markResult" :no="current"
            :full-score="currentStat?.fullScore ?? 0" :key="current + markResult.answer"></MarkAnswer>
        </TableBody>
      </Table>
      <div v-else>
        <div v-for="group in sortedResults" :key="`${current} ${group.score}`">
          <Collapsible class="border border-slate-500 rounded-md px-4 py-2 mt-2">
            <CollapsibleTrigger>
              <div class="border-b border-slate-300 mb-2"><b>{{ group.score }}</b> 分（共 <b>{{ group.people }}</b> 人）
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div class="flex flex-col gap-y-2">
                <div v-for="result in group.items" :key="result.answer" class="flex justify-between items-center gap-2">
                  <div class="flex flex-wrap gap-x-2 gap-y-1 grow">
                    <span v-for="name in result.names" class="px-2 border border-slate-500 rounded-md">{{ name }}</span>
                  </div>
                  <div class="border py-1 px-2">
                    <p v-for="line in result.answer.split('\n')">
                      {{ line }}
                    </p>
                  </div>
                  <div class="font-bold text-slate-500">{{ result.comment }}</div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  </div>
</template>
