import { AccountLayout } from '@/components/layouts';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { useTranslation } from 'next-i18next';

const Logs: NextPageWithLayout = () => {
  const { t } = useTranslation('common');

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="py-6">
        <div className="px-4 sm:px-6 md:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('team-logs')}</h1>
        </div>
      </div>
    </div>
  );
};

Logs.getLayout = (page) => <AccountLayout>{page}</AccountLayout>;

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default Logs; 