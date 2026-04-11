// Crewspace Azure Infrastructure
// Deploys: Azure OpenAI (GPT-4o-mini) + Azure Static Web App

@description('Azure region for all resources')
param location string = 'eastus2'

@description('Unique suffix for resource names')
param nameSuffix string = 'crewspace'

@description('Azure OpenAI model deployment name')
param openaiDeploymentName string = 'gpt-4o-mini'

@description('Azure OpenAI model name')
param openaiModelName string = 'gpt-4o-mini'

@description('Azure OpenAI model version')
param openaiModelVersion string = '2024-07-18'

@description('Static Web App SKU')
param swaSku string = 'Free'

// ---------------------------------------------------------------------------
// Azure OpenAI Service
// ---------------------------------------------------------------------------

resource openai 'Microsoft.CognitiveServices/accounts@2024-10-01' = {
  name: 'oai-${nameSuffix}'
  location: location
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  properties: {
    customSubDomainName: 'oai-${nameSuffix}'
    publicNetworkAccess: 'Enabled'
  }
}

resource openaiDeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-10-01' = {
  parent: openai
  name: openaiDeploymentName
  sku: {
    name: 'GlobalStandard'
    capacity: 10 // 10K tokens-per-minute — plenty for light usage
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: openaiModelName
      version: openaiModelVersion
    }
  }
}

// ---------------------------------------------------------------------------
// Azure Static Web App (Free tier — includes integrated Functions)
// ---------------------------------------------------------------------------

resource staticWebApp 'Microsoft.Web/staticSites@2024-04-01' = {
  name: 'swa-${nameSuffix}'
  location: location
  sku: {
    name: swaSku
    tier: swaSku
  }
  properties: {
    stagingEnvironmentPolicy: 'Enabled'
  }
}

// Wire Azure OpenAI secrets into the Static Web App's Function backend
resource swaAppSettings 'Microsoft.Web/staticSites/config@2024-04-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    AZURE_OPENAI_ENDPOINT: openai.properties.endpoint
    AZURE_OPENAI_API_KEY: openai.listKeys().key1
    AZURE_OPENAI_DEPLOYMENT: openaiDeploymentName
    AZURE_OPENAI_API_VERSION: '2024-10-21'
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------

@description('Static Web App default hostname')
output swaHostname string = staticWebApp.properties.defaultHostname

@description('Static Web App deployment token (use as GitHub secret)')
@secure()
output swaDeploymentToken string = staticWebApp.listSecrets().properties.apiKey

@description('Azure OpenAI endpoint')
output openaiEndpoint string = openai.properties.endpoint

@description('Static Web App resource name')
output swaName string = staticWebApp.name
