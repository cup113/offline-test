<script lang="ts" setup>
import type { Question, Item } from '@/stores';
import { useStore } from '@/stores';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { reactive, computed, onMounted } from 'vue';

const MULTIPLE_SEPARATOR = '|';

const props = defineProps<{
  question: Question,
  item: Item,
}>();
const store = useStore();

function get_choice_item_id(value: string) {
  return `choice-item-${props.item.no}-${props.question.no}-${value}`;
}

const qType = computed(() => props.question.type);
const value = reactive({
  blankText: '',
  blankNumber: 0,
  choiceSingle: '',
  choiceMultiple: {} as Record<string, boolean>,
});

onMounted(() => {
  const originalValue = store.get_exam_value(props.item.no, props.question.no);
  if (!originalValue) {
    return;
  }
  switch (qType.value) {
    case 'blank-text':
      value.blankText = originalValue || '';
      break;
    case 'blank-number':
      value.blankNumber = parseFloat(originalValue || '0');
      break;
    case 'choice-single': {
      value.choiceSingle = originalValue || '';
      break;
    }
    case 'choice-multiple':
    case 'choice-indeterminate': {
      const choices = originalValue?.split(MULTIPLE_SEPARATOR) || [];
      for (const choice of choices) {
        value.choiceMultiple[choice] = true;
      }
      break;
    }
    case 'multiple-line-text':
      value.blankText = originalValue || '';
      break;
  }
});

function update_value(val: string) {
  console.log('update_value', val);
  store.set_exam_value(props.item.no, props.question.no, val).mapErr(e => {
    console.error(e);
    alert(e);
  });
}

function update_blank_text() {
  update_value(value.blankText);
}

function update_blank_number() {
  update_value(value.blankNumber.toString());
}

function update_multiple_line_text() {
  update_value(value.blankText.trim());
}

function update_choice_single(payload: string) {
  value.choiceSingle = payload;
  update_value(value.choiceSingle);
}

function update_choice_multiple() {
  const choices = Object.entries(value.choiceMultiple).filter(([, checked]) => checked).map(([choice, _]) => choice).join(MULTIPLE_SEPARATOR);
  update_value(choices);
}

function change_checkbox(choice: string, payload: boolean) {
  value.choiceMultiple[choice] = payload; // before update aria-checked, so false -> true
  update_choice_multiple();
}

</script>

<template>
  <div class="flex flex-grow items-center gap-2">
    <div v-if="item.questions.length > 1" class="font-bold">({{ question.no }})</div>
    <div class="text-orange-400 text-sm font-bold">({{ question.score }}分)</div>
    <div v-if="qType === 'blank-text'">
      <Input v-model="value.blankText" type="text" :default-value="value.blankText" @change="update_blank_text"
        class="h-7" :style="{ width: question.blankLength + 3 + 'em' }" placeholder="..."></Input>
    </div>
    <div v-else-if="qType === 'blank-number'">
      <Input v-model="value.blankNumber" type="number" :default-value="value.blankNumber" @change="update_blank_number"
        class="h-7 w-20" step="any" placeholder="..."></Input>
    </div>
    <div v-else-if="qType === 'choice-single'">
      <RadioGroup class="flex gap-4" :default-value="value.choiceSingle" @update:model-value="update_choice_single">
        <div v-for="choice in question.choices" :key="choice" class="flex gap-1">
          <RadioGroupItem :value="choice" :id="get_choice_item_id(choice)"></RadioGroupItem>
          <Label :for="get_choice_item_id(choice)">{{ choice }}</Label>
        </div>
      </RadioGroup>
    </div>
    <div v-else-if="qType === 'choice-multiple' || qType === 'choice-indeterminate'" class="flex gap-4">
      <div v-for="choice in question.choices" :key="choice" :value="choice" class="flex items-center gap-1">
        <Checkbox :id="get_choice_item_id(choice)" :checked="value.choiceMultiple[choice]"
          @update:checked="(payload) => change_checkbox(choice, payload)">
        </Checkbox>
        <Label :for="get_choice_item_id(choice)">{{ choice }}</Label>
      </div>
    </div>
    <div v-else-if="qType === 'multiple-line-text'" class="flex-grow">
      <Textarea v-model="value.blankText" :default-value="value.blankText" @change="update_multiple_line_text"
        placeholder="..." :style="{ height: question.blankLength + 'em' }"></Textarea>
    </div>
  </div>
</template>
