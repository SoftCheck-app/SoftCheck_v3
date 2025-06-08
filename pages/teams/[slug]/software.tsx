import { AccountLayout } from '@/components/layouts';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { useTranslation } from 'next-i18next';
import { useEffect, useState, useMemo } from 'react';
import React from 'react';
import { SoftwareWithRelations } from 'types/softcheck';
import { useRouter } from 'next/router';
import axios from 'axios';
import { format } from 'date-fns';
import { Loading } from '@/components/shared';
import { MagnifyingGlassIcon, ChevronDownIcon, ChevronRightIcon, CheckCircleIcon, XCircleIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import useTeam from 'hooks/useTeam';
import toast from 'react-hot-toast';

// Ampliar SoftwareWithRelations para incluir status
interface ExtendedSoftware extends SoftwareWithRelations {
  status?: 'approved' | 'pending' | 'denied';
}

// Definir interface para los datos de instalación
interface InstallationCount {
  softwareName: string;
  version: string;
  installCount: number;
}

// Interface para software agrupado
interface GroupedSoftware {
  name: string;
  versions: ExtendedSoftware[];
  latestVersion: ExtendedSoftware;
}

// Interface para los usuarios que utilizan un software
interface SoftwareUser {
  id: string;
  name: string;
  email: string;
  department: string;
}

const SoftwareDatabase: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { slug } = router.query;
  const { isLoading: isTeamLoading, isError: isTeamError, team } = useTeam();
  
  const [softwareList, setSoftwareList] = useState<ExtendedSoftware[]>([]);
  const [installationCounts, setInstallationCounts] = useState<InstallationCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSoftware, setExpandedSoftware] = useState<string[]>([]);
  const [isApproving, setIsApproving] = useState<Record<string, boolean>>({});
  const [approvalMessages, setApprovalMessages] = useState<Record<string, { status: 'success' | 'error', message: string }>>({});
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [deleteMessages, setDeleteMessages] = useState<Record<string, { status: 'success' | 'error', message: string }>>({});
  const [softwareUsers, setSoftwareUsers] = useState<Record<string, SoftwareUser[]>>({});
  const [loadingUsers, setLoadingUsers] = useState<Record<string, boolean>>({});
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
  const [editingSoftware, setEditingSoftware] = useState<ExtendedSoftware | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Función para obtener datos de software
  const fetchData = async () => {
    if (!slug || !team?.id) return;
    
    try {
      setIsLoading(true);
      
      // Obtener lista de software filtrada por equipo
      const softwareResponse = await axios.get(`/api/software?teamId=${team.id}`);
      // Inicializar status basado en isApproved y el contenido de notes
      const softwareWithStatus = softwareResponse.data.map((sw: SoftwareWithRelations) => {
        let status = sw.isApproved ? 'approved' : 'pending';
        
        // Comprobar si hay un estado en notes
        if (sw.notes && typeof sw.notes === 'string') {
          if (sw.notes.startsWith('DENIED:')) {
            status = 'denied';
          } else if (sw.notes.startsWith('APPROVED:')) {
            status = 'approved';
          }
        }
        
        return {
          ...sw,
          status
        };
      });
      
      setSoftwareList(softwareWithStatus);
      
      try {
        // Obtener conteo de instalaciones en un bloque try-catch separado
        const installationsResponse = await axios.get('/api/software/installations');
        setInstallationCounts(installationsResponse.data);
      } catch (installErr) {
        console.error('Error fetching installation counts:', installErr);
        // No mostramos error general si solo falla el conteo de instalaciones
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching software data:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError(`Error: ${err.response.status} - ${err.response.data?.message || 'Failed to load data'}`);
      } else {
        setError('Failed to load software data. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [slug, team?.id]);

  // Función para verificar si hay nuevo software sin recargar toda la página
  const checkForNewSoftware = async (showIndicator = false) => {
    if (!slug || !team?.id || isLoading) return;
    
    try {
      if (showIndicator) setIsCheckingForUpdates(true);
      
      const response = await axios.get(`/api/software?teamId=${team.id}`);
      const newSoftwareList = response.data;
      
      // Comparar si hay cambios en la cantidad de software
      if (newSoftwareList.length !== softwareList.length) {
        console.log(`Nuevo software detectado: ${newSoftwareList.length} vs ${softwareList.length} items`);
        fetchData(); // Solo recargar si hay cambios
      } else {
        // Verificar si hay cambios en el estado de algún software existente
        const hasStatusChanges = softwareList.some(existingSw => {
          const newSw = newSoftwareList.find((sw: any) => sw.id === existingSw.id);
          return newSw && (newSw.isApproved !== existingSw.isApproved || newSw.notes !== existingSw.notes);
        });
        
        if (hasStatusChanges) {
          console.log('Cambios de estado detectados en software existente');
          fetchData();
        }
      }
    } catch (error) {
      console.error('Error verificando nuevo software:', error);
    } finally {
      if (showIndicator) setIsCheckingForUpdates(false);
    }
  };

  // Función para refresh manual
  const handleRefresh = () => {
    checkForNewSoftware(true);
  };

  // Efecto para polling automático de nuevo software (cada 15 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      checkForNewSoftware();
    }, 15000); // 15 segundos

    return () => clearInterval(interval);
  }, [slug, team?.id, softwareList, isLoading]);

  // Efecto para verificación automática de nuevo software pendiente
  useEffect(() => {
    if (softwareList.length === 0) return; // No ejecutar en el primer renderizado

    const verifyPendingSoftware = async () => {
      const pendingSoftware = softwareList.filter(sw => 
        sw.status === 'pending' && !isApproving[sw.id]
      );

      for (const software of pendingSoftware) {
        console.log(`Verificando automáticamente el software pendiente: ${software.softwareName}`);
        handleApprove(software.id, software.softwareName);
        // Agregar un pequeño delay entre verificaciones para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    };

    verifyPendingSoftware();
  }, [softwareList]);

  const handleAddSoftware = () => {
    router.push(`/teams/${slug}/software/new`);
  };

  const handleEditSoftware = (software: ExtendedSoftware) => {
    setEditingSoftware({ ...software });
    setIsEditing(true);
  };

  const handleCloseModal = () => {
    setIsEditing(false);
    setEditingSoftware(null);
  };

  const handleSaveSoftware = async () => {
    if (!editingSoftware || !team?.id) return;

    setIsSaving(true);
    try {
      const response = await axios.put('/api/software', {
        ...editingSoftware,
        teamId: team.id,
      });

      // Actualizar la lista de software
      setSoftwareList(prev => 
        prev.map(sw => sw.id === editingSoftware.id ? response.data : sw)
      );

      toast.success('Software updated successfully');
      handleCloseModal();
    } catch (error: any) {
      console.error('Error updating software:', error);
      toast.error(error.response?.data?.message || 'Failed to update software');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setEditingSoftware(prev => prev ? ({
      ...prev,
      [field]: value
    }) : null);
  };

  // Filtrar software según el término de búsqueda
  const filteredSoftwareList = useMemo(() => {
    return softwareList.filter(software => 
      software.softwareName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      software.version.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      // Ordenar por nombre y luego por fecha de instalación (más reciente primero)
      const nameComparison = a.softwareName.localeCompare(b.softwareName);
      if (nameComparison !== 0) return nameComparison;
      return new Date(b.installDate).getTime() - new Date(a.installDate).getTime();
    });
  }, [softwareList, searchTerm]);

  // Función para obtener el conteo de instalaciones de un software
  const getInstallationCount = (softwareName: string, version: string): number => {
    // Si no hay datos de instalación disponibles, mostrar '?'
    if (!installationCounts || installationCounts.length === 0) {
      return 0;
    }
    
    const installation = installationCounts.find(
      count => count.softwareName === softwareName && count.version === version
    );
    return installation ? Number(installation.installCount) : 0;
  };

  // Función para alternar la expansión de un software específico por ID
  const toggleExpand = (softwareId: string) => {
    const isCurrentlyExpanded = expandedSoftware.includes(softwareId);
    
    // Si no está expandido y vamos a expandirlo, cargar los usuarios
    if (!isCurrentlyExpanded) {
      const software = softwareList.find(sw => sw.id === softwareId);
      if (software) {
        fetchSoftwareUsers(software.softwareName);
      }
    }
    
    setExpandedSoftware(prev => {
      if (prev.includes(softwareId)) {
        return prev.filter(id => id !== softwareId);
      } else {
        return [...prev, softwareId];
      }
    });
  };

  // Función para verificar si un software específico está expandido
  const isExpanded = (softwareId: string) => {
    return expandedSoftware.includes(softwareId);
  };

  // Función para extraer y formatear la información de la IA desde notes
  const getAIAnalysis = (notes: string | null | undefined): string => {
    if (!notes) return 'No hay análisis de IA disponible';
    
    // Si las notes contienen información de la IA, extraerla
    if (notes.includes('Análisis de la IA:') || notes.includes('razon_de_la_IA')) {
      // Extraer la parte después de "Análisis de la IA:" o similar
      const aiMatch = notes.match(/(?:Análisis de la IA:|razon_de_la_IA[^:]*:)\s*(.+)/i);
      if (aiMatch && aiMatch[1]) {
        return aiMatch[1].trim();
      }
    }
    
    // Si las notes empiezan con APPROVED: o DENIED:, extraer el contenido
    if (notes.startsWith('APPROVED:') || notes.startsWith('DENIED:')) {
      return notes.substring(notes.indexOf(':') + 1).trim();
    }
    
    // Si no hay formato específico, devolver las notes completas
    return notes.trim() || 'No hay análisis de IA disponible';
  };

  // Función para iniciar el proceso de aprobación
  const handleApprove = async (softwareId: string, softwareName: string) => {
    try {
      // Marcar como procesando
      setIsApproving(prev => ({ ...prev, [softwareId]: true }));
      
      // Enviar solicitud al endpoint de aprobación
      const response = await axios.post('/api/software/approve', { softwareId });
      console.log("Respuesta de aprobación:", response.data);
      
      // Actualizar la lista de software después de la aprobación
      const updatedList = softwareList.map(software => {
        if (software.id === softwareId) {
          // Comprobar el resultado
          let newStatus = response.data.status;
          
          // Comprobar si hay notas con formato de estado
          if (response.data.software && response.data.software.notes) {
            if (response.data.software.notes.startsWith('DENIED:')) {
              newStatus = 'denied';
            } else if (response.data.software.notes.startsWith('APPROVED:')) {
              newStatus = 'approved';
            }
          }
          
          return { 
            ...software, 
            isApproved: response.data.status === 'approved',
            status: newStatus,
            notes: response.data.software?.notes || software.notes
          };
        }
        return software;
      });
      setSoftwareList(updatedList);
      
      // Mostrar mensaje de éxito
      setApprovalMessages(prev => ({ 
        ...prev, 
        [softwareId]: { 
          status: 'success', 
          message: `${response.data.status === 'approved' ? 'Aprobado' : 'Denegado'}` 
        } 
      }));
      
      // Limpiar después de unos segundos
      setTimeout(() => {
        setApprovalMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[softwareId];
          return newMessages;
        });
      }, 5000);
    } catch (error) {
      console.error('Error approving software:', error);
      
      // Mostrar mensaje de error
      setApprovalMessages(prev => ({ 
        ...prev, 
        [softwareId]: { 
          status: 'error', 
          message: 'Error en el proceso de aprobación' 
        } 
      }));
    } finally {
      // Desmarcar como procesando
      setIsApproving(prev => {
        const newState = { ...prev };
        delete newState[softwareId];
        return newState;
      });
    }
  };

  // Componente para mostrar el estado de aprobación
  const ApprovalButton = ({ software }: { software: ExtendedSoftware }) => {
    // Comprobar si está aprobado
    if (software.isApproved) {
      return (
        <span className="inline-flex items-center text-green-600">
          <CheckCircleIcon className="h-5 w-5 mr-1" />
          Aprobado
        </span>
      );
    }
    
    // Comprobar si está denegado (por status o por el contenido de notes)
    if (software.status === 'denied' || (software.notes && software.notes.startsWith('DENIED:'))) {
      return (
        <span className="inline-flex items-center text-red-600">
          <XCircleIcon className="h-5 w-5 mr-1" />
          Denegado
        </span>
      );
    }
    
    // Si está en proceso de verificación, mostrar estado de verificando
    if (isApproving[software.id]) {
      return (
        <span className="inline-flex items-center text-blue-600">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Verificando...
        </span>
      );
    }
    
    // Para software pendiente que aún no está siendo procesado, mostrar estado pendiente
    return (
      <span className="inline-flex items-center text-yellow-600">
        <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Pendiente
      </span>
    );
  };

  const handleDelete = async (softwareId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este software?')) {
      return;
    }

    setIsDeleting(prev => ({ ...prev, [softwareId]: true }));
    setDeleteMessages(prev => ({ ...prev, [softwareId]: { status: 'success', message: '' } }));

    try {
      await axios.delete(`/api/software/${softwareId}`);
      setSoftwareList(prev => prev.filter(sw => sw.id !== softwareId));
      setDeleteMessages(prev => ({ 
        ...prev, 
        [softwareId]: { 
          status: 'success', 
          message: 'Software eliminado correctamente' 
        } 
      }));
    } catch (error) {
      console.error('Error deleting software:', error);
      setDeleteMessages(prev => ({ 
        ...prev, 
        [softwareId]: { 
          status: 'error', 
          message: 'Error al eliminar el software' 
        } 
      }));
    } finally {
      setIsDeleting(prev => ({ ...prev, [softwareId]: false }));
    }
  };

  // Función para cargar los usuarios que tienen instalado un software
  const fetchSoftwareUsers = async (softwareName: string) => {
    // Si ya tenemos usuarios para este software, no es necesario cargarlos de nuevo
    if (softwareUsers[softwareName]) {
      return;
    }
    
    setLoadingUsers(prev => ({ ...prev, [softwareName]: true }));
    
    try {
      const response = await axios.get('/api/software/users', {
        params: { softwareName }
      });
      
      setSoftwareUsers(prev => ({
        ...prev,
        [softwareName]: response.data
      }));
    } catch (error) {
      console.error(`Error loading users for ${softwareName}:`, error);
    } finally {
      setLoadingUsers(prev => ({ ...prev, [softwareName]: false }));
    }
  };

  // Función para obtener la abreviatura del nombre de usuario (iniciales)
  const getUserInitials = (name: string): string => {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };
  
  // Función para generar un color basado en el nombre del usuario
  const getUserColor = (userId: string): string => {
    // Usar el mismo color azul para todos los avatares
    return 'bg-blue-500';
  };

  if (isLoading || isTeamLoading) {
    return <Loading />;
  }

  if (isTeamError) {
    return <div className="text-red-600">Error loading team information</div>;
  }

  return (
    <>
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Software Database</h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Software List</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              A complete list of all software used in your organization.
              {isCheckingForUpdates && (
                <span className="ml-2 inline-flex items-center text-blue-600">
                  <ArrowPathIcon className="h-3 w-3 animate-spin mr-1" />
                  Checking for updates...
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                name="search"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-64 pl-10 py-2.5 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Search software..."
              />
            </div>
            
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isCheckingForUpdates}
              className="inline-flex items-center px-3 py-2.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
              title="Check for new software"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isCheckingForUpdates ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              type="button"
              onClick={handleAddSoftware}
              className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add New Software
            </button>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Version
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Instalaciones
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Acciones
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSoftwareList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm ? "No software matches your search. Try a different term." : "No software found. Add your first software application."}
                  </td>
                </tr>
              ) : (
                filteredSoftwareList.map((software) => (
                  <React.Fragment key={software.id}>
                    <tr 
                      className={`${isExpanded(software.id) ? 'bg-blue-50 dark:bg-gray-700' : ''} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                      onClick={() => toggleExpand(software.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="mr-2">
                            {isExpanded(software.id) 
                              ? <ChevronDownIcon className="h-4 w-4 text-gray-500" /> 
                              : <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                            }
                          </div>
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-500 font-medium">{software.softwareName.charAt(0)}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{software.softwareName}</div>
                         
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{software.version}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-medium">
                          {getInstallationCount(software.softwareName, software.version)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <ApprovalButton software={software} />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(software.id);
                            }}
                            disabled={isDeleting[software.id]}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSoftware(software);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Lista de usuarios con este software cuando está expandido */}
                    {isExpanded(software.id) && (
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="pl-16 space-y-4">
                            {/* Información de la IA */}
                            <div>
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                🤖 Análisis de IA:
                              </div>
                              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                  {getAIAnalysis(software.notes)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Lista de usuarios */}
                            <div>
                              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                👥 Users with {software.softwareName} installed:
                              </div>
                              
                              {loadingUsers[software.softwareName] ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400">Loading users...</p>
                              ) : softwareUsers[software.softwareName] && softwareUsers[software.softwareName].length > 0 ? (
                                <div className="flex flex-wrap gap-3">
                                  {softwareUsers[software.softwareName].map(user => (
                                    <div key={user.id} className="flex items-center">
                                      <div className="flex-shrink-0 h-8 w-8 bg-blue-500 text-white rounded-full flex items-center justify-center border border-blue-300 shadow">
                                        {getUserInitials(user.name)}
                                      </div>
                                      <div className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                        {user.name}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No users found with this software.</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de edición */}
      {isEditing && editingSoftware && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Edit Software
              </h3>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Software Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Software Name
                    </label>
                    <input
                      type="text"
                      value={editingSoftware.softwareName || ''}
                      onChange={(e) => handleInputChange('softwareName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  {/* Version */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Version
                    </label>
                    <input
                      type="text"
                      value={editingSoftware.version || ''}
                      onChange={(e) => handleInputChange('version', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  {/* Vendor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Vendor
                    </label>
                    <input
                      type="text"
                      value={editingSoftware.vendor || ''}
                      onChange={(e) => handleInputChange('vendor', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  {/* Install Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Install Method
                    </label>
                    <select
                      value={editingSoftware.installMethod || 'Manual'}
                      onChange={(e) => handleInputChange('installMethod', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="Manual">Manual</option>
                      <option value="Software Center">Software Center</option>
                      <option value="MSI Package">MSI Package</option>
                      <option value="Script">Script</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Detected By */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Detected By
                    </label>
                    <select
                      value={editingSoftware.detectedBy || 'User'}
                      onChange={(e) => handleInputChange('detectedBy', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="User">User</option>
                      <option value="agent">Agent</option>
                      <option value="scan">Scan</option>
                      <option value="macos_agent">macOS Agent</option>
                    </select>
                  </div>

                  {/* Digital Signature */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Digital Signature
                    </label>
                    <select
                      value={editingSoftware.digitalSignature || ''}
                      onChange={(e) => handleInputChange('digitalSignature', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select...</option>
                      <option value="Valid">Valid</option>
                      <option value="Invalid">Invalid</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                </div>

                {/* Install Path */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Install Path
                  </label>
                  <input
                    type="text"
                    value={editingSoftware.installPath || ''}
                    onChange={(e) => handleInputChange('installPath', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                {/* SHA256 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    SHA256
                  </label>
                  <input
                    type="text"
                    value={editingSoftware.sha256 || ''}
                    onChange={(e) => handleInputChange('sha256', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="SHA256 hash (optional)"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={editingSoftware.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Is Approved */}
                <div>
                  <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={editingSoftware.isApproved || false}
                        onChange={(e) => handleInputChange('isApproved', e.target.checked)}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label className="font-medium text-gray-700 dark:text-gray-300">
                        Software Approved
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        Mark this software as approved for use in your organization
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCloseModal}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSoftware}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

SoftwareDatabase.getLayout = (page) => <AccountLayout>{page}</AccountLayout>;

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default SoftwareDatabase; 