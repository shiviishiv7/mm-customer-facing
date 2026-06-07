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


    if (!st.sub || st.sub.trim() === '') {
      this.notificationService.error('Email is required.');
      return false;
    }

    const subRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!subRegex.test(st.sub)) {
      this.notificationService.error('Invalid sub format.');
      return false;
    }

    const phoneRegex = /^\d{10}$/;
    if (st.phone && !phoneRegex.test(st.phone)) {
      this.notificationService.error('Phone number must be 10 digits.');
      return false;
    }

    if (!st.dateOfBirth || st.dateOfBirth.trim() === '') {
      this.notificationService.error('Date of Birth is required.');
      return false;
    }

    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(st.dateOfBirth)) {
      this.notificationService.error('Date of Birth must be in YYYY-MM-DD format.');
      return false;
    }

    if (!st.gender || st.gender.trim() === '') {
      this.notificationService.error('Gender is required.');
      return false;
    }

    if (st.gender !== 'Male' && st.gender !== 'Female' && st.gender !== 'Other') {
      this.notificationService.error('Gender must be Male, Female, or Other.');
      return false;
    }

    if (st.zip && !/^\d{6}$/.test(st.zip)) {
      this.notificationService.error('ZIP code must be a 6-digit number.');
      return false;
    }

    if (!st.country || st.country.trim() === '') {
      this.notificationService.error('Country is required.');
      return false;
    }

    if (st.governmentIdType && st.governmentIdType.trim().length > 50) {
      this.notificationService.error('Government ID Type must be less than 50 characters.');
      return false;
    }

    if (st.governmentIdNumber && st.governmentIdNumber.trim().length > 20) {
      this.notificationService.error('Government ID Number must be less than 20 characters.');
      return false;
    }

    if (st.address && st.address.trim() === '') {
      this.notificationService.error('Address cannot be empty if provided.');
      return false;
    }

    if (st.city && st.city.trim() === '') {
      this.notificationService.error('City cannot be empty if provided.');
      return false;
    }

    if (st.state && st.state.trim() === '') {
      this.notificationService.error('State cannot be empty if provided.');
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
