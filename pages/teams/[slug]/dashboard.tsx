import { AccountLayout } from '@/components/layouts';
import { Loading } from '@/components/shared';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { useTranslation } from 'next-i18next';
import { ArrowSmallUpIcon, ArrowSmallDownIcon, UserIcon, DocumentCheckIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import fetcher from '@/lib/fetcher';
import useSWR from 'swr';
import axios from 'axios';

type DashboardStats = {
  totalSoftware: number;
  totalEmployees: number;
  softwareApprovedThisMonth: number;
  companyRisk: {
    level: 'Low' | 'Medium' | 'High';
    percentage: number;
  };
  malwareBlocked: number;
  employeesHoursSaved: {
    hours: number;
    savings: number;
  };
  recentActivity: {
    type: string;
    title: string;
    timestamp: string;
    description: string;
  }[];
};

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

const Dashboard: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [cveNotifications, setCveNotifications] = useState<CVENotification[]>([]);
  const [isLoadingCVEs, setIsLoadingCVEs] = useState(true);
  
  // Get dashboard statistics using SWR
  const { data: stats, error, isLoading } = useSWR<DashboardStats>(
    '/api/dashboard/stats',
    fetcher
  );

  // Cargar datos de CVE cuando se carga la página
  useEffect(() => {
    const fetchCVENotifications = async () => {
      setIsLoadingCVEs(true);
      try {
        // Aquí normalmente llamaríamos a un endpoint real
        // Por ahora, simulamos datos para la demo
        // await axios.get('/api/vulnerabilities')
        
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
          }
        ];
        
        // Simular un retraso para mostrar el estado de carga
        setTimeout(() => {
          setCveNotifications(mockCVEs);
          setIsLoadingCVEs(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching CVE notifications:', error);
        setIsLoadingCVEs(false);
      }
    };
    
    fetchCVENotifications();
  }, []);

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

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        return 'a few minutes ago';
      }
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US');
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <div>Error loading dashboard data</div>;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Softwares */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="text-gray-500 dark:text-gray-400 text-sm">Total Softwares</div>
            <div className="mt-1 flex items-baseline">
              <div className="text-4xl font-semibold text-blue-500">{stats?.totalSoftware || 156}</div>
            </div>
            <div className="mt-2">
              <span className="text-green-500 font-medium flex items-center">
                <ArrowSmallUpIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                10% since last month
              </span>
            </div>
          </div>
        </div>

        {/* Total Number of Employees */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="text-gray-500 dark:text-gray-400 text-sm">Total Number of Employees</div>
            <div className="mt-1 flex items-baseline">
              <div className="text-4xl font-semibold text-blue-500">{stats?.totalEmployees || 82}</div>
            </div>
            <div className="mt-2">
              <span className="text-gray-500 font-medium flex items-center">
                — Stable since last month
              </span>
            </div>
          </div>
        </div>

        {/* Company Risk */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="text-gray-500 dark:text-gray-400 text-sm">Company Risk</div>
            <div className="mt-1 flex items-baseline">
              <div className="text-4xl font-semibold text-green-500">{stats?.companyRisk?.level || 'Low'}</div>
            </div>
            <div className="mt-2">
              <span className="text-gray-500 font-medium flex items-center">
                Current risk: {stats?.companyRisk?.percentage || 20}%
              </span>
            </div>
          </div>
        </div>

        {/* Total malware blocked */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="text-gray-500 dark:text-gray-400 text-sm">Total malware blocked</div>
            <div className="mt-1 flex items-baseline">
              <div className="text-4xl font-semibold text-red-500">{stats?.malwareBlocked || 6}</div>
            </div>
            <div className="mt-2">
              <span className="text-gray-500 font-medium flex items-center">
                Number of malicious apps blocked
              </span>
            </div>
          </div>
        </div>

        {/* Employees Hours Saved */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="text-gray-500 dark:text-gray-400 text-sm">Employees Hours Saved</div>
            <div className="mt-1 flex items-baseline">
              <div className="text-4xl font-semibold text-green-500">{stats?.employeesHoursSaved?.hours || 42} Hours</div>
            </div>
            <div className="mt-2">
              <span className="text-gray-500 font-medium flex items-center">
                An average of: ~{stats?.employeesHoursSaved?.savings || 700}€ this month
              </span>
            </div>
          </div>
        </div>

        {/* Software approved this month */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="text-gray-500 dark:text-gray-400 text-sm">Software approved this month</div>
            <div className="mt-1 flex items-baseline">
              <div className="text-4xl font-semibold text-green-500">{stats?.softwareApprovedThisMonth || 18}</div>
            </div>
            <div className="mt-2">
              <span className="text-green-500 font-medium flex items-center">
                <ArrowSmallUpIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                25% since last month
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Vulnerabilities (CVEs) */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white flex items-center">
                <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Security Vulnerabilities (CVEs)
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsLoadingCVEs(true);
                  setTimeout(() => setIsLoadingCVEs(false), 1000);
                }}
                disabled={isLoadingCVEs}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isLoadingCVEs ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Scanning...
                  </>
                ) : (
                  <>
                    <svg className="-ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Scan for Vulnerabilities
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="px-6 py-5">
            {isLoadingCVEs ? (
              <div className="animate-pulse h-32 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">Scanning for vulnerabilities...</p>
              </div>
            ) : cveNotifications.length > 0 ? (
              <div className="space-y-4">
                {/* Resumen de vulnerabilidades */}
                <div className="flex flex-wrap gap-4 mb-6">
                  {['critical', 'high', 'medium', 'low'].map((severity) => {
                    const count = cveNotifications.filter(cve => cve.severity === severity).length;
                    return (
                      <div key={severity} className="flex items-center px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                        <div className={`h-3 w-3 rounded-full mr-2 ${getSeverityColor(severity)}`}></div>
                        <span className="font-medium capitalize">{severity}:</span>
                        <span className="ml-2 font-bold">{count}</span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Lista de vulnerabilidades */}
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {cveNotifications.map((cve) => (
                    <li key={cve.id} className="py-4">
                      <div className="flex flex-col sm:flex-row sm:items-start">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(cve.severity)}`}>
                              {cve.severity.toUpperCase()}
                            </span>
                            <h4 className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                              {cve.cveId}
                            </h4>
                            <time className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(cve.publishedDate)}
                            </time>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              <span className="font-medium">{cve.software} {cve.version}</span> - {cve.description}
                            </p>
                          </div>
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Affected systems: <span className="font-semibold">{cve.affectedSystems}</span>
                          </div>
                        </div>
                        <div className="mt-2 sm:mt-0 sm:ml-4">
                          <button
                            type="button"
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-10">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No vulnerabilities found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  All software in your inventory is currently up to date.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Activity Summary</h2>
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity, index) => (
                <li key={index} className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-gray-200 rounded-full p-2">
                      <span className="text-xl">
                        {activity.type === 'software' ? '⬆️' : '🔄'}
                      </span>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{getRelativeTime(activity.timestamp)}</p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{activity.description}</p>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-6 py-4 text-center text-gray-500">No recent activity</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

Dashboard.getLayout = (page) => <AccountLayout>{page}</AccountLayout>;

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default Dashboard; 