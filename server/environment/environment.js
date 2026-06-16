/* const { config } = await import('env-yaml');
config({ path: 'env.dev.yaml' }); */

export const PROJECT_ID = process.env.PROJECT_ID;
export const AGENT_LOCATION = process.env.AGENT_LOCATION || 'global';
export const AGENT_ID = process.env.AGENT_ID;
export const AGENT_ENVIRONMENT_ID = process.env.AGENT_ENVIRONMENT_ID;
export const AGENT_LANGUAGE_CODE = process.env.AGENT_LANGUAGE_CODE || 'es';
export const PORT = Number(process.env.PORT) || 8080;

export default {
  PROJECT_ID,
  AGENT_LOCATION,
  AGENT_ID,
  AGENT_ENVIRONMENT_ID,
  AGENT_LANGUAGE_CODE,
  PORT,
};
