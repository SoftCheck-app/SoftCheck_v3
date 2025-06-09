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
import useTeam from 'hooks/useTeam';
import toast from 'react-hot-toast';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import React, { Fragment } from 'react';

const Employees: NextPageWithLayout = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { slug } = router.query;
  
  // Get team information
  const { isLoading: isTeamLoading, isError: isTeamError, team } = useTeam();
  
  const [employeeList, setEmployeeList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!team?.id) return;
      
      try {
        setIsLoading(true);
        const response = await axios.get(`/api/employees?teamId=${team.id}`);
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
  }, [team?.id]);

  const handleAddEmployee = () => {
    // Implementar funcionalidad para añadir nuevo empleado
    console.log('Add new employee');
  };

  const handleEditEmployee = (employee: any) => {
    setEditingEmployee({ ...employee });
    setIsEditing(true);
  };

  const handleCloseModal = () => {
    setIsEditing(false);
    setEditingEmployee(null);
  };

  const handleSaveEmployee = async () => {
    if (!editingEmployee || !team?.id) return;

    setIsSaving(true);
    try {
      const response = await axios.put('/api/employees', {
        ...editingEmployee,
        teamId: team.id,
      });

      // Actualizar la lista de empleados
      setEmployeeList(prev => 
        prev.map(emp => emp.id === editingEmployee.id ? response.data : emp)
      );

      toast.success('Employee updated successfully');
      handleCloseModal();
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast.error(error.response?.data?.message || 'Failed to update employee');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditingEmployee(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleEmployeeExpansion = (employeeId: string) => {
    setExpandedEmployees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  if (isTeamLoading || isLoading) {
    return <Loading />;
  }

  if (isTeamError) {
    return <div>Error loading team data</div>;
  }

  if (!team) {
    return <div>Team not found</div>;
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
                  Approved Software
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
                  <Fragment key={employee.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <button
                            onClick={() => toggleEmployeeExpansion(employee.id)}
                            className="mr-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                            title={expandedEmployees.has(employee.id) ? 'Hide software' : 'Show software'}
                          >
                            {expandedEmployees.has(employee.id) ? (
                              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
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
                        <div className="text-sm text-gray-900 dark:text-white">
                          {employee.software && employee.software.filter((s: any) => s.isApproved).length > 0 ? (
                            <span className="font-medium">
                              {employee.software.filter((s: any) => s.isApproved).length} approved software{employee.software.filter((s: any) => s.isApproved).length !== 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">No approved software</span>
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
                        <button 
                          onClick={() => handleEditEmployee(employee)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                    
                    {/* Fila expandida para mostrar software */}
                    {expandedEmployees.has(employee.id) && (
                      <tr key={`${employee.id}-expanded`}>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
                          <div className="pl-8">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                              Approved software:
                            </h4>
                            {employee.software && employee.software.filter((software: any) => software.isApproved).length > 0 ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400 font-medium border-b pb-2">
                                  <div>Software</div>
                                  <div>Version</div>
                                </div>
                                {employee.software.filter((software: any) => software.isApproved).map((software: any) => (
                                  <div key={software.id} className="grid grid-cols-2 gap-4 text-sm items-center py-2 border-b border-gray-100 dark:border-gray-600 last:border-b-0">
                                    <div className="text-gray-900 dark:text-white font-medium">
                                      {software.softwareName}
                                    </div>
                                    <div className="text-gray-500 dark:text-gray-400">
                                      {software.version}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                No approved software for this employee.
                              </p>
                            )}
                          </div>
                        </td>
                                             </tr>
                     )}
                   </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de edición */}
      {isEditing && editingEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Edit Employee
              </h3>
              
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editingEmployee.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingEmployee.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editingEmployee.department || ''}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <select
                    value={editingEmployee.role || 'MEMBER'}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MEMBER">Member</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={editingEmployee.status || 'active'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCloseModal}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEmployee}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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