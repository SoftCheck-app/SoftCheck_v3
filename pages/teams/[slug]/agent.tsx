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

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const Agent: NextPageWithLayout<AgentPageProps> = ({ teamFeatures }) => {
  const { t } = useTranslation('common');
  const { isLoading, isError, team } = useTeam();
  const [agentStatus, setAgentStatus] = useState<AgentStatusData | null>(null);
  const [localAgentStatus, setLocalAgentStatus] = useState<AgentStatusData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  
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