import type { IDatabase } from '$lib/interfaces/IDatabase';

export class PouchDatabase implements IDatabase {
	private db: any;

	constructor(dbName: string = 'manuscriptOS_DB') {
		this.db = new PouchDB(dbName);
	}

	async create(data: any): Promise<any> {
		try {
			// Map Document format to PouchDB format
			const pouchData = {
				_id: data.id,  // Map id to _id for PouchDB
				title: data.title,
				content: data.content,
				parentId: data.parentId,
				createdAt: data.createdAt?.toISOString?.() || data.createdAt,
				updatedAt: data.updatedAt?.toISOString?.() || data.updatedAt
			};
			
			const result = await this.db.put(pouchData);
			return { ...data, _id: result.id, _rev: result.rev };
		} catch (error) {
			throw new Error(`Failed to create record: ${error}`);
		}
	}

	async read(id: string): Promise<any> {
		try {
			return await this.db.get(id);
		} catch (error) {
			if ((error as any).status === 404) {
				return null;
			}
			throw new Error(`Failed to read record: ${error}`);
		}
	}

	async update(data: any): Promise<any> {
		try {
			const existingDoc = await this.db.get(data.id);
			
			// Map Document format to PouchDB format
			const pouchData = {
				_id: data.id,  // Map id to _id for PouchDB
				_rev: existingDoc._rev,
				title: data.title,
				content: data.content,
				parentId: data.parentId,
				createdAt: data.createdAt?.toISOString?.() || data.createdAt,
				updatedAt: data.updatedAt?.toISOString?.() || data.updatedAt
			};
			
			const result = await this.db.put(pouchData);
			return { ...data, _id: result.id, _rev: result.rev };
		} catch (error) {
			throw new Error(`Failed to update record: ${error}`);
		}
	}

	async delete(id: string): Promise<boolean> {
		try {
			const doc = await this.db.get(id);
			await this.db.remove(doc);
			return true;
		} catch (error) {
			if ((error as any).status === 404) {
				return false;
			}
			throw new Error(`Failed to delete record: ${error}`);
		}
	}

	async list(): Promise<any[]> {
		try {
			const result = await this.db.allDocs({
				include_docs: true
			});
			return result.rows.map((row: any) => row.doc);
		} catch (error) {
			throw new Error(`Failed to list records: ${error}`);
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
			throw new Error(`Failed to get records by parent ID: ${error}`);
		}
	}

	async search(query: string): Promise<any[]> {
		try {
			const records = await this.list();
			const lowerQuery = query.toLowerCase();
			
			return records.filter((record: any) => 
				(record.title && record.title.toLowerCase().includes(lowerQuery)) ||
				(record.content && record.content.toLowerCase().includes(lowerQuery))
			);
		} catch (error) {
			throw new Error(`Failed to search records: ${error}`);
		}
	}

	async getInfo(): Promise<any> {
		try {
			return await this.db.info();
		} catch (error) {
			throw new Error(`Failed to get database info: ${error}`);
		}
	}

	async destroy(): Promise<void> {
		try {
			await this.db.destroy();
		} catch (error) {
			throw new Error(`Failed to destroy database: ${error}`);
		}
	}
}
