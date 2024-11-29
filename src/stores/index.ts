import { defineStore } from 'pinia';
import { watch, reactive, ref, computed, type ComputedRef, type UnwrapRef } from 'vue';
import { watchIgnorable } from '@vueuse/core';
import { useLocalStorage, useArrayFilter } from '@vueuse/core';
import { downloadText } from 'download.js';
import { Maybe } from 'true-myth/maybe';
import { Result } from 'true-myth/result';
import { z } from 'zod';
import { min, max, medianSorted, standardDeviation, sampleCorrelation, average } from 'simple-statistics';

export type ItemType = 'id' | 'heading' | 'name' | 'question'
export type QuestionType = 'blank-text' | 'blank-number' | 'choice-single' | 'choice-multiple' | 'choice-indeterminate' | 'multiple-line-text';
export type MarkResult = { names: string[], answer: string, score: number | undefined, comment: string }

function split_once(str: string, separator: string): [string, string] {
  const index = str.indexOf(separator);
  if (index === -1) {
    return [str, ''];
  }
  return [str.slice(0, index), str.slice(index + separator.length)];
}

function use_dispersed_local_storage<T extends {}>(key: ComputedRef<string>, defaultValue: T) {
  const value = ref(defaultValue);

  const { ignoreUpdates } = watchIgnorable(() => ({ key: key.value, value: value.value }), ({ key: newKey, value: newVal }, old) => {
    if (old === undefined) {
      const localValue = Maybe.of(localStorage.getItem(newKey));
      value.value = localValue.mapOrElse(() => defaultValue, v => JSON.parse(v) as T) as UnwrapRef<T>;
      return;
    }
    const keyChanged = newKey !== old.key;
    if (keyChanged) {
      const targetValue = Maybe.of(localStorage.getItem(newKey)).mapOrElse(() => defaultValue, v => JSON.parse(v) as T);
      localStorage.setItem(newKey, JSON.stringify(targetValue));
      ignoreUpdates(() => value.value = targetValue as UnwrapRef<T>);
    } else {
      localStorage.setItem(newKey, JSON.stringify(newVal));
    }
  }, { immediate: true, deep: true });

  return value;
}

export class Item {
  static META_NO = 0;

  public no: number;
  public type: ItemType;
  public content: string;
  public questions: Question[];
  public score: number;

  constructor(attributes: { [K in keyof typeof Item.prototype]: (typeof Item.prototype)[K] }) {
    this.no = attributes.no;
    this.type = attributes.type;
    this.content = attributes.content;
    this.questions = attributes.questions;
    this.score = attributes.score;
  }

  static fromCode(codeLine: string, update?: (score: number) => void): Result<Item, string> {
    const TYPE_MAP: Record<string, ItemType | undefined> = { 'ID': 'id', 'H': 'heading', 'NAME': 'name' };

    const attributes: { [K in keyof typeof Item.prototype]: (typeof Item.prototype)[K] } = {
      no: 0,
      type: 'question',
      content: '',
      questions: [],
      score: 0,
    }

    const [strNo, lineText] = split_once(codeLine, ' ');
    const no = parseInt(strNo);
    if (isNaN(no)) {
      return Result.err(`Invalid item number ${strNo}: ${codeLine}`);
    }
    attributes.no = no;

    if (no === Item.META_NO) {
      const [_type, content] = split_once(lineText, ' ');
      attributes.content = content;
      const type = TYPE_MAP[_type];
      if (type === undefined) {
        return Result.err(`Invalid meta type ${_type}: ${codeLine}`);
      }
      attributes.type = type;
    } else {
      const questionCodes = lineText.split(' ');
      attributes.questions = questionCodes.map((codeQuestion, index) => new Question(index + 1, codeQuestion));
      attributes.questions.forEach(question => {
        attributes.score += question.score;
      });
    }

    if (update) {
      update(attributes.score);
    }
    return Result.ok(new Item(attributes));
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
        this.blankLength = parseInt(paramStr);
        this.choices = [];
        this.type = 'multiple-line-text';
        break;
      default:
        throw new Error(`Invalid question type ${type}: ${codeQuestion}`);
    }
  }
}

