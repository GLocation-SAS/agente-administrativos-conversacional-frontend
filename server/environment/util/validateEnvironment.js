import env from '../environment.js';

const REQUIRED = ['PROJECT_ID', 'AGENT_ID', 'AGENT_ENVIRONMENT_ID'];

export function validateEnvironment() {
  const missing = REQUIRED.filter((key) => !env[key]);

  if (missing.length > 0) {
    console.error(
      'Faltan variables de entorno requeridas:',
      missing.join(', '),
    );
    return false;
  }

  console.log('Variables de entorno cargadas correctamente');
  return true;
}
