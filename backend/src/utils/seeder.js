import { getDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';
import { Team } from '../models/Team.js';
import { Application } from '../models/Application.js';
import { Report } from '../models/Report.js';
import { Vulnerability } from '../models/Vulnerability.js';

export async function seedDatabase() {
  const db = await getDatabase();
  
  console.log('Starting database seeding...');

  try {
    // Clear existing data
    await db.collection('users').deleteMany({});
    await db.collection('teams').deleteMany({});
    await db.collection('applications').deleteMany({});
    await db.collection('reports').deleteMany({});
    await db.collection('vulnerabilities').deleteMany({});

    // Create teams
    const teams = [
      new Team({
        name: 'Web Development Team',
        platform: 'Web',
        applicationIds: []
      }),
      new Team({
        name: 'iOS Development Team',
        platform: 'iOS',
        applicationIds: []
      }),
      new Team({
        name: 'Android Development Team',
        platform: 'Android',
        applicationIds: []
      })
    ];

    const teamResults = await Promise.all(
      teams.map(team => db.collection('teams').insertOne(team.toMongo()))
    );

    const teamIds = teamResults.map(result => result.insertedId.toString());

    // Create users
    const defaultPassword = process.env.SEED_USER_PASSWORD || 'password123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const users = [
      new User({
        email: 'admin@company.com',
        name: 'Admin User',
        role: 'Admin',
        teamIds: teamIds,
        passwordHash,
      }),
      new User({
        email: 'security@company.com',
        name: 'Security Analyst',
        role: 'Security',
        teamIds: teamIds,
        passwordHash,
      }),
      new User({
        email: 'web.dev@company.com',
        name: 'Web Developer',
        role: 'Dev',
        teamIds: [teamIds[0]],
        passwordHash,
      }),
      new User({
        email: 'ios.dev@company.com',
        name: 'iOS Developer',
        role: 'Dev',
        teamIds: [teamIds[1]],
        passwordHash,
      }),
      new User({
        email: 'android.dev@company.com',
        name: 'Android Developer',
        role: 'Dev',
        teamIds: [teamIds[2]],
        passwordHash,
      }),
      new User({
        email: 'web.po@company.com',
        name: 'Web Product Owner',
        role: 'ProductOwner',
        teamIds: [teamIds[0]],
        passwordHash,
      })
    ];

    const userResults = await Promise.all(
      users.map(user => db.collection('users').insertOne(user.toMongo()))
    );

    const userIds = userResults.map(result => result.insertedId.toString());

    // Create applications
    const applications = [
      new Application({
        name: 'Company Website',
        platform: 'Web',
        teamId: teamIds[0],
        description: 'Main company website with customer portal'
      }),
      new Application({
        name: 'Mobile Banking App',
        platform: 'iOS',
        teamId: teamIds[1],
        description: 'iOS banking application for customers'
      }),
      new Application({
        name: 'Mobile Banking App',
        platform: 'Android',
        teamId: teamIds[2],
        description: 'Android banking application for customers'
      }),
      new Application({
        name: 'Admin Dashboard',
        platform: 'Web',
        teamId: teamIds[0],
        description: 'Internal admin dashboard for managing users and data'
      })
    ];

    const appResults = await Promise.all(
      applications.map(app => db.collection('applications').insertOne(app.toMongo()))
    );

    const appIds = appResults.map(result => result.insertedId.toString());

    // Update teams with application IDs
    await Promise.all([
      db.collection('teams').updateOne(
        { _id: teamResults[0].insertedId },
        { $set: { applicationIds: [appIds[0], appIds[3]] } }
      ),
      db.collection('teams').updateOne(
        { _id: teamResults[1].insertedId },
        { $set: { applicationIds: [appIds[1]] } }
      ),
      db.collection('teams').updateOne(
        { _id: teamResults[2].insertedId },
        { $set: { applicationIds: [appIds[2]] } }
      )
    ]);

    // Create reports
    const reports = [
      new Report({
        driveFileId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        fileName: 'VAPT_Report_Company_Website_2024.pdf',
        vendorName: 'SecureVault Security',
        applicationId: appIds[0],
        dateUploaded: new Date('2024-01-15'),
        reportDate: new Date('2024-01-10'),
        parsed: true,
        vulnerabilityIds: []
      }),
      new Report({
        driveFileId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        fileName: 'VAPT_Report_Mobile_Banking_iOS_2024.pdf',
        vendorName: 'CyberShield Labs',
        applicationId: appIds[1],
        dateUploaded: new Date('2024-02-01'),
        reportDate: new Date('2024-01-25'),
        parsed: true,
        vulnerabilityIds: []
      }),
      new Report({
        driveFileId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        fileName: 'VAPT_Report_Mobile_Banking_Android_2024.pdf',
        vendorName: 'SecureTech Solutions',
        applicationId: appIds[2],
        dateUploaded: new Date('2024-02-15'),
        reportDate: new Date('2024-02-10'),
        parsed: false,
        vulnerabilityIds: []
      })
    ];

    const reportResults = await Promise.all(
      reports.map(report => db.collection('reports').insertOne(report.toMongo()))
    );

    const reportIds = reportResults.map(result => result.insertedId.toString());

    // Create vulnerabilities
    const vulnerabilities = [
      new Vulnerability({
        applicationId: appIds[0],
        reportId: reportIds[0],
        title: 'SQL Injection in Login Form',
        description: 'The login form is vulnerable to SQL injection attacks. An attacker can manipulate the SQL query to bypass authentication.',
        severity: 'Critical',
        cvssScore: 9.8,
        cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
        cwe: ['CWE-89'],
        cve: ['CVE-2024-0001'],
        status: 'Open',
        discoveredDate: new Date('2024-01-10'),
        dueDate: new Date('2024-02-10'),
        assignedToUserId: userIds[2],
        tags: ['authentication', 'database', 'injection']
      }),
      new Vulnerability({
        applicationId: appIds[0],
        reportId: reportIds[0],
        title: 'Cross-Site Scripting (XSS) in Search Function',
        description: 'The search functionality is vulnerable to reflected XSS attacks. User input is not properly sanitized.',
        severity: 'High',
        cvssScore: 7.2,
        cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:L/A:N',
        cwe: ['CWE-79'],
        cve: ['CVE-2024-0002'],
        status: 'In Progress',
        discoveredDate: new Date('2024-01-10'),
        dueDate: new Date('2024-02-15'),
        assignedToUserId: userIds[2],
        tags: ['xss', 'input-validation', 'client-side']
      }),
      new Vulnerability({
        applicationId: appIds[0],
        reportId: reportIds[0],
        title: 'Weak Password Policy',
        description: 'The application allows weak passwords that do not meet security requirements.',
        severity: 'Medium',
        cvssScore: 5.3,
        cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N',
        cwe: ['CWE-521'],
        cve: [],
        status: 'Fixed',
        discoveredDate: new Date('2024-01-10'),
        resolvedDate: new Date('2024-01-25'),
        assignedToUserId: userIds[2],
        tags: ['authentication', 'password-policy']
      }),
      new Vulnerability({
        applicationId: appIds[1],
        reportId: reportIds[1],
        title: 'Insecure Data Storage',
        description: 'Sensitive data is stored in plain text in the app\'s local storage.',
        severity: 'High',
        cvssScore: 7.5,
        cvssVector: 'CVSS:3.1/AV:L/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N',
        cwe: ['CWE-312'],
        cve: ['CVE-2024-0003'],
        status: 'Open',
        discoveredDate: new Date('2024-01-25'),
        dueDate: new Date('2024-03-01'),
        assignedToUserId: userIds[3],
        tags: ['data-protection', 'encryption', 'mobile']
      }),
      new Vulnerability({
        applicationId: appIds[1],
        reportId: reportIds[1],
        title: 'Certificate Pinning Bypass',
        description: 'The app does not implement proper certificate pinning, making it vulnerable to MITM attacks.',
        severity: 'Medium',
        cvssScore: 5.9,
        cvssVector: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:N/A:N',
        cwe: ['CWE-295'],
        cve: ['CVE-2024-0004'],
        status: 'In Progress',
        discoveredDate: new Date('2024-01-25'),
        dueDate: new Date('2024-03-15'),
        assignedToUserId: userIds[3],
        tags: ['ssl-tls', 'network-security', 'mobile']
      }),
      new Vulnerability({
        applicationId: appIds[2],
        reportId: reportIds[2],
        title: 'Intent Redirection Vulnerability',
        description: 'The app allows arbitrary intent redirection which could lead to data theft.',
        severity: 'Critical',
        cvssScore: 8.8,
        cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H',
        cwe: ['CWE-601'],
        cve: ['CVE-2024-0005'],
        status: 'New',
        discoveredDate: new Date('2024-02-10'),
        dueDate: new Date('2024-03-10'),
        assignedToUserId: userIds[4],
        tags: ['intent', 'android', 'data-leakage']
      }),
      new Vulnerability({
        applicationId: appIds[3],
        reportId: null,
        title: 'Missing Input Validation in User Management',
        description: 'The admin dashboard lacks proper input validation for user management operations.',
        severity: 'High',
        cvssScore: 7.2,
        cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:H/A:N',
        cwe: ['CWE-20'],
        cve: [],
        status: 'Open',
        discoveredDate: new Date('2024-02-20'),
        dueDate: new Date('2024-03-20'),
        assignedToUserId: userIds[2],
        tags: ['input-validation', 'admin', 'privilege-escalation']
      })
    ];

    const vulnResults = await Promise.all(
      vulnerabilities.map(vuln => db.collection('vulnerabilities').insertOne(vuln.toMongo()))
    );

    const vulnIds = vulnResults.map(result => result.insertedId.toString());

    // Update reports with vulnerability IDs
    await Promise.all([
      db.collection('reports').updateOne(
        { _id: reportResults[0].insertedId },
        { $set: { vulnerabilityIds: [vulnIds[0], vulnIds[1], vulnIds[2]] } }
      ),
      db.collection('reports').updateOne(
        { _id: reportResults[1].insertedId },
        { $set: { vulnerabilityIds: [vulnIds[3], vulnIds[4]] } }
      ),
      db.collection('reports').updateOne(
        { _id: reportResults[2].insertedId },
        { $set: { vulnerabilityIds: [vulnIds[5]] } }
      )
    ]);

    console.log('Database seeding completed successfully!');
    console.log(`Created ${teams.length} teams`);
    console.log(`Created ${users.length} users`);
    console.log(`Created ${applications.length} applications`);
    console.log(`Created ${reports.length} reports`);
    console.log(`Created ${vulnerabilities.length} vulnerabilities`);

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run seeder if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
} 