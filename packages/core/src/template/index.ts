/**
 * Template storage and library service exports.
 *
 * @packageDocumentation
 */

export { InMemoryTemplateStorage, _resetTemplateIdCounter } from './template-storage.js';

export { TemplateNotFoundError, TemplateValidationError } from './template-errors.js';

export type {
  CreateTemplateInput,
  ListTemplatesOptions,
  ListTemplatesResult,
  StoredTemplate,
  TemplateCategory,
  TemplateStatus,
  TemplateStorageProvider,
  UpdateTemplateInput,
} from './template-storage-types.js';

// Template Library Service
export { TemplateLibraryService } from './template-service.js';

export type {
  BrowseTemplatesOptions,
  BrowseTemplatesResult,
  FeaturedTemplate,
  InstantiateTemplateOptions,
  TemplateInstantiationResult,
  TemplateLibraryServiceConfig,
  TemplatePopularityStats,
  TemplateWithStats,
} from './template-service-types.js';
