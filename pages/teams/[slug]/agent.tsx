import { Error, Loading } from '@/components/shared';
import { TeamTab } from '@/components/team';
import env from '@/lib/env';
import useTeam from 'hooks/useTeam';
import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { AccountLayout } from '@/components/layouts';
import type { NextPageWithLayout, TeamFeature } from 'types';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Switch } from '@headlessui/react';

interface AgentPageProps {
  teamFeatures: TeamFeature;
}

interface AgentStatusData {
  isActive: boolean;
  isActiveMode: boolean;
  autoUpdate: boolean;
  teamId: string;
  lastUpdated?: Date;
}

interface AgentStatsData {
  activeAgents: number;
  inactiveAgents: number;
  totalAgents: number;
  lastSyncDate?: Date;
  recentlyActivated?: number;
  recentlyDeactivated?: number;
  agentVersions?: { [key: string]: number };
  agentsNeedingAttention?: number;
}

// Interfaz para las vulnerabilidades
interface CVENotification {
  id: string;
  cveId: string;
  software: string;
  version: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  publishedDate: string;
  affectedSystems: number;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const Agent: NextPageWithLayout<AgentPageProps> = ({ teamFeatures }) => {
  const { t } = useTranslation('common');
  const { isLoading, isError, team } = useTeam();
  const [agentStatus, setAgentStatus] = useState<AgentStatusData | null>(null);
  const [localAgentStatus, setLocalAgentStatus] = useState<AgentStatusData | null>(null);
  const [agentStats, setAgentStats] = useState<AgentStatsData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);
  const [cveNotifications, setCveNotifications] = useState<CVENotification[]>([]);
  const [isLoadingCVEs, setIsLoadingCVEs] = useState(false);
  
  useEffect(() => {
    const fetchAgentStatus = async () => {
      if (team?.id) {
        try {
          const response = await axios.get(`/api/agents/status?teamId=${team.id}`, {
            withCredentials: true
          });
          setAgentStatus(response.data);
          setLocalAgentStatus(response.data);
        } catch (error) {
          console.error('Error fetching agent status:', error);
        }
      }
    };
    
    fetchAgentStatus();
  }, [team?.id]);
  
