import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleAuth } from 'google-auth-library';
import {
  PROJECT_ID,
  AGENT_LOCATION,
  AGENT_ID,
  AGENT_ENVIRONMENT_ID,
  AGENT_LANGUAGE_CODE,
  PORT,
} from './environment/environment.js';
import { validateEnvironment } from './environment/util/validateEnvironment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

const homePath = path.join(__dirname, '../src/home');
app.use(express.static(homePath));

const quickQuestionsPath = path.join(__dirname, '../src/quick-questions');
app.use('/quick-questions', express.static(quickQuestionsPath));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(homePath, 'index.html'));
});

async function getAccessToken() {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });

  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  return token;
}

app.post('/api/chat', async (req, res) => {
  try {
    const text = req.body.text;
    const sessionId = req.body.sessionId || 'session-' + Date.now();

    const url =
      `https://dialogflow.googleapis.com/v3/projects/${PROJECT_ID}` +
      `/locations/${AGENT_LOCATION}/agents/${AGENT_ID}` +
      `/environments/${AGENT_ENVIRONMENT_ID}` +
      `/sessions/${sessionId}:detectIntent`;

    const body = {
      queryInput: {
        text: { text },
        languageCode: AGENT_LANGUAGE_CODE,
      },
    };

    const token = await getAccessToken();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    res.json({
      reply: data.queryResult?.responseMessages ?? [],
      raw: data,
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error procesando la solicitud' });
  }
});

if (!validateEnvironment()) {
  console.error('Servidor no iniciado: variables de entorno inválidas');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log('Servidor iniciado en PUERTO ' + PORT);
});
