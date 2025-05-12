import { prisma } from '@/lib/prisma';
import { getSession } from 'next-auth/react';
import type { NextApiRequest, NextApiResponse } from 'next';
import { Prisma } from '@prisma/client';

/**
 * API Route para gestionar empleados
 * 
 * GET: Obtener lista de empleados
 * POST: Añadir nuevo empleado
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // GET: Obtener lista de empleados
  if (req.method === 'GET') {
    try {
      const { status, department, role, search, sortBy, sortOrder } = req.query;

      let whereClause: any = {};
      
      // Filtrar por estado
      if (status) {
        whereClause.status = status;
      }

      // Filtrar por departamento
      if (department) {
        whereClause.department = {
          contains: department as string,
          mode: 'insensitive',
        };
      }

      // Filtrar por rol
      if (role) {
        whereClause.role = {
          contains: role as string,
          mode: 'insensitive',
        };
      }
      
      // Búsqueda por nombre o email
      if (search) {
        whereClause.OR = [
          {
            name: {
              contains: search as string,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: search as string,
              mode: 'insensitive',
            },
          },
        ];
      }

      // Determinar el orden de clasificación
      const orderBy: any = {};
      if (sortBy) {
        const field = sortBy as string;
        const direction = sortOrder === 'desc' ? 'desc' : 'asc';
        
        // Solo permitir ordenar por campos específicos
        if (['name', 'email', 'department', 'role', 'status'].includes(field)) {
          orderBy[field] = direction;
        }
      } else {
        // Orden predeterminado por nombre
        orderBy.name = 'asc';
      }

      const employees = await prisma.employee.findMany({
        where: whereClause,
        include: {
          software: {
            select: {
              id: true,
              softwareName: true,
              version: true,
              installDate: true,
              isApproved: true,
            },
          },
        },
        orderBy,
      });

      return res.status(200).json(employees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      return res.status(500).json({ message: 'Error fetching employees', error });
    }
  }

  // POST: Añadir nuevo empleado
  if (req.method === 'POST') {
    try {
      const { 
        name, 
        email, 
        department,
        role,
        status 
      } = req.body;

      // Validación básica
      if (!name || !email || !department || !role) {
        return res.status(400).json({ 
          message: 'Missing required fields',
          requiredFields: ['name', 'email', 'department', 'role']
        });
      }

      // Verificar si el email ya existe
      const existingEmployee = await prisma.employee.findUnique({
        where: {
          email,
        },
      });

      if (existingEmployee) {
        return res.status(400).json({ message: 'Employee with this email already exists' });
      }

      const newEmployee = await prisma.employee.create({
        data: {
          name,
          email,
          department,
          role,
          status: status || 'active',
        },
      });

      return res.status(201).json(newEmployee);
    } catch (error) {
      console.error('Error creating employee:', error);
      return res.status(500).json({ message: 'Error creating employee', error });
    }
  }

  // Método no permitido
  return res.status(405).json({ message: 'Method not allowed' });
} 