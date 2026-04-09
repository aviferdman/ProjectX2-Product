/**
 * Template storage exports.
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
