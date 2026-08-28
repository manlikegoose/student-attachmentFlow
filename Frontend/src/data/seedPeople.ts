/**
 * Seed people — students, companies, academic supervisors, coordinator.
 * Kenyan institutional context. Every account is demonstrable; see README for logins.
 */

import type {
  AccountCredential,
  CompanyProfile,
  CoordinatorProfile,
  StudentProfile,
  SupervisorProfile,
  User,
  WorkplaceSupervisor } from
'../types/models';

export const DEMO_PASSWORD = 'Attach2026!';
export const UNIVERSITY = 'Global University';

export const users: User[] = [
// students
u('u-std-1', 'victor.kiplangat@student.university.edu', '+254 712 448 902', 'STUDENT', 'Victor Kiplangat'),
u('u-std-2', 'amina.hassan@student.university.edu', '+254 733 118 204', 'STUDENT', 'Amina Hassan'),
u('u-std-3', 'brian.otieno@student.university.edu', '+254 720 553 116', 'STUDENT', 'Brian Otieno'),
u('u-std-4', 'cynthia.wairimu@student.university.edu', '+254 701 927 340', 'STUDENT', 'Cynthia Wairimu'),
u('u-std-5', 'dennis.kimani@student.university.edu', '+254 745 610 288', 'STUDENT', 'Dennis Kimani'),
u('u-std-6', 'faith.njeri@student.university.edu', '+254 758 402 771', 'STUDENT', 'Faith Njeri'),
u('u-std-7', 'geoffrey.mutiso@student.university.edu', '+254 726 884 519', 'STUDENT', 'Geoffrey Mutiso'),
u('u-std-8', 'halima.yusuf@student.university.edu', '+254 711 306 447', 'STUDENT', 'Halima Yusuf'),
// companies
u('u-co-1', 'attachments@dumutech.co.ke', '+254 20 386 4410', 'COMPANY', 'DumuTech Ltd.'),
u('u-co-2', 'hr@riftvalleysystems.co.ke', '+254 51 221 7788', 'COMPANY', 'Rift Valley Systems'),
u('u-co-3', 'people@eldoretdataworks.co.ke', '+254 53 203 3121', 'COMPANY', 'Eldoret Data Works'),
u('u-co-4', 'info@nyeriagritech.co.ke', '+254 61 203 0910', 'COMPANY', 'Nyeri Agritech Solutions'),
u('u-co-5', 'careers@technetworks.co.ke', '+254 61 202 4455', 'COMPANY', 'Tech Networks'),
u('u-co-6', 'hello@sokonidigital.co.ke', '+254 20 700 1188', 'COMPANY', 'Sokoni Digital'),
// supervisors
u('u-sup-1', 'j.wanjiku@university.edu', '+254 722 114 908', 'SUPERVISOR', 'Dr. Jane Wanjiku'),
u('u-sup-2', 'p.mwangi@university.edu', '+254 733 550 217', 'SUPERVISOR', 'Dr. Peter Mwangi'),
u('u-sup-3', 'g.achieng@university.edu', '+254 710 884 006', 'SUPERVISOR', 'Dr. Grace Achieng'),
u('u-sup-4', 's.kariuki@university.edu', '+254 741 229 663', 'SUPERVISOR', 'Mr. Samuel Kariuki'),
// coordinator
u('u-coord-1', 'attachments@university.edu', '+254 61 202 9000', 'COORDINATOR', 'Mrs. Esther Muriithi')];


function u(
id: string,
email: string,
phone: string,
role: User['role'],
fullName: string)
: User {
  return {
    id,
    email,
    phone,
    role,
    fullName,
    isActive: true,
    dateJoined: '2026-01-12',
    lastLogin: '2026-08-26T08:15:00'
  };
}

export const credentials: AccountCredential[] = users.map((usr) => ({
  userId: usr.id,
  email: usr.email,
  password: DEMO_PASSWORD
}));

