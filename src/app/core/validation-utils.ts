export class ValidationUtils {
  static isValidNumber(value: any): boolean {
    return !isNaN(+value) && +value > 0;
  }

  static isValidYear(year: number | undefined): boolean {
    return year && year > 2000;
  }
}
