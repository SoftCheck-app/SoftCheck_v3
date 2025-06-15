import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/nextAuth';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, getAuthOptions(req));

  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Slug de equipo inválido' });
  }

  // Obtener el equipo
  const team = await prisma.team.findUnique({
    where: { slug },
    include: {
      members: {
        where: {
          userId: session.user.id,
        },
      },
    },
  });

  if (!team) {
    return res.status(404).json({ error: 'Equipo no encontrado' });
  }

  if (team.members.length === 0) {
    return res.status(403).json({ error: 'No tienes permiso para acceder a este equipo' });
  }

  // GET: Obtener políticas de riesgo
  if (req.method === 'GET') {
    try {
      const policies = await prisma.riskPolicy.findMany({
        where: { teamId: team.id },
        orderBy: { category: 'asc' },
      });

      // Si no hay políticas, crear las predeterminadas
      if (policies.length === 0) {
        const defaultPolicies = [
          {
            name: 'Cumplimiento RGPD',
            description: 'Verificar que el software cumple con el RGPD y tiene políticas de privacidad claras',
            category: 'compliance',
            isEnabled: true,
            riskLevel: 80,
            teamId: team.id,
          },
          {
            name: 'Evaluación de Privacidad',
            description: 'Realizar evaluación de impacto de privacidad para software que procesa datos sensibles',
            category: 'privacy',
            isEnabled: true,
            riskLevel: 60,
            teamId: team.id,
          },
          {
            name: 'Control de Telemetría',
            description: 'Verificar y controlar la recopilación de datos y telemetría del software',
            category: 'privacy',
            isEnabled: true,
            riskLevel: 70,
            teamId: team.id,
          },
          {
            name: 'Firma Digital',
            description: 'Verificar que el software está firmado digitalmente por un emisor confiable',
            category: 'security',
            isEnabled: true,
            riskLevel: 80,
            teamId: team.id,
          },
          {
            name: 'Origen del Software',
            description: 'Verificar que el software se descarga de fuentes oficiales y tiene controles de integridad',
            category: 'security',
            isEnabled: true,
            riskLevel: 70,
            teamId: team.id,
          },
          {
            name: 'Vulnerabilidades',
            description: 'Verificar que el software no tiene vulnerabilidades conocidas y se actualiza regularmente',
            category: 'security',
            isEnabled: true,
            riskLevel: 80,
            teamId: team.id,
          },
          {
            name: 'Capacidades del Software',
            description: 'Evaluar los permisos y capacidades requeridas por el software',
            category: 'security',
            isEnabled: true,
            riskLevel: 60,
            teamId: team.id,
          },
          {
            name: 'Soporte y Mantenimiento',
            description: 'Verificar que el software tiene soporte activo y mantenimiento regular',
            category: 'maintenance',
            isEnabled: true,
            riskLevel: 50,
            teamId: team.id,
          },
          {
            name: 'Control de Contenido Sensible',
            description: 'Bloquear software que pueda acceder o distribuir contenido para adultos o material sensible',
            category: 'compliance',
            isEnabled: true,
            riskLevel: 90,
            teamId: team.id,
          },
          {
            name: 'Gestión de Videojuegos',
            description: 'Controlar y aprobar la instalación de videojuegos, verificando su clasificación por edad y contenido',
            category: 'compliance',
            isEnabled: true,
            riskLevel: 70,
            teamId: team.id,
          },
          {
            name: 'Prevención de Juegos de Azar',
            description: 'Bloquear software relacionado con juegos de azar, apuestas online o casinos virtuales',
            category: 'compliance',
            isEnabled: true,
            riskLevel: 85,
            teamId: team.id,
          },
        ];

        await prisma.riskPolicy.createMany({
          data: defaultPolicies,
        });

        return res.status(200).json(defaultPolicies);
      }

      // Filtrar duplicados por nombre y descripción únicos
      const uniquePolicies = [];
      const seen = new Set();
      for (const p of policies) {
        const key = p.name + '|' + p.description;
        if (!seen.has(key)) {
          uniquePolicies.push(p);
          seen.add(key);
        }
      }
      return res.status(200).json(uniquePolicies);
    } catch (error) {
      console.error('Error al obtener políticas de riesgo:', error);
      return res.status(500).json({ error: 'Error al obtener políticas de riesgo' });
    }
  }

  // POST: Actualizar políticas de riesgo
  if (req.method === 'POST') {
    if (!team.members[0].role || !['OWNER', 'ADMIN'].includes(team.members[0].role)) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar las políticas de riesgo' });
    }

    try {
      const policies = req.body as Array<{
        id: string;
        isEnabled: boolean;
      }>;

      // Actualizar cada política
      await Promise.all(
        policies.map((policy) =>
          prisma.riskPolicy.update({
            where: { id: policy.id },
            data: { isEnabled: policy.isEnabled },
          })
        )
      );

      const updatedPolicies = await prisma.riskPolicy.findMany({
        where: { teamId: team.id },
        orderBy: { category: 'asc' },
      });

      return res.status(200).json(updatedPolicies);
    } catch (error) {
      console.error('Error al actualizar políticas de riesgo:', error);
      return res.status(500).json({ error: 'Error al actualizar políticas de riesgo' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
} 