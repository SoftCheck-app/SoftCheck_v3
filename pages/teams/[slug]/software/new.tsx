import { AccountLayout } from '@/components/layouts';
import { Error, Loading } from '@/components/shared';
import useTeam from 'hooks/useTeam';
import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { NextPageWithLayout } from 'types';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { ArrowSmallLeftIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const NewSoftware: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  const { isLoading: isTeamLoading, isError, team } = useTeam();
  const router = useRouter();
  const { slug } = router.query;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    softwareName: '',
    version: '',
    vendor: '',
    installPath: '',
    installMethod: 'Manual',
    isApproved: false,
    detectedBy: 'User',
    digitalSignature: '',
    sha256: '',
    notes: ''
  });

  // Load employees for dropdown
  useEffect(() => {
    // No need to fetch employees or devices anymore
    const fetchData = async () => {
      if (!slug) return;
    };

    fetchData();
  }, [slug]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checkbox.checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.softwareName || !formData.version || !formData.vendor || !formData.installPath) {
      setError('Por favor, rellena todos los campos obligatorios.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Usar directamente el endpoint de registro sin autenticación
      const response = await axios.post('/api/software/register', formData);
      
      if (response.status === 201) {
        // Redirect to software page on success
        router.push(`/teams/${slug}/software`);
      } else {
        setError('Respuesta inesperada del servidor. Por favor, inténtalo de nuevo.');
      }
    } catch (err: any) {
      console.error('Error registrando software:', err);
      
      // Mostrar mensaje de error detallado
      const errorMessage = err.response?.data?.message || 'Error al registrar el software. Por favor, inténtalo de nuevo.';
      const errorDetails = err.response?.data?.error ? `: ${err.response.data.error}` : '';
      
      setError(`${errorMessage}${errorDetails}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isTeamLoading;

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
      <div className="py-6">
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ArrowSmallLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Register New Software</h1>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg p-6 max-w-3xl">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="softwareName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Software Name *
                  </label>
                  <input
                    type="text"
                    name="softwareName"
                    id="softwareName"
                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter software name"
                    value={formData.softwareName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="version" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Version *
                  </label>
                  <input
                    type="text"
                    name="version"
                    id="version"
                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="e.g., 1.0.0"
                    value={formData.version}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vendor/Publisher *
                </label>
                <input
                  type="text"
                  name="vendor"
                  id="vendor"
                  className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter software vendor"
                  value={formData.vendor}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label htmlFor="installPath" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Installation Path *
                </label>
                <input
                  type="text"
                  name="installPath"
                  id="installPath"
                  className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="e.g., C:/Program Files/Software"
                  value={formData.installPath}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="installMethod" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Installation Method
                  </label>
                  <div className="relative mt-1">
                    <select
                      name="installMethod"
                      id="installMethod"
                      className="block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none pr-10"
                      value={formData.installMethod}
                      onChange={handleChange}
                    >
                      <option value="Manual">Manual</option>
                      <option value="Software Center">Software Center</option>
                      <option value="MSI Package">MSI Package</option>
                      <option value="Script">Script</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="detectedBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Detected By
                  </label>
                  <div className="relative mt-1">
                    <select
                      name="detectedBy"
                      id="detectedBy"
                      className="block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none pr-10"
                      value={formData.detectedBy}
                      onChange={handleChange}
                    >
                      <option value="User">User</option>
                      <option value="Agent">Agent</option>
                      <option value="Admin">Admin</option>
                      <option value="Scan">Scan</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="digitalSignature" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Digital Signature
                  </label>
                  <input
                    type="text"
                    name="digitalSignature"
                    id="digitalSignature"
                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Digital signature information"
                    value={formData.digitalSignature}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="sha256" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    SHA256 Hash
                  </label>
                  <input
                    type="text"
                    name="sha256"
                    id="sha256"
                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="SHA256 hash of the executable"
                    value={formData.sha256}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <div className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="isApproved"
                      name="isApproved"
                      type="checkbox"
                      checked={formData.isApproved}
                      onChange={handleChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="isApproved" className="font-medium text-gray-700 dark:text-gray-300">
                      Pre-approve this software
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      Mark this software as approved for use in your organization
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Additional information about this software"
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>

              <div className="flex justify-end pt-5">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="mr-3 bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Register Software'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

NewSoftware.getLayout = (page) => <AccountLayout>{page}</AccountLayout>;

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
}

export default NewSoftware; 