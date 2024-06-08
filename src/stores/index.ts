import { defineStore } from 'pinia';
import { watch, reactive, ref, computed } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { downloadText } from 'download.js';

export type ItemType = 'id' | 'heading' | 'name' | 'question'
export type QuestionType = 'blank-text' | 'blank-number' | 'choice-single' | 'choice-multiple' | 'choice-indeterminate' | 'multiple-line-text';

function split_once(str: string, separator: string): [string, string] {
  const index = str.indexOf(separator);
  if (index === -1) {
    return [str, ''];
  }
  return [str.slice(0, index), str.slice(index + separator.length)];
}

export class Item {
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

export class Question {
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

export const useStore = defineStore('index', () => {
  const items = reactive(new Array<Item>());
  const examCode = useLocalStorage('OT_exam_code', '');
  let values = useLocalStorage('OT_exam_values_default', {} as Record<string, Record<string, string>>);
  const answerScores = useLocalStorage('OT_scores', {} as Record<string, Record<string, number>>);
  const name = useLocalStorage('OT_exam_name', '');
  const id = ref('');
  const students = useLocalStorage('OT_students', new Array<{
    name: string;
    answers: Record<string, Record<string, string>>;
  }>());
  const answers = computed(() => {
    const result: Record<string, Map<string, string[]>> = {};
    items.forEach(item => {
      const itemResult = new Map<string, string[]>();
      const questions = item.questions;
      students.value.forEach(student => {
        const answer = questions.map((_, index) => {
          const qAnswer = student.answers[item.no][index + 1];
          if (qAnswer === undefined || qAnswer === '') {
            return '<EMPTY>';
          }
          return qAnswer;
        }).join('\n');
        if (itemResult.get(answer) === undefined) {
          itemResult.set(answer, []);
        }
        itemResult.get(answer)?.push(student.name);
      });
      result[item.no] = itemResult;
    });
    return result;
  });

  watch(examCode, code => {
    while (items.length > 0) {
      items.pop();
    }
    const lines = code.split('\n');
    for (const line of lines) {
      if (line.trim() === '') {
        continue;
      }
      try {
        const item = new Item(line);
        switch (item.type) {
          case 'id':
            if (id.value !== item.content) {
              id.value = item.content;
              values = useLocalStorage(`OT_exam_values_${id.value}`, {});
            }
            break;
          case 'heading':
          case 'name':
            items.push(item);
            break;
          case 'question':
            items.push(item);
            if (answerScores.value[item.no] === undefined) {
              answerScores.value[item.no] = {};
            }
            break;
        }
      }
      catch (e) {
        console.error(e);
      }
    }
  }, { immediate: true });

  function export_answers() {
    const json = JSON.stringify({
      name: name.value,
      answers: values.value,
    }, undefined, 2);
    downloadText(`${name.value}_${id.value}.json`, json);
  }

  function get_value(itemNo: number, questionNo: number): string | undefined {
    if (values.value[itemNo] === undefined) {
      values.value[itemNo] = {};
    }
    return values.value[itemNo][questionNo];
  }

  function update_value(itemNo: number, questionNo: number, value: string) {
    if (values.value[itemNo] === undefined) {
      values.value[itemNo] = {};
    }
    values.value[itemNo][questionNo] = value;
  }

  return {
    examCode,
    answerScores,
    items,
    values,
    students,
    answers,
    name,
    id,
    export_answers,
    get_value,
    update_value,
  }
});
