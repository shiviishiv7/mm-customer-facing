import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterSelectionOptions',
  standalone: true,
})
export class FilterSelectionOptionsPipe implements PipeTransform {
  /**
   * Transforms the input string to check if it exists within the options array.
   *
   * @param value - The string to search for in the options array.
   * @param options - The array of strings to search within.
   * @returns `true` if the value exists in the options array, `false` otherwise.
   */
  transform(options: string | null | undefined, option: string): boolean {
    // Handle null or undefined inputs gracefully
    if (!option || !options || !Array.isArray(options)) {
      return false;
    }
    // Check if the value exists in the options array
    return options.includes(option);
  }
}
