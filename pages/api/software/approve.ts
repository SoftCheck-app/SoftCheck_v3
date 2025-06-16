import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Importamos desde lib/prisma.ts para usar las extensiones
import { prisma } from '@/lib/prisma';

/**
 * API Route para el proceso de aprobación de software
 * 
 * POST: Envía una solicitud de aprobación al servicio externo y actualiza el estado en la base de datos
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { softwareId } = req.body;

    if (!softwareId) {
      return res.status(400).json({ message: 'Software ID is required' });
    }

    // Obtener información del software de la base de datos
    const software = await prisma.softwareDatabase.findUnique({
      where: {
        id: softwareId
      }
    });

    if (!software) {
      return res.status(404).json({ message: 'Software not found' });
    }

    // Si ya está aprobado, retornar mensaje
    if (software.isApproved) {
      return res.status(200).json({ 
        message: 'Software is already approved',
        status: 'approved'
      });
    }

    // Preparar datos para enviar al servicio de autorización
    const authPayload = {
      nombre_aplicacion: software.softwareName,
      nombre_empresa: "SafeOrg",
      version: software.version,
      sha256: software.sha256,
      fecha: new Date().toISOString(),
      identificador_origen: "softcheck_v3"
    };

    console.log("Enviando solicitud de autorización:", authPayload);

    try {
      // Enviar solicitud al servicio de autorización
      const authResponse = await axios.post('http://35.214.207.244:5000/auth/check', authPayload);
      //const authResponse = await axios.post('http://localhost:5001/auth/check', authPayload);
      
      console.log("Respuesta del servicio de autorización:", authResponse.data);
      
      // Procesar respuesta - capturar solo los campos esenciales
      const { 
        autorizado, 
        razon, 
        temperatura, 
        temperatura_evaluacion, 
        umbral_tolerancia,
        razon_de_la_IA
      } = authResponse.data;
      
      // Crear logging detallado para debugging
      console.log(`Decisión IA para ${software.softwareName}: ${autorizado === 1 ? 'APROBADO' : 'DENEGADO'}`);
      console.log(`Razón detallada: ${razon}`);
      console.log(`Métricas IA: Temp=${temperatura}, Eval=${temperatura_evaluacion}, Umbral=${umbral_tolerancia}`);
      if (razon_de_la_IA) {
        console.log(`Razón detallada de la IA: ${razon_de_la_IA}`);
      }
      
      // Construir notas usando la razón detallada de la IA si está disponible
      let notes = '';
      
      // Usar razon_de_la_IA si está disponible, sino usar razon normal
      const razonFinal = razon_de_la_IA || razon || (autorizado === 1 ? 'Software verificado correctamente' : 'Software no cumple con criterios de seguridad');
      
      if (autorizado === 1) {
        notes = `APPROVED: ${razonFinal}`;
      } else {
        notes = `DENIED: ${razonFinal}`;
      }
      
      // Actualizar el software en la base de datos
      const updatedSoftware = await prisma.softwareDatabase.update({
        where: {
          id: softwareId
        },
        data: {
          isApproved: autorizado === 1,
          notes: notes,
          approvedDate: new Date(), // Establecer fecha de aprobación/denegación
          RiskLevel: Math.round(temperatura_evaluacion * 100) // Convertir temperatura_evaluacion a RiskLevel (0-100)
        }
      });

      return res.status(200).json({
        message: 'Approval process completed',
        status: autorizado === 1 ? 'approved' : 'denied',
        reason: razonFinal,
        software: updatedSoftware,
        details: {
          temperature: temperatura,
          evaluationTemperature: temperatura_evaluacion,
          toleranceThreshold: umbral_tolerancia
        }
      });
    } catch (authError) {
      console.error("Error en la comunicación con el servicio de autorización:", authError);
      
    }
  } catch (error) {
    console.error('Error in approval process:', error);
    return res.status(500).json({ 
      message: 'Error during approval process', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 