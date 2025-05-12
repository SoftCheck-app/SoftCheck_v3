import { prisma } from '../lib/prisma';

async function main() {
  console.log('🌱 Seeding SoftCheck test data...');

  // Limpiar datos existentes
  await prisma.softwareDatabase.deleteMany({});
  await prisma.employee.deleteMany({});

  console.log('✓ Deleted existing data');

  // Crear empleados
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        name: 'Ana García',
        email: 'ana.garcia@empresa.com',
        department: 'Diseño',
        role: 'UI Designer',
        status: 'active',
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Carlos Rodríguez',
        email: 'carlos.rodriguez@empresa.com',
        department: 'Desarrollo',
        role: 'Frontend Developer',
        status: 'active',
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Laura Martínez',
        email: 'laura.martinez@empresa.com',
        department: 'Marketing',
        role: 'Marketing Manager',
        status: 'active',
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Javier López',
        email: 'javier.lopez@empresa.com',
        department: 'Desarrollo',
        role: 'Backend Developer',
        status: 'active',
      },
    }),
    prisma.employee.create({
      data: {
        name: 'María Sánchez',
        email: 'maria.sanchez@empresa.com',
        department: 'Recursos Humanos',
        role: 'HR Manager',
        status: 'active',
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Pablo Fernández',
        email: 'pablo.fernandez@empresa.com',
        department: 'Contabilidad',
        role: 'Financial Analyst',
        status: 'active',
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Sofía Muñoz',
        email: 'sofia.munoz@empresa.com',
        department: 'Diseño',
        role: 'Product Designer',
        status: 'active',
      },
    }),
    prisma.employee.create({
      data: {
        name: 'David Torres',
        email: 'david.torres@empresa.com',
        department: 'Desarrollo',
        role: 'DevOps Engineer',
        status: 'active',
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Elena Ramírez',
        email: 'elena.ramirez@empresa.com',
        department: 'Ventas',
        role: 'Sales Manager',
        status: 'active',
      },
    }),
    prisma.employee.create({
      data: {
        name: 'Roberto Díaz',
        email: 'roberto.diaz@empresa.com',
        department: 'Soporte',
        role: 'IT Support',
        status: 'inactive',
      },
    }),
  ]);

  console.log(`✓ Created ${employees.length} employees`);

  // Crear registros de software
  const softwareInstalls = await Promise.all([
    // Software para Ana García
    prisma.softwareDatabase.create({
      data: {
        deviceId: 'DESKTOP-ANA001',
        userId: employees[0].id,
        softwareName: 'Adobe Creative Cloud',
        version: '2023.1.0',
        vendor: 'Adobe',
        installDate: new Date('2023-05-16'),
        installPath: 'C:\\Program Files\\Adobe\\Creative Cloud',
        installMethod: 'manual',
        lastExecuted: new Date('2023-08-10'),
        isRunning: false,
        digitalSignature: 'Valid',
        isApproved: true,
        detectedBy: 'agent',
        sha256: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z',
        notes: 'Instalación estándar',
      },
    }),
    prisma.softwareDatabase.create({
      data: {
        deviceId: 'DESKTOP-ANA001',
        userId: employees[0].id,
        softwareName: 'Figma Pro',
        version: '116.14.7',
        vendor: 'Figma',
        installDate: new Date('2023-01-11'),
        installPath: 'C:\\Users\\Ana\\AppData\\Local\\Figma',
        installMethod: 'auto',
        lastExecuted: new Date('2023-08-15'),
        isRunning: true,
        digitalSignature: 'Valid',
        isApproved: true,
        detectedBy: 'agent',
        sha256: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
        notes: null,
      },
    }),
    // Software para Carlos Rodríguez
    prisma.softwareDatabase.create({
      data: {
        deviceId: 'LAPTOP-CARLOS002',
        userId: employees[1].id,
        softwareName: 'VS Code Pro',
        version: '1.80.1',
        vendor: 'Microsoft',
        installDate: new Date('2023-03-21'),
        installPath: 'C:\\Users\\Carlos\\AppData\\Local\\Programs\\Microsoft VS Code',
        installMethod: 'manual',
        lastExecuted: new Date('2023-08-16'),
        isRunning: true,
        digitalSignature: 'Valid',
        isApproved: true,
        detectedBy: 'agent',
        sha256: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1',
        notes: null,
      },
    }),
    // Brave (sin licencia)
    prisma.softwareDatabase.create({
      data: {
        deviceId: 'LAPTOP-CARLOS002',
        userId: employees[1].id,
        softwareName: 'Brave',
        version: 'v2024.2.1',
        vendor: 'Brave Software',
        installDate: new Date('2023-02-10'),
        installPath: 'C:\\Program Files\\BraveSoftware\\Brave-Browser',
        installMethod: 'manual',
        lastExecuted: new Date('2023-08-16'),
        isRunning: false,
        digitalSignature: 'Valid',
        isApproved: true,
        detectedBy: 'agent',
        sha256: 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2',
        notes: 'Navegador principal',
      },
    }),
    // Obsidian para Javier
    prisma.softwareDatabase.create({
      data: {
        deviceId: 'LAPTOP-JAVIER001',
        userId: employees[3].id,
        softwareName: 'Obsidian',
        version: 'v16.0.15330',
        vendor: 'Obsidian',
        installDate: new Date('2023-07-15'),
        installPath: 'C:\\Users\\Javier\\AppData\\Local\\Obsidian',
        installMethod: 'manual',
        lastExecuted: new Date(Date.now() - 259200000), // 3 días atrás
        isRunning: false,
        digitalSignature: 'Valid',
        isApproved: true,
        detectedBy: 'agent',
        sha256: 'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3',
        notes: 'Para tomar notas de desarrollo',
      },
    }),
    // Slack para varios usuarios
    prisma.softwareDatabase.create({
      data: {
        deviceId: 'LAPTOP-CARLOS002',
        userId: employees[1].id,
        softwareName: 'Slack',
        version: 'v4.29.149',
        vendor: 'Slack Technologies',
        installDate: new Date('2023-01-05'),
        installPath: 'C:\\Users\\Carlos\\AppData\\Local\\slack',
        installMethod: 'auto',
        lastExecuted: new Date('2023-08-16'),
        isRunning: true,
        digitalSignature: 'Valid',
        isApproved: true,
        detectedBy: 'agent',
        sha256: 'f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4',
        notes: null,
      },
    }),
    prisma.softwareDatabase.create({
      data: {
        deviceId: 'DESKTOP-ANA001',
        userId: employees[0].id,
        softwareName: 'Slack',
        version: 'v4.29.149',
        vendor: 'Slack Technologies',
        installDate: new Date('2023-01-06'),
        installPath: 'C:\\Users\\Ana\\AppData\\Local\\slack',
        installMethod: 'auto',
        lastExecuted: new Date('2023-08-15'),
        isRunning: false,
        digitalSignature: 'Valid',
        isApproved: true,
        detectedBy: 'agent',
        sha256: 'f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4',
        notes: null,
      },
    }),
    // Software para Sofía Muñoz (Figma reciente)
    prisma.softwareDatabase.create({
      data: {
        deviceId: 'MACBOOK-SOFIA001',
        userId: employees[6].id,
        softwareName: 'Figma Pro',
        version: '116.14.7',
        vendor: 'Figma',
        installDate: new Date(Date.now() - 7200000), // 2 horas atrás (instalación reciente)
        installPath: '/Applications/Figma.app',
        installMethod: 'auto',
        lastExecuted: new Date(Date.now() - 3600000), // 1 hora atrás
        isRunning: false,
        digitalSignature: 'Valid',
        isApproved: true,
        detectedBy: 'agent',
        sha256: 'g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5',
        notes: 'Instalación nueva',
      },
    }),
    // Adobe para Sofía
    prisma.softwareDatabase.create({
      data: {
        deviceId: 'MACBOOK-SOFIA001',
        userId: employees[6].id,
        softwareName: 'Adobe Creative Cloud',
        version: '2023.1.0',
        vendor: 'Adobe',
        installDate: new Date('2023-07-21'),
        installPath: '/Applications/Adobe Creative Cloud',
        installMethod: 'manual',
        lastExecuted: new Date('2023-08-15'),
        isRunning: false,
        digitalSignature: 'Valid',
        isApproved: true,
        detectedBy: 'agent',
        sha256: 'h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6',
        notes: null,
      },
    }),
    // Zoom
    prisma.softwareDatabase.create({
      data: {
        deviceId: 'MACBOOK-SOFIA001',
        userId: employees[6].id,
        softwareName: 'Zoom',
        version: 'v5.13.5',
        vendor: 'Zoom Video Communications',
        installDate: new Date('2023-03-01'),
        installPath: '/Applications/zoom.us.app',
        installMethod: 'manual',
        lastExecuted: new Date('2023-08-15'),
        isRunning: false,
        digitalSignature: 'Valid',
        isApproved: true,
        detectedBy: 'agent',
        sha256: 'i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7',
        notes: null,
      },
    }),
    // Spotify
    prisma.softwareDatabase.create({
      data: {
        deviceId: 'LAPTOP-CARLOS002',
        userId: employees[1].id,
        softwareName: 'Spotify',
        version: 'v116.14.7',
        vendor: 'Spotify AB',
        installDate: new Date('2023-01-15'),
        installPath: 'C:\\Users\\Carlos\\AppData\\Roaming\\Spotify',
        installMethod: 'manual',
        lastExecuted: new Date('2023-08-16'),
        isRunning: true,
        digitalSignature: 'Valid',
        isApproved: true,
        detectedBy: 'agent',
        sha256: 'j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8',
        notes: null,
      },
    }),
    // Software detectado sin aprobar
    prisma.softwareDatabase.create({
      data: {
        deviceId: 'LAPTOP-CARLOS002',
        userId: employees[1].id,
        softwareName: 'uTorrent',
        version: '3.5.5',
        vendor: 'BitTorrent',
        installDate: new Date('2023-06-15'),
        installPath: 'C:\\Program Files\\uTorrent',
        installMethod: 'manual',
        lastExecuted: new Date('2023-08-14'),
        isRunning: false,
        digitalSignature: 'Unknown',
        isApproved: false,
        detectedBy: 'scan',
        sha256: 'k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8i9',
        notes: 'Software no autorizado',
      },
    }),
    // Más software aprobado este mes (reciente)
    prisma.softwareDatabase.create({
      data: {
        deviceId: 'LAPTOP-JAVIER001',
        userId: employees[3].id,
        softwareName: 'Node.js',
        version: '18.17.0',
        vendor: 'OpenJS Foundation',
        installDate: new Date('2023-08-05'),
        installPath: 'C:\\Program Files\\nodejs',
        installMethod: 'manual',
        lastExecuted: new Date('2023-08-15'),
        isRunning: false,
        digitalSignature: 'Valid',
        isApproved: true,
        detectedBy: 'agent',
        sha256: 'l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8i9j0',
        notes: null,
      },
    }),
    prisma.softwareDatabase.create({
      data: {
        deviceId: 'MACBOOK-SOFIA001',
        userId: employees[6].id,
        softwareName: 'Sketch',
        version: '94.1',
        vendor: 'Sketch B.V.',
        installDate: new Date('2023-08-10'),
        installPath: '/Applications/Sketch.app',
        installMethod: 'manual',
        lastExecuted: new Date('2023-08-14'),
        isRunning: false,
        digitalSignature: 'Valid',
        isApproved: true,
        detectedBy: 'agent',
        sha256: 'm3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6g7h8i9j0k1',
        notes: 'Versión de prueba',
      },
    }),
  ]);

  console.log(`✓ Created ${softwareInstalls.length} software installations`);
  console.log('✓ Seeding completed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 