import {Injectable} from '@angular/core';
import {NotificationService} from '@shared/services/notification.service';
import {LogService} from './log.service';
import {ValidationUtils} from '../validation-utils';
import {UserModel} from '../models/class/user-model';
import {GoogleMeetScheduleModel} from '../models/class/google-meet-schedule-model';


@Injectable({
  providedIn: 'root',
})
export class ObjectValidationService {
  constructor(private notificationService: NotificationService, private logService: LogService) {
  }

  private handleError(message: string, logMessage: string): void {
    this.notificationService.error(message);
    this.logService.logError(logMessage, 'Validation Error');
  }

  private isValidNumber(value: any, errorMessage: string): boolean {
    if (!ValidationUtils.isValidNumber(value)) {
      this.notificationService.error(errorMessage);
      return false;
    }
    return true;
  }

  userValidate(st: UserModel): boolean {

    if (!st.cognitoSub || st.cognitoSub.trim() === '') {
      this.notificationService.error('User identity (cognitoSub) is missing. Please log in again.');
      return false;
    }

    if (!st.email || st.email.trim() === '') {
      this.notificationService.error('Email is required.');
      return false;
    }

    if (!st.firstName || st.firstName.trim() === '') {
      this.notificationService.error('First name is required.');
      return false;
    }

    if (!st.companyId || st.companyId.trim() === '') {
      this.notificationService.error('Company ID is required.');
      return false;
    }

    if (!st.gender || st.gender.trim() === '') {
      this.notificationService.error('Gender is required.');
      return false;
    }

    const validGenders = ['MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY'];
    if (!validGenders.includes(st.gender)) {
      this.notificationService.error('Gender must be Male, Female, Non-Binary, or Prefer Not to Say.');
      return false;
    }

    if (!st.dateOfBirth) {
      this.notificationService.error('Date of Birth is required.');
      return false;
    }

    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(st.dateOfBirth)) {
      this.notificationService.error('Date of Birth must be in YYYY-MM-DD format.');
      return false;
    }

    if (st.age < 18) {
      this.notificationService.error('You must be at least 18 years old to join.');
      return false;
    }

    if (st.addressVO?.zip && !/^\d{5,10}$/.test(st.addressVO.zip)) {
      this.notificationService.error('ZIP code must be between 5 and 10 digits.');
      return false;
    }

    return true;
  }



  scheduleObjectValidation(schedule: GoogleMeetScheduleModel): boolean {
    // Validate title
    if (!schedule.meetingTitle || schedule.meetingTitle.trim() === '') {
      this.notificationService.error('Title is required.');
      return false;
    }

    // Validate description
    if (schedule.description && schedule.description.trim() === '') {
      this.notificationService.error('Description cannot be empty if provided.');
      return false;
    }

    // Validate start time
    if (!schedule.startTime) {
      this.notificationService.error('Start Time is required.');
      return false;
    }

    // Validate end time
    if (!schedule.endTime) {
      this.notificationService.error('End Time is required.');
      return false;
    }

    // Ensure end time is after start time
    if (new Date(schedule.endTime) <= new Date(schedule.startTime)) {
      this.notificationService.error('End Time must be after Start Time.');
      return false;
    }

    // Validate time zone
    if (!schedule.timeZone || schedule.timeZone.trim() === '') {
      this.notificationService.error('Time Zone is required.');
      return false;
    }

    // Validate participants
    if (schedule.participants && schedule.participants.length > 0) {
      const invalidEmails = schedule.participants.filter(
        (sub) => !this.isValidEmail(sub)
      );
      if (invalidEmails.length > 0) {
        this.notificationService.error(
          `Invalid participant sub(s): ${invalidEmails.join(', ')}.`
        );
        return false;
      }
    }

    // All validations passed
    return true;
  }

  /**
   * Helper method to validate sub format
   * @param sub - Email string to validate
   */
  private isValidEmail(sub: string): boolean {
    const subRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return subRegex.test(sub);
  }

}
