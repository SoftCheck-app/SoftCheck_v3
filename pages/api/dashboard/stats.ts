import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';
import type { NextApiRequest, NextApiResponse } from 'next';

// Initialize Prisma client 
// Importamos desde lib/prisma.ts para usar las extensiones
import { prisma } from '@/lib/prisma';

/**
 * API Route to get dashboard statistics
 * 
 * GET: Get general statistics
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Count total software
    const totalSoftware = await prisma.softwareDatabase.count();
    
    // Count total employees
    const totalEmployees = await prisma.employee.count({
      where: {
        status: 'active',
      },
    });
    
    // Count software approved this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const softwareApprovedThisMonth = await prisma.softwareDatabase.count({
      where: {
        isApproved: true,
        installDate: {
          gte: startOfMonth,
        },
      },
    });
    
    // Company risk data (mock data for now)
    const companyRisk = {
      level: 'Low',
      percentage: 20
    };
    
    // Malware blocked (mock data for now)
    const malwareBlocked = 6;
    
    // Employees hours saved (mock data for now)
    const employeesHoursSaved = {
      hours: 42,
      savings: 700
    };
    
    // Get recent activity (last 3 actions)
    const recentSoftware = await prisma.softwareDatabase.findMany({
      take: 5,
      orderBy: {
        installDate: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });
    
    // Transform recent activity into a unified format
    const recentActivity = recentSoftware.map(software => ({
      type: 'software',
      title: 'Software updated',
      timestamp: software.installDate,
      description: `${software.softwareName} - ${software.user?.name || 'Admin'}`,
    })).slice(0, 5);
    
    // Return all statistics
    return res.status(200).json({
      totalSoftware,
      totalEmployees,
      softwareApprovedThisMonth,
      companyRisk,
      malwareBlocked,
      employeesHoursSaved,
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ message: 'Error fetching dashboard stats', error });
  }
} 