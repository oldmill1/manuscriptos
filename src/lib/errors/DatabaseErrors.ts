// Base database error class
export class DatabaseError extends Error {
	public readonly cause?: Error;
	public readonly context?: Record<string, any>;

	constructor(message: string, cause?: Error, context?: Record<string, any>) {
		super(message);
		this.name = 'DatabaseError';
		this.cause = cause;
		this.context = context;
		
		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, DatabaseError);
		}
	}

	toString(): string {
		let result = `${this.name}: ${this.message}`;
		if (this.context) {
			result += ` (Context: ${JSON.stringify(this.context)})`;
		}
		if (this.cause) {
			result += ` (Caused by: ${this.cause.message})`;
		}
		return result;
	}
}

// Document-specific errors
export class DocumentNotFoundError extends DatabaseError {
	constructor(id: string, cause?: Error) {
		super(`Document with id '${id}' not found`, cause, { documentId: id });
		this.name = 'DocumentNotFoundError';
	}
}

export class DocumentCreationError extends DatabaseError {
	constructor(documentTitle: string, cause?: Error) {
		super(`Failed to create document '${documentTitle}'`, cause, { documentTitle });
		this.name = 'DocumentCreationError';
	}
}

export class DocumentUpdateError extends DatabaseError {
	constructor(id: string, cause?: Error) {
		super(`Failed to update document '${id}'`, cause, { documentId: id });
		this.name = 'DocumentUpdateError';
	}
}

export class DocumentDeleteError extends DatabaseError {
	constructor(id: string, cause?: Error) {
		super(`Failed to delete document '${id}'`, cause, { documentId: id });
		this.name = 'DocumentDeleteError';
	}
}

export class DocumentConflictError extends DatabaseError {
	constructor(id: string, cause?: Error) {
		super(`Document '${id}' has a conflict`, cause, { documentId: id });
		this.name = 'DocumentConflictError';
	}
}

export class DocumentValidationError extends DatabaseError {
	constructor(field: string, value: any, cause?: Error) {
		super(`Invalid ${field}: '${value}'`, cause, { field, value });
		this.name = 'DocumentValidationError';
	}
}

// Network and connection errors
export class NetworkError extends DatabaseError {
	constructor(operation: string, cause?: Error) {
		super(`Network error during ${operation}`, cause, { operation });
		this.name = 'NetworkError';
	}
}

export class DatabaseConnectionError extends DatabaseError {
	constructor(dbName: string, cause?: Error) {
		super(`Failed to connect to database '${dbName}'`, cause, { dbName });
		this.name = 'DatabaseConnectionError';
	}
}

// Utility function to create appropriate error based on PouchDB error
export function createErrorFromPouchDBError(
	operation: string, 
	entityId?: string, 
	pouchError?: any
): DatabaseError {
	if (!pouchError) {
		return new DatabaseError(`Unknown error during ${operation}`);
	}

	const { status, name, message } = pouchError;
	const cause = new Error(message || pouchError.toString());

	// Map PouchDB errors to our custom errors
	switch (status) {
		case 404:
			return new DocumentNotFoundError(entityId || 'unknown', cause);
		case 409:
			return new DocumentConflictError(entityId || 'unknown', cause);
		case 412:
			return new DocumentValidationError('id', 'missing', cause);
		default:
			if (name === 'unauthorized' || name === 'forbidden') {
				return new DatabaseConnectionError('manuscriptOS_DB', cause);
			}
			return new DatabaseError(`${operation} failed: ${message}`, cause, { 
				operation, 
				entityId, 
				status, 
				pouchErrorName: name 
			});
	}
}
