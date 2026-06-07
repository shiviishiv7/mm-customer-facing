import {Pipe, PipeTransform} from '@angular/core';
import {TestSectionModel} from '../models/class/test-section.model';

@Pipe({
  name: 'filterTestSection',
  standalone: true
})
export class FilterTestSectionPipe implements PipeTransform {

  /**
   * Filters the test sections based on the provided section ID.
   * @param testSections - Array of `ExamSectionModel` to filter.
   * @param sectionId - Section ID to filter by.
   * @returns Filtered array of `ExamSectionModel` or the original array if no filter criteria is provided.
   */
  transform(testSections: TestSectionModel[] | null | undefined, sectionId: string | null | undefined): TestSectionModel[] {
    if (!testSections || !sectionId) {
      return testSections || []; // Return the original array or an empty array if undefined/null
    }
    return testSections.filter(section => section.id === sectionId);
  }
}
