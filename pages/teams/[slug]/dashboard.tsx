import { AccountLayout } from '@/components/layouts';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { useTranslation } from 'next-i18next';
import { ArrowSmallUpIcon, ArrowSmallDownIcon, UserIcon, CurrencyEuroIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

const Dashboard: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  const router = useRouter();

  return (
    <>
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Software */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="text-gray-500 dark:text-gray-400 text-sm">Total Software</div>
            <div className="mt-1 flex items-baseline">
              <div className="text-4xl font-semibold text-gray-900 dark:text-white">156</div>
            </div>
            <div className="mt-2">
              <span className="text-green-500 font-medium flex items-center">
                <ArrowSmallUpIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                10% since last month
              </span>
            </div>
          </div>
        </div>

        {/* Active Licenses */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="text-gray-500 dark:text-gray-400 text-sm">Active Licenses</div>
            <div className="mt-1 flex items-baseline">
              <div className="text-4xl font-semibold text-yellow-500">82</div>
            </div>
            <div className="mt-2">
              <span className="text-gray-500 font-medium flex items-center">
                — Stable since last month
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Cost */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="text-gray-500 dark:text-gray-400 text-sm">Monthly Cost</div>
            <div className="mt-1 flex items-baseline">
              <div className="text-4xl font-semibold text-green-500">€14.5k</div>
            </div>
            <div className="mt-2">
              <span className="text-red-500 font-medium flex items-center">
                <ArrowSmallDownIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
                5% since last month
              </span>
            </div>
          </div>
        </div>

        {/* Average Cost per Employee */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="flex justify-between items-center">
              <div className="text-gray-500 dark:text-gray-400 text-sm">Average Cost per Employee</div>
              <CurrencyEuroIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-1 flex items-baseline">
              <div className="text-4xl font-semibold text-blue-500">€42.30</div>
            </div>
            <div className="mt-1 text-xs text-gray-500">Per employee / month</div>
            <div className="mt-2">
              <span className="text-blue-500 font-medium flex items-center">
                <ArrowSmallUpIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                8% since last month
              </span>
            </div>
          </div>
        </div>

        {/* Total Number of Employees */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg shadow">
          <div className="p-5">
            <div className="flex justify-between items-center">
              <div className="text-gray-500 dark:text-gray-400 text-sm">Total Number of Employees</div>
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="mt-1 flex items-baseline">
              <div className="text-4xl font-semibold text-purple-500">342</div>
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
              <div className="text-4xl font-semibold text-green-500">18</div>
            </div>
            <div className="mt-1 text-xs text-gray-500">New softwares</div>
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
            <li className="px-6 py-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-200 rounded-full p-2">
                  <span className="text-xl">💡</span>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">New license added</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">2 hours ago</p>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Figma Pro - Sofia Muñoz</p>
                </div>
              </div>
            </li>
            <li className="px-6 py-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-200 rounded-full p-2">
                  <span className="text-xl">🔄</span>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Automatic renewal</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">1 day ago</p>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Adobe Creative Cloud - System</p>
                </div>
              </div>
            </li>
            <li className="px-6 py-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-200 rounded-full p-2">
                  <span className="text-xl">⬆️</span>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Software updated</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">3 days ago</p>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Obsidian - Admin</p>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </>
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