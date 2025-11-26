import { Document, type DocumentContent } from '$lib/models/Document';
// PouchDB is loaded via CDN and declared globally in app.d.ts

interface DatabaseDocument {
	_id: string;
	_rev?: string;
	title: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}

export class DocumentService {
	private db: any;

	constructor(dbName: string = 'squiredb') {
		this.db = new PouchDB(dbName);
	}

	// Create a new document
	async create(document: Document): Promise<Document> {
		try {
			const docData = document.toJSON();
			const pouchDoc: DatabaseDocument = {
				_id: docData.id,
				title: docData.title,
				content: docData.content,
				createdAt: docData.createdAt.toISOString(),
				updatedAt: docData.updatedAt.toISOString()
			};

			const result = await this.db.put(pouchDoc);

			// Return a new document instance with the saved data
			return Document.fromJSON({
				id: result.id,
				title: docData.title,
				content: docData.content,
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
			const pouchDoc = await this.db.get(id);
			return Document.fromJSON({
				id: pouchDoc._id,
				title: pouchDoc.title,
				content: pouchDoc.content,
				createdAt: new Date(pouchDoc.createdAt),
				updatedAt: new Date(pouchDoc.updatedAt)
			});
		} catch (error) {
			if ((error as any).status === 404) {
				return null;
			}
			throw new Error(`Failed to read document: ${error}`);
		}
	}

	// Update an existing document
	async update(document: Document): Promise<Document> {
		try {
			// Get the current document to obtain the _rev
			const existingDoc = await this.db.get(document.id);

			const docData = document.toJSON();
			const pouchDoc: DatabaseDocument = {
				_id: docData.id,
				_rev: existingDoc._rev,
				title: docData.title,
				content: docData.content,
				createdAt: docData.createdAt.toISOString(),
				updatedAt: docData.updatedAt.toISOString()
			};

			const result = await this.db.put(pouchDoc);

			return Document.fromJSON({
				id: result.id,
				title: docData.title,
				content: docData.content,
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
			const doc = await this.db.get(id);
			await this.db.remove(doc);
			return true;
		} catch (error) {
			if ((error as any).status === 404) {
				return false;
			}
			throw new Error(`Failed to delete document: ${error}`);
		}
	}

	// List all documents
	async list(): Promise<Document[]> {
		try {
			const result = await this.db.allDocs({
				include_docs: true
			});

			return result.rows
				.filter((row: any) => row.doc && !row.doc._id.startsWith('list:')) // Filter out list entries
				.map((row: any) => {
					const doc = row.doc as DatabaseDocument;
					return Document.fromJSON({
						id: doc._id,
						title: doc.title,
						content: doc.content,
						createdAt: new Date(doc.createdAt),
						updatedAt: new Date(doc.updatedAt)
					});
				});
		} catch (error) {
			throw new Error(`Failed to list documents: ${error}`);
		}
	}

	// Search documents by title or content
	async search(query: string): Promise<Document[]> {
		try {
			const documents = await this.list();
			const lowerQuery = query.toLowerCase();

			return documents.filter(
				(doc) =>
					doc.title.toLowerCase().includes(lowerQuery) ||
					doc.content.toLowerCase().includes(lowerQuery)
			);
		} catch (error) {
			throw new Error(`Failed to search documents: ${error}`);
		}
	}

	// Get database info
	async getInfo(): Promise<any> {
		try {
			return await this.db.info();
		} catch (error) {
			throw new Error(`Failed to get database info: ${error}`);
		}
	}

	// Destroy the database
	async destroy(): Promise<void> {
		try {
			await this.db.destroy();
		} catch (error) {
			throw new Error(`Failed to destroy database: ${error}`);
		}
	}
}

// Note: DocumentService should be instantiated only in the browser
// Use: const documentService = new DocumentService();
