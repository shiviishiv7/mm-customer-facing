export class GoogleMeetScheduleModel {
  id: number;
  meetingTitle: string;
  description: string;
  startTime: string;
  endTime: string;
  organizerEmail: string;
  timeZone: string;
  attendeesEmails: string[];
  sendNotifications: boolean;
  meetLink?: string;
  calendarEventId?: string;
  additionalNotes?: string;
  createdAt: string;
  updatedAt: string;
  participants: Array<string>;

  constructor(data?: Partial<GoogleMeetScheduleModel>) {
    this.id = data?.id || 0;
    this.meetingTitle = data?.meetingTitle || '';
    this.description = data?.description || '';
    this.startTime = data?.startTime || '';
    this.endTime = data?.endTime || '';
    this.organizerEmail = data?.organizerEmail || '';
    this.timeZone = data?.timeZone || '';
    this.attendeesEmails = data?.attendeesEmails || [];
    this.sendNotifications = data?.sendNotifications || false;
    this.meetLink = data?.meetLink || '';
    this.calendarEventId = data?.calendarEventId || '';
    this.additionalNotes = data?.additionalNotes || '';
    this.createdAt = data?.createdAt || '';
    this.updatedAt = data?.updatedAt || '';
  }
}
