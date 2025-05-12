import { AccountLayout } from '@/components/layouts';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPageWithLayout } from 'types';
import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';
import { EmployeeWithRelations } from 'types/softcheck';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Loading } from '@/components/shared';

const Employees: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { slug } = router.query;
  
  const [employeeList, setEmployeeList] = useState<EmployeeWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!slug) return;
      
      try {
        setIsLoading(true);
        const response = await axios.get('/api/employees');
        setEmployeeList(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching employee data:', err);
        setError('Failed to load employee data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployeeData();
  }, [slug]);

  const handleAddEmployee = () => {
    // Implementar funcionalidad para añadir nuevo empleado
    console.log('Add new employee');
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Employees</h1>
      </div>

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between">
          <div>
            <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Employee Directory</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              A complete list of all employees and their assigned software.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddEmployee}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add New Employee
          </button>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Department
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Softwares Installed
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {employeeList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No employees found. Add your first employee.
                  </td>
                </tr>
              ) : (
                employeeList.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-500 font-medium">{employee.name.charAt(0)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{employee.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{employee.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{employee.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white flex flex-wrap gap-1">
                        {employee.software && employee.software.length > 0 ? (
                          employee.software.slice(0, 3).map((software) => (
                            <span 
                              key={software.id} 
                              className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800"
                            >
                              {software.softwareName}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">No software</span>
                        )}
                        {employee.software && employee.software.length > 3 && (
                          <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                            +{employee.software.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : employee.status === 'inactive'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a 
                        href={`/teams/${slug}/employees/${employee.id}`} 
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
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
    </>
  );
};

Employees.getLayout = (page) => <AccountLayout>{page}</AccountLayout>;

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default Employees; 