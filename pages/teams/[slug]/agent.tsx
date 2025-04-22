import { Error, Loading } from '@/components/shared';
import { TeamTab } from '@/components/team';
import env from '@/lib/env';
import useTeam from 'hooks/useTeam';
import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { AccountLayout } from '@/components/layouts';
import type { NextPageWithLayout, TeamFeature } from 'types';

interface AgentPageProps {
  teamFeatures: TeamFeature;
}

const Agent: NextPageWithLayout<AgentPageProps> = ({ teamFeatures }) => {
  const { t } = useTranslation('common');
  const { isLoading, isError, team } = useTeam();

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
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            SoftCheck Agent Management
          </h3>
          <div className="mt-5 border-t border-gray-200 dark:border-gray-700 pt-5">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Update</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {new Date().toLocaleDateString()}
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
          
          <div className="mt-8">
            <h4 className="text-base font-medium text-gray-900 dark:text-white">Configuration</h4>
            <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
              <div>
                <label htmlFor="scanFrequency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Scan Frequency
                </label>
                <select
                  id="scanFrequency"
                  name="scanFrequency"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white text-gray-900 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                  defaultValue="daily"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="autoUpdate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Auto Update
                </label>
                <select
                  id="autoUpdate"
                  name="autoUpdate"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white text-gray-900 dark:bg-gray-600 dark:text-white dark:border-gray-500"
                  defaultValue="enabled"
                >
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
            >
              Reset
            </button>
            <button
              type="button"
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save
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