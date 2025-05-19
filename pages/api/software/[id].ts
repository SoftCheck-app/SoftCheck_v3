import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid software ID' });
  }

  if (req.method === 'DELETE') {
    try {
      // Verificar si el software existe
      const software = await prisma.softwareDatabase.findUnique({
        where: { id }
      });

      if (!software) {
        return res.status(404).json({ message: 'Software not found' });
      }

      // Eliminar el software
      await prisma.softwareDatabase.delete({
        where: { id }
      });

      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting software:', error);
      return res.status(500).json({ message: 'Error deleting software' });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
} 