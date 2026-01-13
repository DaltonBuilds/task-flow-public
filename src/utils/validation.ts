// Input validation utilities
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Field length limits
export const FIELD_LIMITS = {
  TITLE_MAX: 500,
  DESCRIPTION_MAX: 10000,
  COMMENT_MAX: 5000,
  NAME_MAX: 200,
  TAG_MAX_LENGTH: 50,
  TAG_MAX_COUNT: 20,
} as const;

/**
 * Validate string length
 */
export function validateLength(
  value: unknown,
  fieldName: string,
  min: number = 1,
  max: number = Infinity
): ValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }

  if (value.length < min) {
    return { valid: false, error: `${fieldName} must be at least ${min} characters` };
  }

  if (value.length > max) {
    return { valid: false, error: `${fieldName} must be at most ${max} characters` };
  }

  return { valid: true };
}

/**
 * Validate title field
 */
export function validateTitle(title: unknown): ValidationResult {
  if (!title) {
    return { valid: false, error: 'Title is required' };
  }

  const trimmed = typeof title === 'string' ? title.trim() : '';
  if (trimmed.length === 0) {
    return { valid: false, error: 'Title cannot be empty' };
  }

  return validateLength(trimmed, 'Title', 1, FIELD_LIMITS.TITLE_MAX);
}

/**
 * Validate description field (optional)
 */
export function validateDescription(description: unknown): ValidationResult {
  if (description === null || description === undefined) {
    return { valid: true }; // Optional field
  }

  if (typeof description !== 'string') {
    return { valid: false, error: 'Description must be a string' };
  }

  return validateLength(description, 'Description', 0, FIELD_LIMITS.DESCRIPTION_MAX);
}

/**
 * Validate comment content
 */
export function validateCommentContent(content: unknown): ValidationResult {
  if (!content) {
    return { valid: false, error: 'Comment content is required' };
  }

  if (typeof content !== 'string') {
    return { valid: false, error: 'Comment content must be a string' };
  }

  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Comment content cannot be empty' };
  }

  return validateLength(trimmed, 'Comment', 1, FIELD_LIMITS.COMMENT_MAX);
}

/**
 * Validate name field (for boards, columns)
 */
export function validateName(name: unknown): ValidationResult {
  if (!name) {
    return { valid: false, error: 'Name is required' };
  }

  if (typeof name !== 'string') {
    return { valid: false, error: 'Name must be a string' };
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Name cannot be empty' };
  }

  return validateLength(trimmed, 'Name', 1, FIELD_LIMITS.NAME_MAX);
}

/**
 * Validate priority value
 */
export function validatePriority(priority: unknown): ValidationResult {
  const validPriorities = ['low', 'medium', 'high'];
  
  if (typeof priority !== 'string') {
    return { valid: false, error: 'Priority must be a string' };
  }

  if (!validPriorities.includes(priority)) {
    return { valid: false, error: `Priority must be one of: ${validPriorities.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Validate tags array
 */
export function validateTags(tags: unknown): ValidationResult {
  if (tags === null || tags === undefined) {
    return { valid: true }; // Optional field
  }

  if (!Array.isArray(tags)) {
    return { valid: false, error: 'Tags must be an array' };
  }

  if (tags.length > FIELD_LIMITS.TAG_MAX_COUNT) {
    return { valid: false, error: `Tags cannot exceed ${FIELD_LIMITS.TAG_MAX_COUNT} items` };
  }

  for (const tag of tags) {
    if (typeof tag !== 'string') {
      return { valid: false, error: 'All tags must be strings' };
    }

    const trimmed = tag.trim();
    if (trimmed.length === 0) {
      return { valid: false, error: 'Tags cannot be empty strings' };
    }

    if (trimmed.length > FIELD_LIMITS.TAG_MAX_LENGTH) {
      return { valid: false, error: `Tag length cannot exceed ${FIELD_LIMITS.TAG_MAX_LENGTH} characters` };
    }
  }

  return { valid: true };
}

/**
 * Validate date string (ISO format)
 */
export function validateDate(date: unknown): ValidationResult {
  if (date === null || date === undefined) {
    return { valid: true }; // Optional field
  }

  if (typeof date !== 'string') {
    return { valid: false, error: 'Date must be a string' };
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Date must be a valid ISO date string' };
  }

  return { valid: true };
}

/**
 * Validate UUID/ID format
 */
export function validateId(id: unknown, fieldName: string = 'ID'): ValidationResult {
  if (!id) {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (typeof id !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }

  if (id.trim().length === 0) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }

  // Basic validation - should be alphanumeric with underscores/hyphens
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return { valid: false, error: `${fieldName} contains invalid characters` };
  }

  return { valid: true };
}

/**
 * Validate sort field for ORDER BY (prevent SQL injection)
 */
export function validateSortField(sortField: unknown): ValidationResult {
  const allowedFields = ['position', 'due_date', 'priority', 'updated_at', 'created_at', 'title'];
  
  if (typeof sortField !== 'string') {
    return { valid: false, error: 'Sort field must be a string' };
  }

  if (!allowedFields.includes(sortField)) {
    return { valid: false, error: `Sort field must be one of: ${allowedFields.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Validate sort order
 */
export function validateSortOrder(order: unknown): ValidationResult {
  const allowedOrders = ['asc', 'desc'];
  
  if (typeof order !== 'string') {
    return { valid: false, error: 'Sort order must be a string' };
  }

  const lowerOrder = order.toLowerCase();
  if (!allowedOrders.includes(lowerOrder)) {
    return { valid: false, error: `Sort order must be one of: ${allowedOrders.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Sanitize string - remove potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Sanitize HTML content (basic - for production, use DOMPurify)
 */
export function sanitizeHtml(input: string): string {
  // Basic HTML entity encoding
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
