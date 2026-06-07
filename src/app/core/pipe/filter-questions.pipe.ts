import {Pipe, PipeTransform} from '@angular/core';
import {QuestionResponseEnum} from '../enums/question-response.enum';
import {QuestionModel} from '../models/class/question.model';

@Pipe({
  name: 'filterQuestions',
  standalone: true
})
export class FilterQuestionsPipe implements PipeTransform {
  transform(questionList: Array<QuestionModel>, sectionId: string, subSectionId: string): any[] {

    let questionFilter: Array<QuestionModel> = [];
    if (questionList && sectionId && subSectionId) {
      for (let i = 0; i < questionList.length; i++) {
        let qs = questionList[i];

        if (qs.sectionId === sectionId && qs.subSectionId === subSectionId) {
          questionFilter.push(qs);
        }
      }
      return questionFilter;
    } else if (questionList && sectionId) {
      for (let i = 0; i < questionList.length; i++) {
        let qs = questionList[i];
        if (qs.sectionId === sectionId) {
          questionFilter.push(qs);
        }
      }
      return questionFilter;
    } else if (questionList && subSectionId) {
      for (let i = 0; i < questionList.length; i++) {
        let qs = questionList[i];
        if (qs.subSectionId === subSectionId) {
          questionFilter.push(qs);
        }
      }
    } else {
      return questionFilter
    }
  }
}
