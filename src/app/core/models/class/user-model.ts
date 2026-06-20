export class UserModel {

  id: number | null;
  sub: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  message: string;
  dateOfBirth: any; // YYYY-MM-DD format
  gender: string; // Male, Female, or Other
  governmentIdType: string;
  governmentIdNumber: string;
  institutionCode: string;
  name: string;
  email: string;
  role: string;
}