export const students: StudentProfile[] = [
{
  id: 'std-1',
  userId: 'u-std-1',
  fullName: 'Victor Kiplangat',
  email: 'victor.kiplangat@student.university.edu',
  phone: '+254 712 448 902',
  gender: 'MALE',
  dateOfBirth: '2003-04-17',
  address: 'P.O. Box 1957, Kisumu',
  studentNumber: 'ADM/IT/1042/2023',
  university: UNIVERSITY,
  faculty: 'Faculty of Science, Engineering and Technology',
  department: 'Department of Computer Science',
  programme: 'BSc Information Technology',
  yearOfStudy: 3,
  expectedGraduation: '2027-11-30',
  bio: 'Third-year IT student focused on backend engineering and cloud infrastructure. Built a county service-desk system as a class project and maintain two open-source Django utilities.',
  skills: ['Python', 'Django', 'PostgreSQL', 'Linux administration', 'Docker', 'REST APIs'],
  createdAt: '2026-01-12',
  updatedAt: '2026-08-20'
},
{
  id: 'std-2',
  userId: 'u-std-2',
  fullName: 'Amina Hassan',
  email: 'amina.hassan@student.university.edu',
  phone: '+254 733 118 204',
  gender: 'FEMALE',
  dateOfBirth: '2003-09-02',
  address: 'P.O. Box 440, Nyeri',
  studentNumber: 'ADM/CS/0918/2023',
  university: UNIVERSITY,
  faculty: 'Faculty of Science, Engineering and Technology',
  department: 'Department of Computer Science',
  programme: 'BSc Computer Science',
  yearOfStudy: 3,
  expectedGraduation: '2027-11-30',
  bio: 'Computer science student with a strong interest in application security and secure software development lifecycles.',
  skills: ['Cybersecurity', 'Network security', 'Python', 'Wireshark', 'Incident response'],
  createdAt: '2026-01-12',
  updatedAt: '2026-07-30'
},
{
  id: 'std-3',
  userId: 'u-std-3',
  fullName: 'Brian Otieno',
  email: 'brian.otieno@student.university.edu',
  phone: '+254 720 553 116',
  gender: 'MALE',
  dateOfBirth: '2002-12-11',
  address: 'P.O. Box 88, Nakuru',
  studentNumber: 'ADM/IT/0771/2023',
  university: UNIVERSITY,
  faculty: 'Faculty of Science, Engineering and Technology',
  department: 'Department of Information Technology',
  programme: 'BSc Information Technology',
  yearOfStudy: 3,
  expectedGraduation: '2027-11-30',
  bio: 'Network-focused IT student currently on attachment with Rift Valley Systems.',
  skills: ['Networking', 'Cisco IOS', 'Linux administration', 'Troubleshooting'],
  createdAt: '2026-01-12',
  updatedAt: '2026-06-04'
},
{
  id: 'std-4',
  userId: 'u-std-4',
  fullName: 'Cynthia Wairimu',
  email: 'cynthia.wairimu@student.university.edu',
  phone: '+254 701 927 340',
  gender: 'FEMALE',
  dateOfBirth: '2003-01-25',
  address: 'P.O. Box 21, Kisumu',
  studentNumber: 'ADM/CS/0654/2022',
  university: UNIVERSITY,
  faculty: 'Faculty of Science, Engineering and Technology',
  department: 'Department of Computer Science',
  programme: 'BSc Computer Science',
  yearOfStudy: 4,
  expectedGraduation: '2026-11-30',
  bio: 'Final-year student who completed an analytics attachment at Eldoret Data Works.',
  skills: ['Data science', 'SQL', 'Power BI', 'Python', 'Statistics'],
  createdAt: '2026-01-12',
  updatedAt: '2026-08-14'
},
{
  id: 'std-5',
  userId: 'u-std-5',
  fullName: 'Dennis Kimani',
  email: 'dennis.kimani@student.university.edu',
  phone: '+254 745 610 288',
  gender: 'MALE',
  dateOfBirth: '2003-06-08',
  address: 'P.O. Box 302, Nyeri',
  studentNumber: 'ADM/IT/1150/2023',
  university: UNIVERSITY,
  faculty: 'Faculty of Science, Engineering and Technology',
  department: 'Department of Information Technology',
  programme: 'BSc Information Technology',
  yearOfStudy: 3,
  expectedGraduation: '2027-11-30',
  bio: 'Interested in cloud platforms and site reliability engineering.',
  skills: ['AWS', 'Linux administration', 'Bash'],
  createdAt: '2026-01-12',
  updatedAt: '2026-07-18'
},
{
  id: 'std-6',
  userId: 'u-std-6',
  fullName: 'Faith Njeri',
  email: 'faith.njeri@student.university.edu',
  phone: '+254 758 402 771',
  gender: 'FEMALE',
  dateOfBirth: '2004-02-19',
  address: 'P.O. Box 76, Kisumu',
  studentNumber: 'ADM/CS/1203/2024',
  university: UNIVERSITY,
  faculty: 'Faculty of Science, Engineering and Technology',
  department: 'Department of Computer Science',
  programme: 'BSc Computer Science',
  yearOfStudy: 3,
  expectedGraduation: '2028-11-30',
  bio: 'Front-end developer and UI enthusiast. Volunteer web lead for the campus innovation club.',
  skills: ['JavaScript', 'React', 'HTML/CSS', 'Figma', 'Databases'],
  createdAt: '2026-01-12',
  updatedAt: '2026-08-22'
},
{
  id: 'std-7',
  userId: 'u-std-7',
  fullName: 'Geoffrey Mutiso',
  email: 'geoffrey.mutiso@student.university.edu',
  phone: '+254 726 884 519',
  gender: 'MALE',
  dateOfBirth: '2002-08-30',
  address: 'P.O. Box 512, Eldoret',
  studentNumber: 'ADM/IT/0812/2023',
  university: UNIVERSITY,
  faculty: 'Faculty of Science, Engineering and Technology',
  department: 'Department of Information Technology',
  programme: 'BSc Information Technology',
  yearOfStudy: 3,
  expectedGraduation: '2027-11-30',
  bio: 'Data engineering student on attachment at Eldoret Data Works.',
  skills: ['SQL', 'Python', 'ETL', 'Databases'],
  createdAt: '2026-01-12',
  updatedAt: '2026-05-30'
},
{
  id: 'std-8',
  userId: 'u-std-8',
  fullName: 'Halima Yusuf',
  email: 'halima.yusuf@student.university.edu',
  phone: '+254 711 306 447',
  gender: 'FEMALE',
  dateOfBirth: '2003-11-05',
  address: 'P.O. Box 19, Nairobi',
  studentNumber: 'ADM/CS/0990/2023',
  university: UNIVERSITY,
  faculty: 'Faculty of Science, Engineering and Technology',
  department: 'Department of Computer Science',
  programme: 'BSc Computer Science',
  yearOfStudy: 3,
  expectedGraduation: '2027-11-30',
  bio: 'Telecommunications and IoT interest; starting attachment at Tech Networks.',
  skills: ['Networking', 'IoT', 'Python'],
  createdAt: '2026-01-12',
  updatedAt: '2026-08-10'
}];


