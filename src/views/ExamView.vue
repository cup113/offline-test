<script lang="ts" setup>
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { watch, reactive, ref } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { downloadText } from 'download.js';

type ItemType = 'id' | 'heading' | 'name' | 'question'
type QuestionType = 'blank-text' | 'blank-number' | 'choice-single' | 'choice-multiple' | 'choice-indeterminate' | 'multiple-line-text';

function split_once(str: string, separator: string): [string, string] {
  const index = str.indexOf(separator);
  if (index === -1) {
    return [str, ''];
  }
  return [str.slice(0, index), str.slice(index + separator.length)];
}

class Item {
  static META_NO = 0;

  public no: number;
  public type: ItemType;
  public content: string;
  public questions: Question[];

  constructor(codeLine: string) {
    const [strNo, lineText] = split_once(codeLine, ' ');
    this.no = parseInt(strNo);
    if (isNaN(this.no)) {
      throw new Error(`Invalid question number ${strNo}: ${codeLine}`);
    }
    if (this.no == Item.META_NO) {
      const [type, content] = split_once(lineText, ' ');
      this.content = content;
      switch (type) {
        case 'ID':
          this.type = 'id';
          break;
        case 'H':
          this.type = 'heading';
          break;
        case 'NAME':
          this.type = 'name';
          break;
        default:
          throw new Error(`Invalid meta type ${type}: ${codeLine}`);
      }
      this.questions = []
      return;
    }
    const questionCodes = lineText.split(' ');
    this.type = 'question';
    this.content = '';
    this.questions = questionCodes.map((codeQuestion, index) => new Question(index + 1, codeQuestion));
  }
}

class Question {
  public type: QuestionType;
  public score: number;
  public no: number;
  public blankLength: number;
  public choices: string[];

  constructor(no: number, codeQuestion: string) {
    this.no = no;
    const [type, content] = split_once(codeQuestion, '/');
    const [scoreStr, paramStr] = split_once(content, ',');
    this.score = parseInt(scoreStr);
    if (isNaN(this.score)) {
      throw new Error(`Invalid score ${scoreStr}: ${codeQuestion}`);
    }
    switch (type[0]) {
      case 'B':
        this.blankLength = parseInt(paramStr);
        if (isNaN(this.blankLength)) {
          throw new Error(`Invalid blank length ${paramStr}: ${codeQuestion}`);
        }
        this.choices = [];
        switch (type[1]) {
          case 'T':
            this.type = 'blank-text';
            break;
          case 'N':
            this.type = 'blank-number';
            break;
          default:
            throw new Error(`Invalid blank type ${type[1]}: ${codeQuestion}`);
        }
        break;
      case 'C':
        this.blankLength = 0;
        this.choices = paramStr.split(',');
        switch (type[1]) {
          case 'S':
            this.type = 'choice-single';
            break;
          case 'M':
            this.type = 'choice-multiple';
            break;
          case 'I':
            this.type = 'choice-indeterminate';
            break;
          default:
            throw new Error(`Invalid choice type ${type[1]}: ${codeQuestion}`);
        }
        break;
      case 'M':
        if (type[1] !== 'T') {
          throw new Error(`Invalid multiple type ${type[1]}: ${codeQuestion}`);
        }
        this.blankLength = 0;
        this.choices = [];
        this.type = 'multiple-line-text';
        break;
      default:
        throw new Error(`Invalid question type ${type}: ${codeQuestion}`);
    }
  }
}

const examCode = useLocalStorage('OT_exam_code', '');
const items = reactive(new Array<Item>());
const values = useLocalStorage('OT_exam_values', {} as Record<string, Record<string, string>>);
const name = ref('');
const id = ref('');

watch(examCode, code => {
  while (items.length > 0) {
    items.pop();
  }
  const lines = code.split('\n');
  for (const line of lines) {
    try {
      const item = new Item(line);
      switch (item.type) {
        case 'id':
          id.value = item.content;
          break;
        case 'heading':
        case 'name':
          items.push(item);
          break;
        case 'question':
          items.push(item);
          if (values.value[item.no] === undefined) {
            values.value[item.no] = {};
          }
          item.questions.forEach(question => {
            const itemValue = Reflect.get(values.value, `${item.no}`);
            if (Reflect.get(itemValue, `${question.no}`) === undefined) {
              Reflect.set(itemValue, `${question.no}`, '');
            }
          })
          break;
      }
    }
    catch (e) {
      console.error(e);
    }
  }
}, { immediate: true });

function export_questions() {
  const json = JSON.stringify({
    id: id.value,
    items,
  }, undefined, 2);
  downloadText(`${id.value}.json`, json);
}

function export_answers() {
  const json = JSON.stringify({
    name: name.value,
    answers: values.value,
  });
  downloadText(`${name.value}_${id.value}.json`, json);
}

// TODO: change to on-change event
</script>

<template>
  <div>
    Design Code:
    <Textarea v-model="examCode" class="h-80" placeholder="Input your design code here" />
  </div>
  <div class="border-2 border-gray-500 m-4 p-4">
    <div v-for="item, i in items" :key="i" class="flex border-b-2 border-green-800">
      <div v-if="item.no !== Item.META_NO" class="w-8 text-right pr-1 font-bold text-xl my-1">{{ item.no }}</div>
      <div class="flex gap-1 items-center">
        <h2 v-if="item.type === 'heading'" class="text-2xl font-bold">
          {{ item.content }}
        </h2>
        <template v-else-if="item.type === 'name'">
          <span>Name</span><Input v-model="name"></Input>
        </template>
        <template v-else-if="item.type === 'question'">
          <div v-for="question, j in item.questions"
            class="flex gap-1 items-center border-l-4 pl-1 ml-1 border-blue-800 border-dashed">
            <div v-if="item.questions.length > 1" class="font-bold">({{ question.no }})</div>
            <div class="text-orange-500 opacity-50">{{ question.score }}'</div>
            <div v-if="question.type === 'blank-text'">
              <Input v-model="values[i][j]"></Input>
            </div>
            <div v-else-if="question.type === 'blank-number'">
              <Input v-model="values[i][j]" type="number" step="any"></Input>
            </div>
            <div v-else-if="question.type === 'choice-single'">
              <RadioGroup class="flex gap-4">
                <div v-for="choice in question.choices" :key="choice" :value="choice">
                  <RadioGroupItem :value="choice"></RadioGroupItem><span>{{ choice }}</span>
                </div>
              </RadioGroup>
            </div>
            <div v-else-if="question.type === 'choice-multiple'" class="flex gap-4">
              <div v-for="choice in question.choices" :key="choice" :value="choice">
                <Checkbox></Checkbox>
                <span>{{ choice }}</span>
              </div>
            </div>
            <div v-else-if="question.type === 'choice-indeterminate'" class="flex gap-4">
              <div v-for="choice in question.choices" :key="choice" :value="choice">
                <Checkbox></Checkbox>
                <span>{{ choice }}</span>
              </div>
            </div>
            <div v-else-if="question.type === 'multiple-line-text'">
              <Textarea></Textarea>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
  <div>
    <Button @click="export_answers()">Export Answers</Button>
    <Button @click="export_questions()">Export Questions</Button>
  </div>
</template>
