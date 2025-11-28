import { Document, type DocumentContent } from '$lib/models/Document';
import type { IDatabase } from '$lib/interfaces/IDatabase';

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
			throw new Error(`Failed to create document: ${error}`);
		}
	}

	// Read a document by ID
	async read(id: string): Promise<Document | null> {
		try {
			const result = await this.database.read(id);
			if (!result) return null;
			
			return Document.fromJSON({
				id: result._id || result.id,
				title: result.title,
				content: result.content,
				parentId: result.parentId,
				createdAt: new Date(result.createdAt),
				updatedAt: new Date(result.updatedAt)
			});
		} catch (error) {
			throw new Error(`Failed to read document: ${error}`);
		}
	}

	// Update an existing document
	async update(document: Document): Promise<Document> {
		try {
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
			throw new Error(`Failed to update document: ${error}`);
		}
	}

	// Delete a document by ID
	async delete(id: string): Promise<boolean> {
		try {
			return await this.database.delete(id);
		} catch (error) {
			throw new Error(`Failed to delete document: ${error}`);
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
			throw new Error(`Failed to list documents: ${error}`);
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
			console.error('Failed to get documents by parent ID:', error);
			return [];
		}
	}

	// Search documents by title or content
	async search(query: string): Promise<Document[]> {
		try {
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
			throw new Error(`Failed to search documents: ${error}`);
		}
	}

	// Get database info
	async getInfo(): Promise<any> {
		try {
			return await this.database.getInfo();
		} catch (error) {
			throw new Error(`Failed to get database info: ${error}`);
		}
	}

	// Destroy the database
	async destroy(): Promise<void> {
		try {
			await this.database.destroy();
		} catch (error) {
			throw new Error(`Failed to destroy database: ${error}`);
		}
	}
}

// Note: DocumentService should be instantiated with a database implementation
// Use: const documentService = new DocumentService(new PouchDatabase('manuscriptOS_DB'));
