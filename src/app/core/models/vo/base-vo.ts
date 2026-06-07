
export class BaseVO<T> {
  accessToken: string | null = null;
  losStatus: string | null = null;
  applicationId: number | null = null;
  id: number | null = null; // Primary entity identity
  code: number | null = null;
  message: string | null = null;
  details: string | null = null;
  uuid: string | null = null;
  data: T = null; // Use a specific type here if possible instead of `any`

  constructor(
    accessToken?: string,
    losStatus?: string,
    applicationId?: number,
    id?: number,
    code?: number,
    message?: string,
    details?: string,
    uuid?: string,
    data?: any
  ) {
    if (accessToken) this.accessToken = accessToken;
    if (losStatus) this.losStatus = losStatus;
    if (applicationId) this.applicationId = applicationId;
    if (id) this.id = id;
    if (code) this.code = code;
    if (message) this.message = message;
    if (details) this.details = details;
    if (uuid) this.uuid = uuid;
    if (data !== undefined) this.data = data;
  }
}
