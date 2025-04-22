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
import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import { ArrowSmallLeftIcon, ChevronDownIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

interface Employee {
  id: string;
  name: string;
  department: string;
}

interface License {
  id: string;
  software: string;
  planType: string;
  userId: string;
  assignedTo: string;
  activationDate: string;
  expirationDate: string;
  price: number;
  status: string;
}

const EditLicense: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  const { isLoading: isTeamLoading, isError: isTeamError, team } = useTeam();
  const router = useRouter();
  const { slug, id } = router.query;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch license data with SWR
  const { data: license, error: licenseError, isLoading: isLicenseLoading, mutate } = useSWR<License>(
    id ? `/api/licenses/${id}` : null,
    fetcher
  );

  // Form state
  const [formData, setFormData] = useState({
    softwareName: '',
    userId: '',
    price: '',
    activationDate: '',
    expirationDate: '',
    status: 'active'
  });

  // Update form data when license data is loaded
  useEffect(() => {
    if (license) {
      setFormData({
        softwareName: license.software,
        userId: license.userId,
        price: license.price.toString(),
        activationDate: new Date(license.activationDate).toISOString().split('T')[0],
        expirationDate: new Date(license.expirationDate).toISOString().split('T')[0],
        status: license.status
      });
    }
  }, [license]);

  // Load employees for dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!slug) return;
      
      try {
        setIsEmployeesLoading(true);
        const response = await axios.get('/api/employees');
        setEmployees(response.data);
      } catch (err) {
        console.error('Error fetching employees:', err);
        setError('Error loading employees. Please try again later.');
      } finally {
        setIsEmployeesLoading(false);
      }
    };

    fetchEmployees();
  }, [slug]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.softwareName || !formData.userId || !formData.price) {
      setError('Please fill in all required fields.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Convert price to number
      const payload = {
        ...formData,
        price: parseFloat(formData.price)
      };
      
      await axios.patch(`/api/licenses/${id}`, payload);
      mutate(); // Refetch license data
      
      setError(null);
    } catch (err: any) {
      console.error('Error updating license:', err);
      setError(err.response?.data?.message || 'Error updating license. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete license
  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await axios.delete(`/api/licenses/${id}`);
      router.push(`/teams/${slug}/licenses`);
    } catch (err: any) {
      console.error('Error deleting license:', err);
      setError(err.response?.data?.message || 'Error deleting license. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Handle duplicate license
  const handleDuplicate = () => {
    // Copy current form data without the ID
    const newLicenseData = {
      ...formData,
      // Reset dates to default
      activationDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    };
    
    // Store in session storage for the new license page
    sessionStorage.setItem('duplicateLicense', JSON.stringify(newLicenseData));
    
    // Navigate to new license page
    router.push(`/teams/${slug}/licenses/new`);
  };

  const isLoading = isTeamLoading || isLicenseLoading || isEmployeesLoading;

  if (isLoading) {
    return <Loading />;
  }

  if (isTeamError) {
    return <Error message={isTeamError.message} />;
  }

  if (licenseError) {
    return <Error message="Error loading license information. The license may not exist or you don't have access." />;
  }

  if (!team) {
    return <Error message={t('team-not-found')} />;
  }

  if (!license) {
    return <Error message="License not found" />;
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
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Edit License</h1>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg p-6 max-w-3xl">
          {/* License header */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{license.software}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">License ID: {license.id}</p>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handleDuplicate}
                className="inline-flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <DocumentDuplicateIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center p-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 dark:bg-gray-700 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900 dark:hover:bg-opacity-30"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Delete confirmation dialog */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Delete License</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to delete this license? This action cannot be undone.
                </p>
                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* License form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
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
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assigned To *
                </label>
                <div className="relative mt-1">
                  <select
                    name="userId"
                    id="userId"
                    className="block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none pr-10"
                    value={formData.userId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select an employee</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.department})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Monthly Price (€) *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">€</span>
                  </div>
                  <input
                    type="number"
                    name="price"
                    id="price"
                    className="pl-7 mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Plan type: {license.planType}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="activationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Activation Date
                  </label>
                  <input
                    type="date"
                    name="activationDate"
                    id="activationDate"
                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.activationDate}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Expiration/Renewal Date
                  </label>
                  <input
                    type="date"
                    name="expirationDate"
                    id="expirationDate"
                    className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.expirationDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <div className="relative mt-1">
                  <select
                    name="status"
                    id="status"
                    className="block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm appearance-none pr-10"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="expired">Expired</option>
                    <option value="pending_cancellation">Pending Cancellation</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-5">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

EditLicense.getLayout = (page) => <AccountLayout>{page}</AccountLayout>;

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default EditLicense; 