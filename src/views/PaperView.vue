<script lang="ts" setup>
import { computed } from 'vue';
import { useStore } from '@/stores/index';
import { useRoute } from 'vue-router';
import { Table, TableHead, TableBody, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const route = useRoute();
const name = computed(() => route.params.name.toString());
const store = useStore();

const student = computed(() => store.markedStudents.find((s) => s.name === name.value));
const stats = computed(() => {
    return store.items.filter(i => i.type === 'question')
        .map(item => store.questionStats.get(item.no))
        .filter(item => item !== undefined)
        .map(item => {
            const result = item.results.find(r => r.names.includes(name.value));
            const score = result?.score ?? 0;
            const answer = result?.answer ?? '';
            return {
                no: item.item.no,
                full: item.fullScore,
                average: item.average,
                std: item.std,
                min: item.min,
                max: item.max,
                score,
                answer,
                relativeScore: item.std === 0 ? 0 : ((score - item.average) / item.std)
            };
        });
});

function getColorClass(relativeScore: number) {
    if (relativeScore < -1) {
        return 'text-red-500';
    }
    if (relativeScore < -0.5) {
        return 'text-red-700';
    }
    if (relativeScore < -0.2) {
        return 'text-red-800';
    }
    if (relativeScore > 1) {
        return 'text-green-500';
    }
    if (relativeScore > 0.5) {
        return 'text-green-700';
    }
    if (relativeScore > 0.2) {
        return 'text-green-800';
    }
}

function toRelative(num: number) {
    return num >= 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
}
</script>

<template>
    <div class="py-4 px-6">
        <h3 class="text-center font-bold text-2xl">{{ name }}</h3>
        <div class="text-center font-bold text-lg text-lime-700">#{{ student?.rank }} | {{ student?.score }}</div>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>题号</TableHead>
                    <TableHead>得分 / 总分</TableHead>
                    <TableHead>相对表现</TableHead>
                    <TableHead>平均分 &pm; 标准差（最低分 ~ 最高分）</TableHead>
                    <TableHead>答案</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow v-for="item in stats" :key="item.no">
                    <TableCell class="w-16 font-bold">{{ item.no }}</TableCell>
                    <TableCell class="w-36">
                        <b>{{ item.score }}</b> / {{ item.full }}
                        <Badge class="px-2 ml-1 text-lime-300" v-if="item.score === item.full">满分</Badge>
                        <Badge class="px-2 ml-1 text-green-300" v-else-if="item.score === item.max">最高</Badge>
                        <Badge class="px-2 ml-1 text-orange-300" v-else-if="item.score === item.min">最低</Badge>
                    </TableCell>
                    <TableCell class="w-48 font-bold font-mono" :class="getColorClass(item.relativeScore)">{{ toRelative(item.relativeScore) }} ({{ toRelative(item.score - item.average) }})</TableCell>
                    <TableCell class="w-80 font-mono">{{ item.average.toFixed(2) }} &pm; {{ item.std.toFixed(2) }} ( {{ item.min }} ~ {{ item.max }} )</TableCell>
                    <TableCell>
                        <p v-for="line in item.answer.split('\n')" class="border-b border-gray-300 border-dashed">
                            {{ line }}
                        </p>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    </div>
</template>
