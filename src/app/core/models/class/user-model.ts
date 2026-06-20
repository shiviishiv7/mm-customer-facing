export interface AddressVO {
  id?: number;
  cognitoSub?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
}

export class UserModel {
  id: number | null = null;
  cognitoSub: string = '';
  email: string = '';
  firstName: string = '';
  lastName: string = '';
  companyId: string = '';
  gender: string = '';           // MALE | FEMALE | NON_BINARY | PREFER_NOT_TO_SAY
  dateOfBirth: string = '';      // YYYY-MM-DD
  age: number = 0;
  addressVO?: AddressVO;
  status?: string;
  isActive?: boolean;
}
