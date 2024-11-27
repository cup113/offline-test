<script lang="ts" setup>
import { computed } from 'vue';
import { Item, useStore } from '@/stores/index';
import { useRoute } from 'vue-router';
import { Table, TableHead, TableBody, TableHeader, TableRow, TableCell } from '@/components/ui/table';

const route = useRoute();
const name = computed(() => route.params.name.toString());
const store = useStore();

const student = computed(() => store.markedStudents.find((s) => s.name === name.value));
const stats = computed(() => {
    return store.items.filter(i => i.type === 'question')
    .map(item => store.questionStats.get(item.no))
    .filter(item => item !== undefined)
    .map(item => ({
        no: item.item.no,
        full: item.fullScore,
        average: item.average,
        std: item.std,
        min: item.min,
        max: item.max,
        score: (item.results.find(r => r.names.includes(name.value))?.score ?? 0),
    }));
});
</script>

<template>
    <div class="py-4 px-6">
        <h3 class="text-center font-bold text-2xl">{{ name }}</h3>
        <div class="text-center font-bold text-lg text-lime-700">#{{ student?.rank }} | {{ student?.score }}</div>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>题号</TableHead>
                    <TableHead>得分</TableHead>
                    <TableHead>相对表现</TableHead>
                    <TableHead>平均分 ± 标准差</TableHead>
                    <TableHead>最低分—平均分—最高分</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow v-for="item in stats" :key="item.no">
                    <TableCell class="font-bold">{{ item.no }}</TableCell>
                    <TableCell><b>{{ item.score }}</b> / {{ item.full }}</TableCell>
                    <TableCell class="font-bold">{{ ((item.score - item.average) / item.std).toFixed(2) }}</TableCell>
                    <TableCell>{{ item.average.toFixed(2) }} &pm; {{ item.std.toFixed(2) }}</TableCell>
                    <TableCell>{{ item.min }} - {{ item.average.toFixed(2) }} - {{ item.max }}</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    </div>
</template>
