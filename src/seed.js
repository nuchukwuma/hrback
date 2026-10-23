// seed.js: creates demo users so you can log in. For development only.
// Run it ONCE, from the backend folder:  node src/seed.js
import dns from "node:dns";
import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/people/User.js';
import EmployeeProfile from './models/people/employeeProfile.js';

dns.setServers(["8.8.8.8", "8.8.4.4"]);


const password = 'Password123!'; // every demo user gets this password

await mongoose.connect(process.env.MONGO_URI);

const getOrCreateUser = async (details) => {
  const existing = await User.findOne({ email: details.email });
  return existing || User.create(details);
};

const hr = await getOrCreateUser({
  email: 'hr@example.com',
  password,
  role: 'hr',
  status: 'active',
});

const manager = await getOrCreateUser({
  email: 'manager@example.com',
  password,
  role: 'manager',
  status: 'active',
});

const ada = await getOrCreateUser({
  email: 'ada@example.com',
  password,
  role: 'employee',
  managerId: manager._id,
  status: 'active',
});
const tunde = await getOrCreateUser({
  email: 'tunde@example.com',
  password,
  role: 'employee',
  managerId: manager._id,
  status: 'active',
});

const demoProfiles = [
  { user: hr, firstName: 'Harper', lastName: 'Reed', dateOfBirth: '1988-04-12', hireDate: '2022-01-10', jobTitle: 'HR Manager' },
  { user: manager, firstName: 'Morgan', lastName: 'Blake', dateOfBirth: '1985-09-23', hireDate: '2021-06-14', jobTitle: 'Team Manager' },
  { user: ada, firstName: 'Ada', lastName: 'Lovelace', dateOfBirth: '1992-12-10', hireDate: '2023-03-20', jobTitle: 'Employee' },
  { user: tunde, firstName: 'Tunde', lastName: 'Okafor', dateOfBirth: '1991-07-08', hireDate: '2023-08-07', jobTitle: 'Employee' },
];

for (const { user, firstName, lastName, dateOfBirth, hireDate, jobTitle } of demoProfiles) {
  await EmployeeProfile.updateOne(
    { userId: user._id },
    {
      $setOnInsert: {
        userId: user._id,
        personalInfo: { firstName, lastName, email: user.email },
        dateOfBirth: new Date(dateOfBirth),
        hireDate: new Date(hireDate),
        jobTitle,
        employmentType: 'permanent',
      },
    },
    { upsert: true }
  );
}

console.log('Demo users and profiles are ready. The password for newly created users is: Password123!');
await mongoose.disconnect();
