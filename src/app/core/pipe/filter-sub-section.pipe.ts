import {Pipe, PipeTransform} from '@angular/core';
import {TestSubSectionModel} from '@core/models/class/test-sub-section-model';


@Pipe({
  name: 'filterSubSection',
  standalone: true
})
export class FilterSubSectionPipe implements PipeTransform {

  transform(subSections: Array<TestSubSectionModel>, sectionId: string): any[] {
    if (!subSections?.length || !sectionId) {
      return subSections || []; // Return the full list if no filter criteria
    }
    return subSections.filter(subSection => subSection.sectionId === sectionId)
  }

}