export const useStore = defineStore('index', () => {
  const id = ref('');
  const name = useLocalStorage('OT_exam_name', '');

  const items = reactive(new Array<Item>());
  const questionItems = useArrayFilter(items, item => item.type === 'question');
  const examCode = useLocalStorage('OT_exam_code', '');
  const examValues = use_dispersed_local_storage<string[][]>(computed(() => `OT_exam_values_${id.value}`), []);
  const markResults = use_dispersed_local_storage<MarkResult[][]>(computed(() => `OT_mark_${id.value}`), []);
  const students = use_dispersed_local_storage<Array<{
    name: string;
    answers: string[][];
  }>>(computed(() => `OT_students_${id.value}`), []);

  watch(examCode, code => {
    while (items.length > 0) {
      items.pop();
    }
    const lines = code.split('\n');
    let currentHeading: Maybe<Item> = Maybe.nothing();
    let questions = 0;
    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }
      const _item = Item.fromCode(line, score => {
        currentHeading.map(h => h.score += score);
      });
      if (_item.isErr) {
        console.error(_item.error);
        alert(_item.error);
        continue;
      }
      const item = _item.value;
      switch (item.type) {
        case 'id':
          id.value = item.content;
          break;
        case 'heading':
          items.push(item);
          currentHeading = Maybe.just(item);
          break;
        case 'name':
          items.push(item);
          break;
        case 'question':
          questions++;
          if (questions > examValues.value.length) {
            examValues.value.push([]);
          }
          while (examValues.value[questions - 1].length < item.questions.length) {
            examValues.value[questions - 1].push('');
          }
          if (questions > markResults.value.length) {
            markResults.value.push([]);
          }
          items.push(item);
          break;
      }
    }
  }, { immediate: true });

  function export_answers() {
    if (!name.value.trim()) {
      alert('请输入你的姓名。');
      return;
    }
    const json = JSON.stringify({
      name: name.value,
      answers: examValues.value,
    }, undefined, 2);
    downloadText(`${name.value}_${id.value}.json`, json);
  }

  function import_answers(json: string) {
    const data = JSON.parse(json);
    name.value = data.name;
    examValues.value = data.answers;
  }

  function export_marking() {
    const json = JSON.stringify({
      students: students.value,
      result: markResults.value,
      examCode: examCode.value,
    }, undefined, 2);
    downloadText(`${id.value}_marking.json`, json);
  }

  function import_marking(json: string) {
    const data = JSON.parse(json);
    students.value = data.students;
    markResults.value = data.result;
    examCode.value = data.examCode;
  }

  function add_student(fileText: string) {
    const schema = z.object({
      name: z.string(),
      answers: z.array(z.array(z.string())),
    })
    const student = schema.parse(JSON.parse(fileText));
    students.value.push(student);
    student.answers.forEach((answers, i) => {
      if (markResults.value.length <= i) {
        markResults.value.push([]);
      }
      const answer = answers.map(line => line.trim()).map(line => line ? line : '<EMPTY>').join('\n');
      const index = markResults.value[i].findIndex(result => result.answer === answer);
      if (index === -1) {
        markResults.value[i].push({
          names: [student.name],
          answer,
          comment: '',
          score: undefined,
        });
      } else {
        markResults.value[i].forEach((result, j) => {
          if (result.names.includes(student.name)) {
            markResults.value[i][j].names.push(student.name);
          }
        });
        if (!markResults.value[i][index].names.includes(student.name)) {
          markResults.value[i][index].names.push(student.name);
        }
      }
    })
  }

  function get_exam_value(itemNo: number, questionNo: number) {
    const index = questionItems.value.findIndex(item => item.no === itemNo);
    if (index === -1) {
      return undefined;
    }
    return (examValues.value[index] ?? [])[questionNo - 1];
  }

  function set_exam_value(itemNo: number, questionNo: number, value: string) {
    const index = questionItems.value.findIndex(item => item.no === itemNo);
    if (index === -1) {
      return Result.err(`Item ${itemNo} not found`);
    }
    try {
      examValues.value[index][questionNo - 1] = value;
    }
    catch (e) {
      return Result.err(`Invalid value ${value}: ${e}`);
    }
    return Result.ok();
  }

  function get_item_mark_results(itemNo: number) {
    const index = questionItems.value.findIndex(item => item.no === itemNo);
    if (index === -1) {
      return [];
    }
    return markResults.value[index] ?? [];
  }

  function get_mark_result(itemNo: number, answer: string) {
    const _markResults = get_item_mark_results(itemNo);
    if (!_markResults.length) {
      return undefined;
    }
    const markResult = _markResults.find(r => r.answer === answer);
    return markResult;
  }

  function set_mark_result<T extends 'comment' | 'score'>(itemNo: number, answer: string, key: T, value: MarkResult[T]): Result<true, string> {
    const markResult = get_mark_result(itemNo, answer);
    if (!markResult) {
      return Result.err(`Mark result for answer ${answer}, item ${itemNo} not found`);
    }
    markResult[key] = value;
    return Result.ok(true);
  }

  const markedStudents = computed(() => {
    const result = new Map<string, number>();
    items.forEach((item) => {
      get_item_mark_results(item.no).forEach(({ names, score }) => {
        names.forEach((name) => {
          result.set(name, (result.get(name) ?? 0) + (score || 0));
        });
      });
    });
    let prevRank = 0;
    let prevScore: number | undefined = undefined;
    return Array.from(result.entries()).map(([name, score]) => ({ name, score })).sort((a, b) => b.score - a.score).map((student, index) => {
      let rank = index + 1;
      if (prevScore === student.score) {
        rank = prevRank;
      } else {
        prevRank = rank;
        prevScore = student.score;
      }
      return { ...student, rank };
    });
  });

  const questionStats = computed(() => {
    const stats = new Map<number, {
      item: Item;
      results: MarkResult[];
      scores: number[];
      fullScore: number;
      max: number;
      min: number;
      average: number;
      std: number;
      discrimination: number | null;
      markProgress: number;
    }>();

    questionItems.value.forEach((item) => {
      const markResults = get_item_mark_results(item.no);
      const scores = markResults.map(({ score, names }) => names.map(() => score || 0)).flat();
      const fullScore = item.questions.reduce((acc, cur) => acc + cur.score, 0);
      const discrimination = (() => {
        if (scores.length < 2) {
          return null;
        }
        const studentsMap = new Map(markedStudents.value.map(s => [s.name, s.score] as const));
        const scoreArr = new Array<[number, number]>(); // [totalScore - thisScore, thisScore]
        markResults.forEach(({ names, score }) => {
          names.forEach(name => {
            scoreArr.push([(studentsMap.get(name) ?? 0) - (score ?? 0), score ?? 0] as const);
          });
        });
        return sampleCorrelation(scoreArr.map(s => s[0]), scoreArr.map(s => s[1]));
      })();
      const markProgress = markResults.filter(({ score }) => score !== undefined).length / markResults.length;
      stats.set(item.no, {
        item,
        results: markResults,
        fullScore,
        scores,
        max: max(scores.length ? scores : [0]),
        min: min(scores.length ? scores : [0]),
        average: average(scores.length ? scores : [0]),
        std: standardDeviation(scores.length ? scores : [0]),
        discrimination: isNaN(discrimination ?? NaN) ? 0 : discrimination,
        markProgress: isNaN(markProgress) ? 0 : markProgress,
      });
    });
    return stats;
  })

  const overallStat = computed(() => {
    const full = items.reduce((acc, cur) => acc + cur.questions.reduce((acc, cur) => acc + cur.score, 0), 0);
    const scores = markedStudents.value.map((student) => student.score);
    return {
      full,
      average: average(scores.length ? scores : [0]),
      median: medianSorted(scores.length ? scores : [0]),
      max: max(scores.length ? scores : [0]),
      min: min(scores.length ? scores : [0]),
      std: standardDeviation(scores.length ? scores : [0]),
    };
  });

  return {
    examCode,
    markResults,
    questionItems,
    items,
    examValues,
    students,
    name,
    id,
    markedStudents,
    questionStats,
    overallStat,
    export_answers,
    import_answers,
    export_marking,
    import_marking,
    add_student,
    get_item_mark_results,
    get_exam_value,
    set_exam_value,
    set_mark_result,
  }
});