export const companies: CompanyProfile[] = [
{
  id: 'co-1',
  userId: 'u-co-1',
  name: 'DumuTech Ltd.',
  email: 'attachments@dumutech.co.ke',
  phone: '+254 20 386 4410',
  industry: 'Software & IT Services',
  location: 'Westlands, Nairobi',
  town: 'Nairobi',
  website: 'https://dumutech.co.ke',
  registrationNumber: 'PVT-K7XQ4210',
  description:
  'DumuTech builds payment and logistics software for East African enterprises. The engineering group runs a structured 12-week attachment programme with dedicated workplace mentors.',
  logoText: 'DT',
  verificationStatus: 'VERIFIED',
  verifiedAt: '2026-02-03',
  verifiedById: 'coord-1',
  verificationNotes: 'Certificate of incorporation and KRA PIN verified against registry.',
  createdAt: '2026-01-20'
},
{
  id: 'co-2',
  userId: 'u-co-2',
  name: 'Rift Valley Systems',
  email: 'hr@riftvalleysystems.co.ke',
  phone: '+254 51 221 7788',
  industry: 'Network & Infrastructure',
  location: 'Kenyatta Avenue, Nakuru',
  town: 'Nakuru',
  website: 'https://riftvalleysystems.co.ke',
  registrationNumber: 'PVT-M2LP8871',
  description:
  'Network integrator serving county governments and hospitals across the Rift Valley. Specialises in campus networks, structured cabling and managed IT support.',
  logoText: 'RV',
  verificationStatus: 'VERIFIED',
  verifiedAt: '2026-02-11',
  verifiedById: 'coord-1',
  verificationNotes: 'Registry documents confirmed.',
  createdAt: '2026-01-28'
},
{
  id: 'co-3',
  userId: 'u-co-3',
  name: 'Eldoret Data Works',
  email: 'people@eldoretdataworks.co.ke',
  phone: '+254 53 203 3121',
  industry: 'Data & Analytics',
  location: 'Oloo Street, Eldoret',
  town: 'Eldoret',
  website: 'https://eldoretdataworks.co.ke',
  registrationNumber: 'PVT-R9TN3345',
  description:
  'Analytics consultancy working with agricultural cooperatives and SACCOs on reporting, forecasting and data warehousing.',
  logoText: 'ED',
  verificationStatus: 'VERIFIED',
  verifiedAt: '2026-02-19',
  verifiedById: 'coord-1',
  createdAt: '2026-02-02'
},
{
  id: 'co-4',
  userId: 'u-co-4',
  name: 'Nyeri Agritech Solutions',
  email: 'info@nyeriagritech.co.ke',
  phone: '+254 61 203 0910',
  industry: 'Agritech',
  location: 'Kimathi Way, Nyeri',
  town: 'Nyeri',
  website: 'https://nyeriagritech.co.ke',
  registrationNumber: 'PVT-B4WD1029',
  description:
  'Builds soil-sensor and irrigation-control systems for smallholder farms in Central Kenya.',
  logoText: 'NA',
  verificationStatus: 'PENDING_VERIFICATION',
  createdAt: '2026-08-14'
},
{
  id: 'co-5',
  userId: 'u-co-5',
  name: 'Tech Networks',
  email: 'careers@technetworks.co.ke',
  phone: '+254 61 202 4455',
  industry: 'Telecommunications',
  location: 'Main Street, Kisumu',
  town: 'Kisumu',
  website: 'https://technetworks.co.ke',
  registrationNumber: 'PVT-C1FG6602',
  description:
  'Regional internet service provider operating fibre and wireless last-mile networks across Nyeri County.',
  logoText: 'KN',
  verificationStatus: 'VERIFIED',
  verifiedAt: '2026-03-06',
  verifiedById: 'coord-1',
  createdAt: '2026-02-24'
},
{
  id: 'co-6',
  userId: 'u-co-6',
  name: 'Sokoni Digital',
  email: 'hello@sokonidigital.co.ke',
  phone: '+254 20 700 1188',
  industry: 'Fintech',
  location: 'Upper Hill, Nairobi',
  town: 'Nairobi',
  website: 'https://sokonidigital.co.ke',
  registrationNumber: null,
  description: 'Mobile payments startup. Registration documents not yet submitted.',
  logoText: 'SD',
  verificationStatus: 'REGISTERED',
  createdAt: '2026-08-21'
}];