  useEffect(() => {
    const fetchAgentStats = async () => {
      if (team?.id) {
        try {
          const response = await axios.get(`/api/agents/stats?teamId=${team.id}`, {
            withCredentials: true
          });
          setAgentStats(response.data);
        } catch (error) {
          console.error('Error fetching agent statistics:', error);
        }
      }
    };
    
    // Ejecutar la primera vez
    fetchAgentStats();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchAgentStats, 30000);
    
    // Limpiar el intervalo cuando el componente se desmonte
    return () => clearInterval(interval);
  }, [team?.id]);
  
  // Actualiza el estado local sin enviar cambios al servidor
  const updateLocalStatus = (field: keyof AgentStatusData, value: boolean) => {
    if (!localAgentStatus) return;
    
    setLocalAgentStatus({
      ...localAgentStatus,
      [field]: value
    });
    setHasChanges(true);
  };
  
  // Guarda todos los cambios en el servidor
  const saveChanges = async () => {
    if (!team?.id || !localAgentStatus || !hasChanges) return;
    
    setIsUpdating(true);
    try {
      const response = await axios.post(`/api/agents/status?teamId=${team.id}`, {
        isActive: localAgentStatus.isActive,
        isActiveMode: localAgentStatus.isActiveMode,
        autoUpdate: localAgentStatus.autoUpdate
      }, {
        withCredentials: true
      });
      
      setAgentStatus(response.data);
      setHasChanges(false);
      
      // Mostrar el popup de éxito
      setShowSavedPopup(true);
      
      // Ocultar el popup después de 3 segundos
      setTimeout(() => {
        setShowSavedPopup(false);
      }, 3000);
    } catch (error) {
      console.error('Error updating agent settings:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Función para actualizar solo las estadísticas
  const refreshAgentStats = async () => {
    if (!team?.id) return;
    
    setIsRefreshingStats(true);
    try {
      // Llamada a la API para verificar actividad (opcional)
      const apiKey = await getApiKey();
      if (apiKey) {
        await axios.get('/api/agents/check-activity', {
          headers: {
            'X-API-KEY': apiKey
          }
        });
      }
      
      // Obtener estadísticas actualizadas
      const response = await axios.get(`/api/agents/stats?teamId=${team.id}`, {
        withCredentials: true
      });
      setAgentStats(response.data);
      
      // Nota: Eliminamos la activación del popup de "Changes saved"
    } catch (error) {
      console.error('Error refreshing agent statistics:', error);
    } finally {
      setIsRefreshingStats(false);
    }
  };
  
  // Función auxiliar para obtener la API key (si está disponible)
  const getApiKey = async (): Promise<string | null> => {
    try {
      const keyResponse = await axios.get(`/api/teams/${team?.slug}/api-keys`, {
        withCredentials: true
      });
      if (keyResponse.data && keyResponse.data.length > 0) {
        return keyResponse.data[0].key || null;
      }
    } catch (error) {
      console.error('Error getting API key:', error);
    }
    return null;
  };

  // Función para obtener las notificaciones de CVE
  useEffect(() => {
    const fetchCVENotifications = async () => {
      if (!team?.id) return;
      
      setIsLoadingCVEs(true);
      try {
        // Aquí normalmente llamaríamos a un endpoint real
        // Por ahora, simulamos datos para la demo
        // await axios.get(`/api/vulnerabilities?teamId=${team.id}`)
        
        // Datos simulados para la demo
        const mockCVEs: CVENotification[] = [
          {
            id: '1',
            cveId: 'CVE-2023-45689',
            software: 'Apache Log4j',
            version: '2.14.1',
            severity: 'critical',
            description: 'Remote code execution vulnerability in Apache Log4j',
            publishedDate: '2023-11-10T12:00:00Z',
            affectedSystems: 12
          },
          {
            id: '2',
            cveId: 'CVE-2023-38432',
            software: 'OpenSSL',
            version: '1.1.1t',
            severity: 'high',
            description: 'Buffer overflow in OpenSSL allowing potential arbitrary code execution',
            publishedDate: '2023-10-05T10:30:00Z',
            affectedSystems: 8
          },
          {
            id: '3',
            cveId: 'CVE-2023-29491',
            software: 'Microsoft Office',
            version: '2019',
            severity: 'medium',
            description: 'Information disclosure vulnerability in Microsoft Office',
            publishedDate: '2023-09-18T15:45:00Z',
            affectedSystems: 24
          },
          {
            id: '4',
            cveId: 'CVE-2023-51892',
            software: 'Chrome',
            version: '116.0.5845.110',
            severity: 'high',
            description: 'Use-after-free vulnerability in Chrome browser',
            publishedDate: '2023-11-02T09:15:00Z',
            affectedSystems: 17
          }
        ];
        
        setCveNotifications(mockCVEs);
      } catch (error) {
        console.error('Error fetching CVE notifications:', error);
      } finally {
        setIsLoadingCVEs(false);
      }
    };
    
    fetchCVENotifications();
  }, [team?.id]);

  // Función para obtener el color según la severidad
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    }).format(date);
  };

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <Error message={isError.message} />;
  }

  if (!team) {
    return <Error message={t('team-not-found')} />;
  }

  return (
    <>
      <TeamTab activeTab="agent" team={team} teamFeatures={teamFeatures} />
      
      {/* Popup de éxito */}
      {showSavedPopup && (
        <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md z-50 flex items-center">
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Changes saved!</span>
        </div>
      )}
      
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            SoftCheck Agent Management
          </h3>
          <div className="mt-5 border-t border-gray-200 dark:border-gray-700 pt-5">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              {/* Status Toggle */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center space-x-3">
                  {localAgentStatus ? (
                    <>
                      <span className={classNames(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        localAgentStatus.isActive 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      )}>
                        {localAgentStatus.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <Switch
                        checked={localAgentStatus.isActive}
                        onChange={(value) => updateLocalStatus('isActive', value)}
                        disabled={isUpdating}
                        className={classNames(
                          localAgentStatus.isActive ? 'bg-indigo-600' : 'bg-gray-200',
                          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                        )}
                      >
                        <span className="sr-only">Toggle agent status</span>
                        <span
                          aria-hidden="true"
                          className={classNames(
                            localAgentStatus.isActive ? 'translate-x-5' : 'translate-x-0',
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                          )}
                        />
                      </Switch>
                    </>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Loading...
                    </span>
                  )}
                </dd>
              </div>

              {/* Mode Toggle */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Mode</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center space-x-3">
                  {localAgentStatus ? (
                    <>
                      <span className={classNames(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        localAgentStatus.isActiveMode 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-yellow-100 text-yellow-800"
                      )}>
                        {localAgentStatus.isActiveMode ? 'Active' : 'Passive'}
                      </span>
                      <Switch
                        checked={localAgentStatus.isActiveMode}
                        onChange={(value) => updateLocalStatus('isActiveMode', value)}
                        disabled={isUpdating}
                        className={classNames(
                          localAgentStatus.isActiveMode ? 'bg-indigo-600' : 'bg-gray-200',
                          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                        )}
                      >
                        <span className="sr-only">Toggle agent mode</span>
                        <span
                          aria-hidden="true"
                          className={classNames(
                            localAgentStatus.isActiveMode ? 'translate-x-5' : 'translate-x-0',
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                          )}
                        />
                      </Switch>
                    </>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Loading...
                    </span>
                  )}
                </dd>
              </div>

              {/* Auto Update Toggle */}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Auto Update</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center space-x-3">
                  {localAgentStatus ? (
                    <>
                      <span className={classNames(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        localAgentStatus.autoUpdate 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      )}>
                        {localAgentStatus.autoUpdate ? 'Enabled' : 'Disabled'}
                      </span>
                      <Switch
                        checked={localAgentStatus.autoUpdate}
                        onChange={(value) => updateLocalStatus('autoUpdate', value)}
                        disabled={isUpdating}
                        className={classNames(
                          localAgentStatus.autoUpdate ? 'bg-indigo-600' : 'bg-gray-200',
                          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                        )}
                      >
                        <span className="sr-only">Toggle auto update</span>
                        <span
                          aria-hidden="true"
                          className={classNames(
                            localAgentStatus.autoUpdate ? 'translate-x-5' : 'translate-x-0',
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                          )}
                        />
                      </Switch>
                    </>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Loading...
                    </span>
                  )}
                </dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Update</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {agentStatus?.lastUpdated 
                    ? new Date(agentStatus.lastUpdated).toLocaleString() 
                    : new Date().toLocaleString()}
                </dd>
              </div>
              
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  The SoftCheck Agent automatically collects software inventory from endpoints and helps 
                  maintain license compliance across your organization.
                </dd>
              </div>
            </dl>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={saveChanges}
              disabled={isUpdating || !hasChanges}
              className={classNames(
                "ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white",
                hasChanges ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-400 cursor-not-allowed",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              )}
            >
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
        
        {/* Nueva sección de estadísticas */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Agent Statistics
            </h3>
            <button
              type="button"
              onClick={refreshAgentStats}
              disabled={isRefreshingStats}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isRefreshingStats ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Stats
                </>
              )}
            </button>
          </div>
          <div className="mt-5 border-t border-gray-200 dark:border-gray-700 pt-5">
            {agentStats ? (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-3">
                {/* Total Agents */}
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Agents</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
                    {agentStats.totalAgents}
                  </dd>
                </div>
                
                {/* Active Agents */}
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Agents</dt>
                  <dd className="mt-1 flex items-baseline">
                    <div className="flex items-center">
                      <span className="text-3xl font-semibold text-green-600 dark:text-green-400">
                        {agentStats.activeAgents}
                      </span>
                      {agentStats.totalAgents > 0 && (
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          ({Math.round((agentStats.activeAgents / agentStats.totalAgents) * 100)}%)
                        </span>
                      )}
                    </div>
                  </dd>
                  <div className="mt-1 text-xs text-gray-500">
                    Activos en el último minuto
                  </div>
                </div>
                
                {/* Inactive Agents */}
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Inactive Agents</dt>
                  <dd className="mt-1 flex items-baseline">
                    <div className="flex items-center">
                      <span className="text-3xl font-semibold text-red-600 dark:text-red-400">
                        {agentStats.inactiveAgents}
                      </span>
                      {agentStats.totalAgents > 0 && (
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                          ({Math.round((agentStats.inactiveAgents / agentStats.totalAgents) * 100)}%)
                        </span>
                      )}
                    </div>
                  </dd>
                  <div className="mt-1 text-xs text-gray-500">
                    Sin comunicación en el último minuto
                  </div>
                </div>

                {/* Progreso visual */}
                <div className="sm:col-span-3">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Agent Status Distribution</dt>
                  <dd className="mt-3">
                    <div className="flex overflow-hidden rounded-full bg-gray-200 h-5">
                      {agentStats.totalAgents > 0 ? (
                        <>
                          <div 
                            className="bg-green-500 h-full" 
                            style={{ width: `${(agentStats.activeAgents / agentStats.totalAgents) * 100}%` }}
                          ></div>
                          <div 
                            className="bg-red-500 h-full" 
                            style={{ width: `${(agentStats.inactiveAgents / agentStats.totalAgents) * 100}%` }}
                          ></div>
                        </>
                      ) : (
                        <div className="bg-gray-400 h-full w-full"></div>
                      )}
                    </div>
                    <div className="mt-2 flex justify-between text-sm">
                      <div className="flex items-center">
                        <span className="h-3 w-3 inline-block bg-green-500 rounded-full mr-2"></span>
                        <span className="text-gray-600 dark:text-gray-400">Active</span>
                      </div>
                      <div className="flex items-center">
                        <span className="h-3 w-3 inline-block bg-red-500 rounded-full mr-2"></span>
                        <span className="text-gray-600 dark:text-gray-400">Inactive</span>
                      </div>
                    </div>
                  </dd>
                </div>
                
                {/* Last sync date */}
                {agentStats.lastSyncDate && (
                  <div className="sm:col-span-3 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Agent Connection</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                      <span className="mr-2">
                        {new Date(agentStats.lastSyncDate).toLocaleString()}
                      </span>
                      {(() => {
                        // Calcular tiempo transcurrido desde el último ping
                        const lastSyncTime = new Date(agentStats.lastSyncDate).getTime();
                        const currentTime = new Date().getTime();
                        const diffInSeconds = Math.floor((currentTime - lastSyncTime) / 1000);
                        
                        // Si pasó más de un minuto, está inactivo
                        if (diffInSeconds > 60) {
                          return (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inactive for {Math.floor(diffInSeconds / 60)} min {diffInSeconds % 60} sec
                            </span>
                          );
                        } else {
                          return (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active ({diffInSeconds} seconds ago)
                            </span>
                          );
                        }
                      })()}
                    </dd>
                    <div className="mt-3 text-xs text-gray-500 flex items-center">
                      <svg className="h-4 w-4 text-gray-400 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Los agentes son marcados como inactivos si no se recibe ping en el último minuto
                    </div>
                  </div>
                )}
              </dl>
            ) : (
              <div className="animate-pulse h-32 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Loading agent statistics...</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Deployment
          </h3>
          <div className="mt-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Deploy the SoftCheck Agent to your endpoints using the installation script or package below.
            </p>
            
            <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-900 overflow-x-auto">
              <pre className="text-xs text-gray-800 dark:text-gray-200">
{`#!/bin/bash
# SoftCheck Agent Installation Script
curl -sSL https://softcheck.io/agent/install | sudo -E bash -`}
              </pre>
            </div>
            
            <div className="mt-4 flex space-x-4">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Download Windows Installer
              </button>
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Download macOS Package
              </button>
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Download Linux Package
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

Agent.getLayout = (page) => <AccountLayout>{page}</AccountLayout>;

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      teamFeatures: env.teamFeatures,
    },
  };
}

export default Agent; 