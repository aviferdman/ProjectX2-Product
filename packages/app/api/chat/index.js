/**
 * Azure Function proxy for chat completions.
 * Receives OpenAI-compatible requests from the SPA frontend,
 * forwards them to Azure OpenAI with the server-side API key.
 */

const MAX_BODY_SIZE = 128 * 1024;

module.exports = async function (context, req) {
  const endpoint = process.env['AZURE_OPENAI_ENDPOINT'];
  const apiKey = process.env['AZURE_OPENAI_API_KEY'];
  const deployment = process.env['AZURE_OPENAI_DEPLOYMENT'];
  const apiVersion = process.env['AZURE_OPENAI_API_VERSION'] || '2024-10-21';

  if (!endpoint || !apiKey || !deployment) {
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Azure OpenAI is not configured on the server.' }),
    };
    return;
  }

  if (req.method !== 'POST') {
    context.res = { status: 405, body: 'Method not allowed' };
    return;
  }

  const rawBody = req.rawBody || '';
  if (rawBody.length > MAX_BODY_SIZE) {
    context.res = { status: 413, body: 'Payload too large' };
    return;
  }

  let requestBody;
  try {
    requestBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (_e) {
    context.res = { status: 400, body: 'Invalid JSON body' };
    return;
  }

  if (!requestBody || !Array.isArray(requestBody.messages)) {
    context.res = { status: 400, body: 'Request must include a "messages" array' };
    return;
  }

  const baseUrl = endpoint.replace(/\/+$/, '');
  const url = `${baseUrl}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;

  // Strip model field — Azure uses deployment name instead
  const { model: _model, ...rest } = requestBody;
  const azureBody = { ...rest };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(azureBody),
    });

    const responseBody = await response.text();

    context.res = {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
      body: responseBody,
    };
  } catch (error) {
    context.log.error('Azure OpenAI proxy error:', error);
    context.res = {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to reach Azure OpenAI service.' }),
    };
  }
};