export const workplaceSupervisors: WorkplaceSupervisor[] = [
{
  id: 'wsup-1',
  companyId: 'co-1',
  fullName: 'Eng. Michael Ombasa',
  jobTitle: 'Engineering Manager',
  email: 'm.ombasa@dumutech.co.ke',
  phone: '+254 722 903 114',
  department: 'Platform Engineering'
},
{
  id: 'wsup-2',
  companyId: 'co-1',
  fullName: 'Lilian Chepkoech',
  jobTitle: 'Security Lead',
  email: 'l.chepkoech@dumutech.co.ke',
  phone: '+254 733 660 285',
  department: 'Security Operations'
},
{
  id: 'wsup-3',
  companyId: 'co-2',
  fullName: 'Joseph Barasa',
  jobTitle: 'Network Operations Manager',
  email: 'j.barasa@riftvalleysystems.co.ke',
  phone: '+254 720 445 100',
  department: 'Network Operations'
},
{
  id: 'wsup-4',
  companyId: 'co-3',
  fullName: 'Winnie Chelagat',
  jobTitle: 'Lead Data Analyst',
  email: 'w.chelagat@eldoretdataworks.co.ke',
  phone: '+254 710 227 981',
  department: 'Analytics'
},
{
  id: 'wsup-5',
  companyId: 'co-5',
  fullName: 'Anthony Gichuki',
  jobTitle: 'Field Operations Supervisor',
  email: 'a.gichuki@technetworks.co.ke',
  phone: '+254 726 118 470',
  department: 'Field Operations'
}];


export const supervisors: SupervisorProfile[] = [
{
  id: 'sup-1',
  userId: 'u-sup-1',
  fullName: 'Dr. Jane Wanjiku',
  email: 'j.wanjiku@university.edu',
  phone: '+254 722 114 908',
  staffNumber: 'KU/STF/0412',
  department: 'Department of Computer Science',
  faculty: 'Faculty of Science, Engineering and Technology',
  title: 'Senior Lecturer',
  capacity: 15
},
{
  id: 'sup-2',
  userId: 'u-sup-2',
  fullName: 'Dr. Peter Mwangi',
  email: 'p.mwangi@university.edu',
  phone: '+254 733 550 217',
  staffNumber: 'KU/STF/0388',
  department: 'Department of Information Technology',
  faculty: 'Faculty of Science, Engineering and Technology',
  title: 'Senior Lecturer',
  capacity: 2
},
{
  id: 'sup-3',
  userId: 'u-sup-3',
  fullName: 'Dr. Grace Achieng',
  email: 'g.achieng@university.edu',
  phone: '+254 710 884 006',
  staffNumber: 'KU/STF/0521',
  department: 'Department of Computer Science',
  faculty: 'Faculty of Science, Engineering and Technology',
  title: 'Lecturer',
  capacity: 10
},
{
  id: 'sup-4',
  userId: 'u-sup-4',
  fullName: 'Mr. Samuel Kariuki',
  email: 's.kariuki@university.edu',
  phone: '+254 741 229 663',
  staffNumber: 'KU/STF/0604',
  department: 'Department of Information Technology',
  faculty: 'Faculty of Science, Engineering and Technology',
  title: 'Assistant Lecturer',
  capacity: 8
}];


export const coordinators: CoordinatorProfile[] = [
{
  id: 'coord-1',
  userId: 'u-coord-1',
  fullName: 'Mrs. Esther Muriithi',
  email: 'attachments@university.edu',
  phone: '+254 61 202 9000',
  staffNumber: 'KU/STF/0201',
  department: 'Industrial Attachment Office',
  title: 'University Attachment Coordinator'
}];