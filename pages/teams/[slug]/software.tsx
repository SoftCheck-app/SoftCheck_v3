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
import { MagnifyingGlassIcon, ChevronDownIcon, ChevronRightIcon, CheckCircleIcon, XCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

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

const SoftwareDatabase: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { slug } = router.query;
  
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

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      
      try {
        setIsLoading(true);
        
        // Obtener lista de software
        const softwareResponse = await axios.get('/api/software');
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

    fetchData();
  }, [slug]);

  const handleAddSoftware = () => {
    router.push(`/teams/${slug}/software/new`);
  };

  // Filtrar software según el término de búsqueda
  const filteredSoftwareList = useMemo(() => {
    return softwareList.filter(software => 
      software.softwareName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      software.version.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [softwareList, searchTerm]);

  // Agrupar software por nombre
  const groupedSoftware = useMemo(() => {
    // Crear un objeto para agrupar
    const groups: Record<string, ExtendedSoftware[]> = {};
    
    // Agrupar por nombre
    filteredSoftwareList.forEach(software => {
      const name = software.softwareName;
      if (!groups[name]) {
        groups[name] = [];
      }
      groups[name].push(software);
    });
    
    // Convertir a array y ordenar las versiones
    return Object.entries(groups).map(([name, versions]) => {
      // Ordenar versiones (la más reciente primero)
      const sortedVersions = [...versions].sort((a, b) => {
        return new Date(b.installDate).getTime() - new Date(a.installDate).getTime();
      });
      
      return {
        name,
        versions: sortedVersions,
        latestVersion: sortedVersions[0] // La primera es la más reciente
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredSoftwareList]);

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

  // Función para alternar la expansión de un software
  const toggleExpand = (softwareName: string) => {
    setExpandedSoftware(prev => {
      if (prev.includes(softwareName)) {
        return prev.filter(name => name !== softwareName);
      } else {
        return [...prev, softwareName];
      }
    });
  };

  // Comprobar si un software está expandido
  const isExpanded = (softwareName: string) => {
    return expandedSoftware.includes(softwareName);
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
          message: `${softwareName} - ${response.data.status === 'approved' ? 'Aprobado' : 'Denegado'}: ${response.data.reason || response.data.message}` 
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

  // Componente para el botón de aprobación
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
    
    return (
      <>
        <button
          type="button"
          disabled={isApproving[software.id]}
          onClick={(e) => {
            e.stopPropagation();
            handleApprove(software.id, software.softwareName);
          }}
          className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${
            isApproving[software.id] 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {isApproving[software.id] ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verificando...
            </>
          ) : (
            <>Verificar</>
          )}
        </button>
        
        {approvalMessages[software.id] && (
          <div className={`mt-1 text-xs ${
            approvalMessages[software.id].status === 'success' 
              ? 'text-green-600' 
              : 'text-red-600'
          }`}>
            {approvalMessages[software.id].message}
          </div>
        )}
      </>
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

  if (isLoading) {
    return <Loading />;
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
              {groupedSoftware.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {searchTerm ? "No software matches your search. Try a different term." : "No software found. Add your first software application."}
                  </td>
                </tr>
              ) : (
                groupedSoftware.map((group) => (
                  <React.Fragment key={group.name}>
                    {/* Fila principal con la versión más reciente */}
                    <tr 
                      className={`${isExpanded(group.name) ? 'bg-blue-50 dark:bg-gray-700' : ''} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                      onClick={() => toggleExpand(group.name)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="mr-2">
                            {isExpanded(group.name) 
                              ? <ChevronDownIcon className="h-4 w-4 text-gray-500" /> 
                              : <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                            }
                          </div>
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-500 font-medium">{group.name.charAt(0)}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{group.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {group.versions.length} {group.versions.length === 1 ? 'version' : 'versions'} available
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{group.latestVersion.version}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-medium">
                          {installationCounts.length === 0 ? (
                            <span className="text-gray-400">--</span>
                          ) : (
                            getInstallationCount(group.latestVersion.softwareName, group.latestVersion.version)
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ApprovalButton software={group.latestVersion} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(group.latestVersion.id);
                            }}
                            disabled={isDeleting[group.latestVersion.id]}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                          <a 
                            href={`/teams/${slug}/software/${group.latestVersion.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Edit
                          </a>
                        </div>
                        {deleteMessages[group.latestVersion.id] && (
                          <div className={`mt-1 text-xs ${
                            deleteMessages[group.latestVersion.id].status === 'success' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {deleteMessages[group.latestVersion.id].message}
                          </div>
                        )}
                      </td>
                    </tr>
                    
                    {/* Filas expandidas con todas las versiones */}
                    {isExpanded(group.name) && group.versions.slice(1).map((software) => (
                      <tr key={software.id} className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                        <td className="px-6 py-3 whitespace-nowrap pl-16">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{software.softwareName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-700 dark:text-gray-300">{software.version}</div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {installationCounts.length === 0 ? (
                              <span className="text-gray-400">--</span>
                            ) : (
                              getInstallationCount(software.softwareName, software.version)
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <ApprovalButton software={software} />
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleDelete(software.id)}
                              disabled={isDeleting[software.id]}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                            <a 
                              href={`/teams/${slug}/software/${software.id}`}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              Edit
                            </a>
                          </div>
                          {deleteMessages[software.id] && (
                            <div className={`mt-1 text-xs ${
                              deleteMessages[software.id].status === 'success' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {deleteMessages[software.id].message}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
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