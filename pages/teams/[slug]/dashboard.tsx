import { AccountLayout } from '@/components/layouts';
import { Loading } from '@/components/shared';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { useTranslation } from 'next-i18next';
import { ArrowSmallUpIcon, ArrowSmallDownIcon, UserIcon, CurrencyEuroIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import fetcher from '@/lib/fetcher';
import useSWR from 'swr';

type DashboardStats = {
  totalSoftware: number;
  activeLicenses: number;
  monthlyCost: number;
  totalEmployees: number;
  costPerEmployee: number;
  softwareApprovedThisMonth: number;
  recentActivity: {
    type: string;
    title: string;
    timestamp: string;
    description: string;
  }[];
};

const Dashboard: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  
  // Obtener estadísticas del dashboard usando SWR
  const { data: stats, error, isLoading } = useSWR<DashboardStats>(
    '/api/dashboard/stats',
    fetcher
  );

  // Función para formatear dinero
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: amount >= 1000 ? 0 : 2,
      notation: amount >= 1000 ? 'compact' : 'standard',
    }).format(amount);
  };

  // Formatear fecha relativa
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        return 'hace unos minutos';
      }
      return `hace ${diffHours} horas`;
    } else if (diffDays === 1) {
      return 'ayer';
    } else if (diffDays < 7) {
      return `hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <div>Error cargando datos del dashboard</div>;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Software */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="text-gray-500 dark:text-gray-400 text-sm">Total Software</div>
            <div className="mt-1 flex items-baseline">
              <div className="text-4xl font-semibold text-gray-900 dark:text-white">{stats?.totalSoftware || 0}</div>
            </div>
            <div className="mt-2">
              <span className="text-green-500 font-medium flex items-center">
                <ArrowSmallUpIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                10% desde el mes pasado
              </span>
            </div>
          </div>
        </div>

        {/* Active Licenses */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="text-gray-500 dark:text-gray-400 text-sm">Licencias Activas</div>
            <div className="mt-1 flex items-baseline">
              <div className="text-4xl font-semibold text-yellow-500">{stats?.activeLicenses || 0}</div>
            </div>
            <div className="mt-2">
              <span className="text-gray-500 font-medium flex items-center">
                — Estable desde el mes pasado
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Cost */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="text-gray-500 dark:text-gray-400 text-sm">Costo Mensual</div>
            <div className="mt-1 flex items-baseline">
              <div className="text-4xl font-semibold text-green-500">{formatCurrency(stats?.monthlyCost || 0)}</div>
            </div>
            <div className="mt-2">
              <span className="text-red-500 font-medium flex items-center">
                <ArrowSmallDownIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                5% desde el mes pasado
              </span>
            </div>
          </div>
        </div>

        {/* Average Cost per Employee */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="flex justify-between items-center">
              <div className="text-gray-500 dark:text-gray-400 text-sm">Costo Promedio por Empleado</div>
              <CurrencyEuroIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-1 flex items-baseline">
              <div className="text-4xl font-semibold text-blue-500">{formatCurrency(stats?.costPerEmployee || 0)}</div>
            </div>
            <div className="mt-1 text-xs text-gray-500">Por empleado / mes</div>
            <div className="mt-2">
              <span className="text-blue-500 font-medium flex items-center">
                <ArrowSmallUpIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                8% desde el mes pasado
              </span>
            </div>
          </div>
        </div>

        {/* Total Number of Employees */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="flex justify-between items-center">
              <div className="text-gray-500 dark:text-gray-400 text-sm">Total de Empleados</div>
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-1 flex items-baseline">
              <div className="text-4xl font-semibold text-purple-500">{stats?.totalEmployees || 0}</div>
            </div>
            <div className="mt-1 text-xs text-gray-500">Empleados activos</div>
            <div className="mt-2">
              <span className="text-green-500 font-medium flex items-center">
                <ArrowSmallUpIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                3% desde el mes pasado
              </span>
            </div>
          </div>
        </div>

        {/* Software approved this month */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="flex justify-between items-center">
              <div className="text-gray-500 dark:text-gray-400 text-sm">Software aprobado este mes</div>
              <DocumentCheckIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-1 flex items-baseline">
              <div className="text-4xl font-semibold text-green-500">{stats?.softwareApprovedThisMonth || 0}</div>
            </div>
            <div className="mt-1 text-xs text-gray-500">Nuevos softwares</div>
            <div className="mt-2">
              <span className="text-green-500 font-medium flex items-center">
                <ArrowSmallUpIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                25% desde el mes pasado
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Resumen de Actividad Reciente</h2>
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity, index) => (
                <li key={index} className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-gray-200 rounded-full p-2">
                      <span className="text-xl">
                        {activity.type === 'license' ? '💡' : activity.type === 'software' ? '⬆️' : '🔄'}
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
              <li className="px-6 py-4 text-center text-gray-500">No hay actividad reciente</li>
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