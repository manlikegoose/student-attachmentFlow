export interface StudentRegistration {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  studentNumber: string;
  university: string;
  programme: string;
  yearOfStudy: number;
}

export interface CompanyRegistration {
  name: string;
  email: string;
  phone: string;
  password: string;
  location: string;
  town: string;
  industry: string;
}
