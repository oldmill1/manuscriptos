import type { IDatabase } from '$lib/interfaces/IDatabase';
import { createErrorFromPouchDBError } from '$lib/errors/DatabaseErrors';

export class PouchDatabase implements IDatabase {
	private db: any;

	constructor(dbName: string = 'manuscriptOS_DB') {
		this.db = new PouchDB(dbName);
	}

	async create(data: any): Promise<any> {
		try {
			// Validate input - check for _id (PouchDB format) or id (Document format)
			if (!data._id && !data.id) {
				throw createErrorFromPouchDBError('create', undefined, { status: 412, name: 'missing_id', message: '_id is required for puts' });
			}

			// Use _id if available, otherwise use id
			const docId = data._id || data.id;

			// Map Document format to PouchDB format
			const pouchData = {
				_id: docId,
				type: data.type, // Include type field
				title: data.title,
				content: data.content,
				name: data.name, // Include name field for characters
				dob: data.dob,   // Include dob field for characters
				dod: data.dod,   // Include dod field for characters
				parentId: data.parentId,
				path: data.path,
				level: data.level,
				isInFavorites: data.isInFavorites,
				listIds: data.listIds,
				createdAt: data.createdAt?.toISOString?.() || data.createdAt,
				updatedAt: data.updatedAt?.toISOString?.() || data.updatedAt
			};
			
			const result = await this.db.put(pouchData);
			return { ...data, _id: result.id, _rev: result.rev };
		} catch (error) {
			throw createErrorFromPouchDBError('create', data._id || data.id, error);
		}
	}

	async read(id: string): Promise<any> {
		try {
			if (!id) {
				throw new Error('Document ID is required for read operation');
			}
			return await this.db.get(id);
		} catch (error) {
			throw createErrorFromPouchDBError('read', id, error);
		}
	}

	async update(data: any): Promise<any> {
		try {
			if (!data._id) {
				throw new Error('Document ID is required for update operation');
			}

			const existingDoc = await this.db.get(data._id);
			
			// Map Document format to PouchDB format
			const pouchData = {
				_id: data._id,  // Use the _id that was passed in
				_rev: existingDoc._rev,
				type: data.type, // Include type field
				title: data.title,
				content: data.content,
				name: data.name, // Include name field for characters
				dob: data.dob,   // Include dob field for characters
				dod: data.dod,   // Include dod field for characters
				parentId: data.parentId,
				path: data.path,
				level: data.level,
				isInFavorites: data.isInFavorites,
				listIds: data.listIds,
				createdAt: data.createdAt?.toISOString?.() || data.createdAt,
				updatedAt: data.updatedAt?.toISOString?.() || data.updatedAt
			};
			
			const result = await this.db.put(pouchData);
			return { ...data, _id: result.id, _rev: result.rev };
		} catch (error) {
			throw createErrorFromPouchDBError('update', data._id, error);
		}
	}

	async delete(id: string): Promise<boolean> {
		try {
			if (!id) {
				throw new Error('Document ID is required for delete operation');
			}
			
			const doc = await this.db.get(id);
			await this.db.remove(doc);
			return true;
		} catch (error) {
			if ((error as any).status === 404) {
				return false; // Document doesn't exist, considered successfully deleted
			}
			throw createErrorFromPouchDBError('delete', id, error);
		}
	}

	async list(): Promise<any[]> {
		try {
			const result = await this.db.allDocs({
				include_docs: true
			});
			return result.rows.map((row: any) => row.doc);
		} catch (error) {
			throw createErrorFromPouchDBError('list', undefined, error);
		}
	}

	async getByParentId(parentId?: string): Promise<any[]> {
		try {
			const result = await this.db.allDocs({
				include_docs: true
			});
			
			return result.rows
				.map((row: any) => row.doc)
				.filter((doc: any) => doc.parentId === parentId);
		} catch (error) {
			throw createErrorFromPouchDBError('getByParentId', parentId, error);
		}
	}

	async search(query: string): Promise<any[]> {
		try {
			if (!query || query.trim() === '') {
				return [];
			}

			const records = await this.list();
			const lowerQuery = query.toLowerCase();
			
			return records.filter((record: any) => 
				(record.title && record.title.toLowerCase().includes(lowerQuery)) ||
				(record.content && record.content.toLowerCase().includes(lowerQuery))
			);
		} catch (error) {
			throw createErrorFromPouchDBError('search', query, error);
		}
	}

	async getInfo(): Promise<any> {
		try {
			return await this.db.info();
		} catch (error) {
			throw createErrorFromPouchDBError('getInfo', undefined, error);
		}
	}

	async destroy(): Promise<void> {
		try {
			await this.db.destroy();
		} catch (error) {
			throw createErrorFromPouchDBError('destroy', undefined, error);
		}
	}
}
