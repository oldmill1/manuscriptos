import { Document, type DocumentContent } from '$lib/models/Document';
import type { IDatabase } from '$lib/interfaces/IDatabase';
import { 
	DocumentNotFoundError, 
	DocumentCreationError, 
	DocumentUpdateError, 
	DocumentDeleteError, 
	DocumentConflictError,
	DocumentValidationError,
	DatabaseError 
} from '$lib/errors/DatabaseErrors';

interface DatabaseDocument {
	_id: string;
	_rev?: string;
	title: string;
	content: string;
	parentId?: string;
	createdAt: string;
	updatedAt: string;
}

export class DocumentService {
	private database: IDatabase;

	constructor(database: IDatabase) {
		this.database = database;
	}

	// Create a new document
	async create(document: Document): Promise<Document> {
		try {
			// Validate document
			if (!document.title?.trim()) {
				throw new DocumentValidationError('title', document.title);
			}

			const docData = document.toJSON();
			const result = await this.database.create(docData);

			// Return a new document instance with the saved data
			return Document.fromJSON({
				id: result.id || result._id,
				title: docData.title,
				content: docData.content,
				parentId: docData.parentId,
				createdAt: docData.createdAt,
				updatedAt: docData.updatedAt
			});
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error; // Re-throw our custom errors
			}
			throw new DocumentCreationError(document.title || 'untitled', error as Error);
		}
	}

	// Read a document by ID
	async read(id: string): Promise<Document | null> {
		try {
			if (!id?.trim()) {
				throw new DocumentValidationError('id', id);
			}

			const result = await this.database.read(id);
			if (!result) return null;
			
			// Map PouchDB result to DocumentContent format
			const documentContent = {
				id: result._id || result.id,
				title: result.title,
				content: result.content,
				parentId: result.parentId,
				createdAt: new Date(result.createdAt),
				updatedAt: new Date(result.updatedAt)
			};
			
			return Document.fromJSON(documentContent);
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error; // Re-throw our custom errors
			}
			throw new DocumentNotFoundError(id, error as Error);
		}
	}

	// Update an existing document
	async update(document: Document): Promise<Document> {
		try {
			// Validate document
			if (!document.id?.trim()) {
				throw new DocumentValidationError('id', document.id);
			}
			if (!document.title?.trim()) {
				throw new DocumentValidationError('title', document.title);
			}

			const docData = document.toJSON();
			const updateData = {
				_id: docData.id,
				title: docData.title,
				content: docData.content,
				parentId: docData.parentId,
				createdAt: docData.createdAt.toISOString(),
				updatedAt: docData.updatedAt.toISOString()
			};
			
			const result = await this.database.update(updateData);

			return Document.fromJSON({
				id: result.id || result._id,
				title: docData.title,
				content: docData.content,
				parentId: docData.parentId,
				createdAt: docData.createdAt,
				updatedAt: docData.updatedAt
			});
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error; // Re-throw our custom errors
			}
			throw new DocumentUpdateError(document.id, error as Error);
		}
	}

	// Delete a document by ID
	async delete(id: string): Promise<boolean> {
		try {
			if (!id?.trim()) {
				throw new DocumentValidationError('id', id);
			}
			return await this.database.delete(id);
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error; // Re-throw our custom errors
			}
			throw new DocumentDeleteError(id, error as Error);
		}
	}

	// List all documents
	async list(): Promise<Document[]> {
		try {
			const results = await this.database.list();

			return results
				.filter((row: any) => row && !(row._id || row.id || '').startsWith('list:')) // Filter out list entries
				.map((row: any) => {
					return Document.fromJSON({
						id: row._id || row.id,
						title: row.title,
						content: row.content,
						parentId: row.parentId,
						createdAt: new Date(row.createdAt),
						updatedAt: new Date(row.updatedAt)
					});
				});
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error; // Re-throw our custom errors
			}
			throw new DatabaseError('Failed to list documents', error as Error);
		}
	}

	// Get documents by parent ID (for nested folders)
	async getByParentId(parentId?: string): Promise<Document[]> {
		try {
			const results = await this.database.getByParentId(parentId);
			
			return results
				.filter((row: any) => row && !(row._id || row.id || '').startsWith('list:')) // Filter out list entries
				.map((row: any) => {
					return Document.fromJSON({
						id: row._id || row.id,
						title: row.title,
						content: row.content,
						parentId: row.parentId,
						createdAt: new Date(row.createdAt),
						updatedAt: new Date(row.updatedAt)
					});
				});
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error; // Re-throw our custom errors
			}
			throw new DatabaseError('Failed to get documents by parent ID', error as Error);
		}
	}

	// Search documents by title or content
	async search(query: string): Promise<Document[]> {
		try {
			if (!query?.trim()) {
				return [];
			}

			const results = await this.database.search(query);
			const lowerQuery = query.toLowerCase();

			return results.filter(
				(doc: any) =>
					doc.title.toLowerCase().includes(lowerQuery) ||
					doc.content.toLowerCase().includes(lowerQuery)
			).map((doc: any) => {
				return Document.fromJSON({
					id: doc._id || doc.id,
					title: doc.title,
					content: doc.content,
					parentId: doc.parentId,
					createdAt: new Date(doc.createdAt),
					updatedAt: new Date(doc.updatedAt)
				});
			});
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error; // Re-throw our custom errors
			}
			throw new DatabaseError('Failed to search documents', error as Error);
		}
	}

	// Get database info
	async getInfo(): Promise<any> {
		try {
			return await this.database.getInfo();
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error; // Re-throw our custom errors
			}
			throw new DatabaseError('Failed to get database info', error as Error);
		}
	}

	// Destroy the database
	async destroy(): Promise<void> {
		try {
			await this.database.destroy();
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error; // Re-throw our custom errors
			}
			throw new DatabaseError('Failed to destroy database', error as Error);
		}
	}
}

// Note: DocumentService should be instantiated with a database implementation
// Use: const documentService = new DocumentService(new PouchDatabase('manuscriptOS_DB'));
