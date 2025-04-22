import { AccountLayout } from '@/components/layouts';
import { Error, Loading } from '@/components/shared';
import { ControlCard, PendingLicenseItem } from '@/components/license';
import useTeam from 'hooks/useTeam';
import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { NextPageWithLayout } from 'types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ArrowSmallDownIcon,
} from '@heroicons/react/24/outline';

interface License {
  id: string;
  software: string;
  planType: string;
  requestedBy: string;
  date: string;
  price: number;
  status: 'active' | 'pending' | 'expired';
  renewalDate?: string;
  assignedTo?: string;
}

interface LicenseStats {
  activeLicenses: number;
  nextRenewal: number;
  scheduledCancellation: number;
  totalMonthlyCost: number;
}

const LicenseDatabase: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { slug } = router.query;
  const { isLoading: isTeamLoading, isError, team } = useTeam();
  const [searchTerm, setSearchTerm] = useState('');

  // Usar SWR para obtener datos de licencias
  const { data: licenseData, error: licenseError, isLoading: isLicenseLoading } = useSWR<{
    stats: LicenseStats;
    licenses: License[];
  }>('/api/licenses', fetcher);

  const isLoading = isTeamLoading || isLicenseLoading;
  
  // Estado separado para licencias pendientes (serían filtradas desde el backend normalmente)
  const pendingLicenses = licenseData?.licenses.filter(license => license.status === 'pending') || [];
  
  // Estado separado para licencias activas
  const activeLicenses = licenseData?.licenses.filter(license => license.status === 'active') || [];
  
  // Licencias a renovar próximamente
  const upcomingRenewals = licenseData?.licenses
    .filter(license => license.status === 'active' && license.renewalDate)
    .sort((a, b) => {
      if (a.renewalDate && b.renewalDate) {
        return new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime();
      }
      return 0;
    })
    .slice(0, 5) || [];

  const handleApprove = async (id: string) => {
    try {
      await axios.patch(`/api/licenses/${id}`, { status: 'active' });
      // En producción, aquí se haría un mutate de SWR para actualizar los datos
    } catch (error) {
      console.error('Error approving license:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await axios.delete(`/api/licenses/${id}`);
      // En producción, aquí se haría un mutate de SWR para actualizar los datos
    } catch (error) {
      console.error('Error rejecting license:', error);
    }
  };
  
  const handleAddLicense = () => {
    router.push(`/teams/${slug}/licenses/new`);
  };

  // Función para formatear el costo mensual
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Búsqueda de licencias
  const filteredLicenses = activeLicenses.filter(license => 
    license.software.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="py-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">License Database</h1>
        <button
          onClick={handleAddLicense}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
        >
          Add New License
        </button>
      </div>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">License Control</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <ControlCard
              title="Active licenses"
              value={licenseData?.stats.activeLicenses || 0}
              icon={<CheckCircleIcon className="h-6 w-6" />}
              color="border-green-500"
            />
            <ControlCard
              title="Next renewal"
              value={licenseData?.stats.nextRenewal || 0}
              icon={<ClockIcon className="h-6 w-6" />}
              color="border-yellow-500"
            />
            <ControlCard
              title="Scheduled cancellation"
              value={licenseData?.stats.scheduledCancellation || 0}
              icon={<ExclamationTriangleIcon className="h-6 w-6" />}
              color="border-red-500"
            />
            <ControlCard
              title="Monthly cost"
              value={formatCurrency(licenseData?.stats.totalMonthlyCost || 0)}
              icon={<ArrowSmallDownIcon className="h-6 w-6" />}
              color="border-blue-500"
            />
          </div>
        </div>

        {pendingLicenses.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pending Approval</h2>
              <span className="text-yellow-500 text-sm font-medium">
                {pendingLicenses.length} pending requests
              </span>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
              {pendingLicenses.map((license) => (
                <PendingLicenseItem
                  key={license.id}
                  software={license.software}
                  planType={license.planType}
                  requestedBy={license.requestedBy}
                  date={license.date}
                  price={license.price}
                  onApprove={() => handleApprove(license.id)}
                  onReject={() => handleReject(license.id)}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Active Licenses</h2>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Search licenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Software
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Plan
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Renewal Date
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLicenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'No matching licenses found' : 'No active licenses'}
                    </td>
                  </tr>
                ) : (
                  filteredLicenses.map((license) => (
                    <tr key={license.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 dark:text-gray-300 font-medium">{license.software.charAt(0)}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{license.software}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
                          {license.planType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {license.assignedTo || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(license.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {license.renewalDate || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <a href={`/teams/${slug}/licenses/${license.id}`} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                          Edit
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upcoming renewals</h2>
            <button className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm">View all</button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
            {upcomingRenewals.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Software
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Plan
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Renewal Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {upcomingRenewals.map((license) => (
                    <tr key={license.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {license.software}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {license.planType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {license.renewalDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(license.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 mr-3">
                          Cancel
                        </button>
                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                          Renew
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4 min-h-[100px] flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">No upcoming renewals in the next 30 days</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

LicenseDatabase.getLayout = (page) => <AccountLayout>{page}</AccountLayout>;

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default LicenseDatabase; 