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
    
    // Count software approved this month (dynamic)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed (0 = January)
    
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
    // Calculate dates for last month
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const startOfLastMonth = new Date(lastMonthYear, lastMonth, 1);
    const endOfLastMonth = new Date(lastMonthYear, lastMonth + 1, 0, 23, 59, 59, 999);
    
    // Debug logging
    console.log('=== DEBUG: Software Approved This Month ===');
    console.log('Current date:', now);
    console.log('Start of month:', startOfMonth);
    console.log('End of month:', endOfMonth);
    console.log('Start of last month:', startOfLastMonth);
    console.log('End of last month:', endOfLastMonth);
    
    // Try with raw SQL using date strings instead of date objects
    const startOfMonthStr = startOfMonth.toISOString();
    const endOfMonthStr = endOfMonth.toISOString();
    
    console.log('Date strings for query:');
    console.log('Start:', startOfMonthStr);
    console.log('End:', endOfMonthStr);
    
    const softwareApprovedThisMonthRaw = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "SoftwareDatabase" 
      WHERE "isApproved" = true 
      AND "installDate" >= ${startOfMonthStr}::timestamp
      AND "installDate" <= ${endOfMonthStr}::timestamp
    `;
    
    const softwareApprovedThisMonth = Number(softwareApprovedThisMonthRaw[0]?.count || 0);
    
    console.log('Software approved this month count:', softwareApprovedThisMonth);
    
    // Also check total approved software for debugging
    const totalApprovedRaw = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "SoftwareDatabase" 
      WHERE "isApproved" = true
    `;
    const totalApproved = Number(totalApprovedRaw[0]?.count || 0);
    console.log('Total approved software:', totalApproved);

    // Calculate software approved last month for comparison

    const startOfLastMonthStr = startOfLastMonth.toISOString();
    const endOfLastMonthStr = endOfLastMonth.toISOString();
    
    const softwareApprovedLastMonthRaw = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "SoftwareDatabase" 
      WHERE "isApproved" = true 
      AND "installDate" >= ${startOfLastMonthStr}::timestamp
      AND "installDate" <= ${endOfLastMonthStr}::timestamp
    `;
    
    const softwareApprovedLastMonth = Number(softwareApprovedLastMonthRaw[0]?.count || 0);
    
    console.log('Software approved last month count:', softwareApprovedLastMonth);

    // Calculate percentage change
    let approvalChangePercentage = 0;
    if (softwareApprovedLastMonth > 0) {
      approvalChangePercentage = Math.round(
        ((softwareApprovedThisMonth - softwareApprovedLastMonth) / softwareApprovedLastMonth) * 100
      );
    } else if (softwareApprovedThisMonth > 0) {
      approvalChangePercentage = 100; // 100% increase from 0
    }
    
    // Calculate company risk based on RiskLevel average
    // Using raw query to avoid TypeScript issues with new column
    const riskData = await prisma.$queryRaw<Array<{ RiskLevel: number | null }>>`
      SELECT "RiskLevel" 
      FROM "SoftwareDatabase" 
      WHERE "RiskLevel" IS NOT NULL
    `;

    let companyRisk;
    
    if (riskData.length === 0) {
      // No risk data available
      companyRisk = {
        level: 'Unknown',
        percentage: 0,
        averageRisk: 0
      };
    } else {
      // Calculate weighted average of risk levels
      const totalRisk = riskData.reduce((sum, item) => sum + (item.RiskLevel || 0), 0);
      const averageRisk = Math.round(totalRisk / riskData.length);
      
      // Determine risk level based on average
      let level: string;
      if (averageRisk < 40) {
        level = 'Low';
      } else if (averageRisk >= 40 && averageRisk <= 60) {
        level = 'Medium';
      } else {
        level = 'High';
      }
      
      companyRisk = {
        level,
        percentage: averageRisk,
        averageRisk
      };
    }
    
    // Count malware blocked (dynamic) - software with RiskLevel >= 80
    const malwareBlockedData = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM "SoftwareDatabase" 
      WHERE "RiskLevel" >= 80
    `;
    
    const malwareBlocked = Number(malwareBlockedData[0]?.count || 0);
    
    // Calculate employees hours saved this month (dynamic)
    const softwareAddedThisMonth = await prisma.softwareDatabase.count({
      where: {
        installDate: {
          gte: startOfMonth,
        },
      },
    });
    
    // Calculate hours saved: software added this month * 1.5 hours per software
    const hoursThisMonth = Math.round(softwareAddedThisMonth * 1.5);
    
    // Calculate savings in euros: hours * 15€ per hour
    const savingsThisMonth = hoursThisMonth * 15;
    
    const employeesHoursSaved = {
      hours: hoursThisMonth,
      savings: savingsThisMonth
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
      approvalChangePercentage,
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