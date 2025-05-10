import { AccountLayout } from '@/components/layouts';
import { Loading } from '@/components/shared';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { useTranslation } from 'next-i18next';
import { ArrowSmallUpIcon, ArrowSmallDownIcon, UserIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import fetcher from '@/lib/fetcher';
import useSWR from 'swr';

type DashboardStats = {
  totalSoftware: number;
  totalEmployees: number;
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
  
  // Get dashboard statistics using SWR
  const { data: stats, error, isLoading } = useSWR<DashboardStats>(
    '/api/dashboard/stats',
    fetcher
  );

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
                10% since last month
              </span>
            </div>
          </div>
        </div>

        {/* Total Number of Employees */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="flex justify-between items-center">
              <div className="text-gray-500 dark:text-gray-400 text-sm">Total Employees</div>
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-1 flex items-baseline">
              <div className="text-4xl font-semibold text-purple-500">{stats?.totalEmployees || 0}</div>
            </div>
            <div className="mt-1 text-xs text-gray-500">Active employees</div>
            <div className="mt-2">
              <span className="text-green-500 font-medium flex items-center">
                <ArrowSmallUpIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                3% since last month
              </span>
            </div>
          </div>
        </div>

        {/* Software approved this month */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="flex justify-between items-center">
              <div className="text-gray-500 dark:text-gray-400 text-sm">Software approved this month</div>
              <DocumentCheckIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-1 flex items-baseline">
              <div className="text-4xl font-semibold text-green-500">{stats?.softwareApprovedThisMonth || 0}</div>
            </div>
            <div className="mt-1 text-xs text-gray-500">New software</div>
            <div className="mt-2">
              <span className="text-green-500 font-medium flex items-center">
                <ArrowSmallUpIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                25% since last month
              </span>
            </div>
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