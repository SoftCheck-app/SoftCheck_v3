import { Error as ErrorComponent, Loading } from '@/components/shared';
import { TeamTab } from '@/components/team';
import env from '@/lib/env';
import useTeam from 'hooks/useTeam';
import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { TeamFeature } from 'types';
import { useEffect, useState } from 'react';
import { Card } from '@/components/shared';
import { defaultHeaders } from '@/lib/common';
import toast from 'react-hot-toast';
import { Button } from 'react-daisyui';
import { AccessControl } from '@/components/shared/AccessControl';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface RiskSettings {
  riskAppetite: number;
  lastUpdated?: Date;
}

const Risk = ({ teamFeatures }: { teamFeatures: TeamFeature }) => {
  const { t } = useTranslation('common');
  const { isLoading, isError, team } = useTeam();
  const [riskSettings, setRiskSettings] = useState<RiskSettings>({ riskAppetite: 50 });
  const [isUpdating, setIsUpdating] = useState(false);

  // Cargar la configuración actual de riesgo
  useEffect(() => {
    const fetchRiskSettings = async () => {
      if (!team?.slug) return;
      
      try {
        const response = await fetch(`/api/teams/${team.slug}/risk-settings`, {
          headers: defaultHeaders,
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch risk settings');
        }
        
        const data = await response.json();
        setRiskSettings(data);
      } catch (error) {
        console.error('Error al cargar la configuración de riesgos:', error);
        toast.error('No se pudo cargar la configuración de riesgos');
        
        // Fallback a valores por defecto
        setRiskSettings({ 
          riskAppetite: 50,
          lastUpdated: new Date()
        });
      }
    };
    
    fetchRiskSettings();
  }, [team?.slug]);

  // Guardar la configuración de riesgo
  const saveRiskSettings = async () => {
    if (!team?.slug) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/teams/${team.slug}/risk-settings`, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify(riskSettings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save risk settings');
      }
      
      const data = await response.json();
      setRiskSettings(data);
      
      toast.success('Configuración de riesgos guardada correctamente');
    } catch (error) {
      console.error('Error al guardar la configuración de riesgos:', error);
      toast.error('No se pudo guardar la configuración de riesgos');
    } finally {
      setIsUpdating(false);
    }
  };

  // Función para interpretar el nivel de riesgo
  const getRiskLevel = (value: number) => {
    if (value <= 20) return { text: 'Muy Bajo', color: 'bg-green-500' };
    if (value <= 40) return { text: 'Bajo', color: 'bg-blue-500' };
    if (value <= 60) return { text: 'Moderado', color: 'bg-yellow-500' };
    if (value <= 80) return { text: 'Alto', color: 'bg-orange-500' };
    return { text: 'Muy Alto', color: 'bg-red-500' };
  };

  // Obtener la descripción del nivel de riesgo actual
  const getRiskDescription = (value: number) => {
    if (value <= 20) {
      return 'Nivel de riesgo muy bajo. Configuración de seguridad extremadamente restrictiva. Solo se aprobarán aplicaciones que pasen las verificaciones de seguridad más rigurosas.';
    }
    if (value <= 40) {
      return 'Nivel de riesgo bajo. Configuración restrictiva que mantiene un estándar alto de seguridad, permitiendo solo aplicaciones bien verificadas.';
    }
    if (value <= 60) {
      return 'Nivel de riesgo moderado. Balance entre seguridad y usabilidad. La mayoría de aplicaciones populares serán aprobadas tras las verificaciones estándar.';
    }
    if (value <= 80) {
      return 'Nivel de riesgo alto. Prioriza la usabilidad sobre la seguridad. La mayoría de aplicaciones serán aprobadas a menos que tengan riesgos evidentes.';
    }
    return 'Nivel de riesgo muy alto. Se aprueban casi todas las aplicaciones con verificaciones mínimas. No recomendado para entornos que manejen datos sensibles.';
  };

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <ErrorComponent message={isError.message} />;
  }

  if (!team) {
    return <ErrorComponent message={t('team-not-found')} />;
  }

  const riskLevel = getRiskLevel(riskSettings.riskAppetite);

  return (
    <>
      <TeamTab activeTab="risk" team={team} teamFeatures={teamFeatures} />
      <div className="space-y-6">
        <Card>
          <Card.Body>
            <Card.Header>
              <Card.Title>Apetito al Riesgo</Card.Title>
              <Card.Description>
                Configure el nivel de tolerancia al riesgo para la aprobación de software
              </Card.Description>
            </Card.Header>

            <div className="mt-6 space-y-8">
              {/* Indicador de nivel de riesgo actual */}
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nivel actual: {riskLevel.text}
                  </span>
                  <span className="text-sm text-gray-500">
                    {riskSettings.lastUpdated && (
                      <>Última actualización: {new Date(riskSettings.lastUpdated).toLocaleDateString()}</>
                    )}
                  </span>
                </div>
                
                {/* Control deslizante */}
                <div className="w-full">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={riskSettings.riskAppetite}
                    onChange={(e) => setRiskSettings({ ...riskSettings, riskAppetite: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 px-1 mt-1">
                    <span>0 - Muy restrictivo</span>
                    <span>50 - Equilibrado</span>
                    <span>100 - Permisivo</span>
                  </div>
                </div>
              </div>

              {/* Descripción del nivel de riesgo */}
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <InformationCircleIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Información sobre el nivel de riesgo</h3>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <p>{getRiskDescription(riskSettings.riskAppetite)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visualización del valor numérico */}
              <div className="flex items-center justify-center">
                <div className={`text-center p-4 rounded-full w-24 h-24 flex items-center justify-center ${riskLevel.color}`}>
                  <span className="text-2xl font-bold text-white">{riskSettings.riskAppetite}</span>
                </div>
              </div>
            </div>
          </Card.Body>

          <AccessControl resource="team" actions={['update']}>
            <Card.Footer>
              <div className="flex justify-end">
                <Button
                  type="button"
                  color="primary"
                  loading={isUpdating}
                  onClick={saveRiskSettings}
                  size="md"
                >
                  {t('save-changes')}
                </Button>
              </div>
            </Card.Footer>
          </AccessControl>
        </Card>

        {/* Sección de políticas de riesgo seleccionables */}
        <Card>
          <Card.Body>
            <Card.Header>
              <Card.Title>Políticas de Riesgo</Card.Title>
              <Card.Description>
                Seleccione las políticas de riesgo que desea aplicar para su organización
              </Card.Description>
            </Card.Header>

            <div className="mt-4 space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
                {/* Política 1 */}
                <div className="p-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="policy-1"
                        name="policy-1"
                        type="checkbox"
                        defaultChecked
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="policy-1" className="font-medium text-gray-700 dark:text-gray-200">
                        Bloquear software no firmado
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        El software sin firma digital será automáticamente rechazado a menos que el nivel de riesgo sea superior a 80.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          Riesgo Alto
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Seguridad
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Política 2 */}
                <div className="p-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="policy-2"
                        name="policy-2"
                        type="checkbox"
                        defaultChecked
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="policy-2" className="font-medium text-gray-700 dark:text-gray-200">
                        Permitir desarrolladores verificados
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        El software de desarrolladores verificados se aprobará automáticamente si el nivel de riesgo es superior a 40.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Riesgo Bajo
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Usabilidad
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Política 3 */}
                <div className="p-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="policy-3"
                        name="policy-3"
                        type="checkbox"
                        defaultChecked
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="policy-3" className="font-medium text-gray-700 dark:text-gray-200">
                        Rechazar software con vulnerabilidades conocidas
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        El software con vulnerabilidades conocidas será rechazado, a menos que el nivel de riesgo sea superior a 80.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          Riesgo Alto
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          Cumplimiento
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Política 4 */}
                <div className="p-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="policy-4"
                        name="policy-4"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="policy-4" className="font-medium text-gray-700 dark:text-gray-200">
                        Requerir revisión manual para software descargado de Internet
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        Todo software descargado de Internet requerirá una revisión manual antes de ser aprobado.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Riesgo Medio
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Seguridad
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Política 5 */}
                <div className="p-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="policy-5"
                        name="policy-5"
                        type="checkbox"
                        defaultChecked
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="policy-5" className="font-medium text-gray-700 dark:text-gray-200">
                        Aprobar automáticamente actualizaciones de software ya aprobado
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        Las actualizaciones de software previamente aprobado se aprobarán automáticamente.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Riesgo Bajo
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          Usabilidad
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card.Body>
          <AccessControl resource="team" actions={['update']}>
            <Card.Footer>
              <div className="flex justify-end">
                <Button
                  type="button"
                  color="primary"
                  onClick={saveRiskSettings}
                  loading={isUpdating}
                  size="md"
                >
                  {t('save-changes')}
                </Button>
              </div>
            </Card.Footer>
          </AccessControl>
        </Card>
      </div>
    </>
  );
};

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

export default Risk; 