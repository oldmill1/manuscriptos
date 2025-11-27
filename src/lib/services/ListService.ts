import { List, type ListContent, type ListType } from '$lib/models/List';
// PouchDB is loaded via CDN and declared globally in app.d.ts

interface DatabaseList {
	_id: string;
	_rev?: string;
	type: ListType;
	name: string;
	itemIds: string[];
	parentId?: string;
	createdAt: string;
	updatedAt: string;
}

export class ListService {
	private db: any;

	constructor(dbName: string = 'manuscriptOS_DB') {
		this.db = new PouchDB(dbName);
	}

	// Create a new list
	async create(list: List): Promise<List> {
		try {
			const listData = list.toJSON();
			const pouchList: DatabaseList = {
				_id: `list:${listData.id}`, // Prefix to avoid conflicts with documents
				type: listData.type,
				name: listData.name,
				itemIds: listData.itemIds,
				parentId: listData.parentId,
				createdAt: listData.createdAt.toISOString(),
				updatedAt: listData.updatedAt.toISOString()
			};

			const result = await this.db.put(pouchList);

			// Return a new list instance with the saved data
			return List.fromJSON({
				id: listData.id,
				type: listData.type,
				name: listData.name,
				itemIds: listData.itemIds,
				parentId: listData.parentId,
				createdAt: listData.createdAt,
				updatedAt: listData.updatedAt
			});
		} catch (error) {
			throw new Error(`Failed to create list: ${error}`);
		}
	}

	// Read a list by ID
	async read(id: string): Promise<List | null> {
		try {
			console.log('Attempting to read list with ID:', id);
			const pouchList = await this.db.get(`list:${id}`);
			console.log('Found pouch list:', pouchList);
			return List.fromJSON({
				id: pouchList._id.replace('list:', ''),
				type: pouchList.type,
				name: pouchList.name,
				itemIds: pouchList.itemIds,
				parentId: pouchList.parentId,
				createdAt: new Date(pouchList.createdAt),
				updatedAt: new Date(pouchList.updatedAt)
			});
		} catch (error) {
			console.log('Error reading list:', error);
			if ((error as any).status === 404) {
				console.log('List not found (404)');
				return null;
			}
			throw new Error(`Failed to read list: ${error}`);
		}
	}

	// Get lists by parent ID (for nested folders)
	async getByParentId(parentId?: string): Promise<List[]> {
		try {
			const result = await this.db.allDocs({
				include_docs: true,
				startkey: 'list:',
				endkey: 'list:\uffff'
			});
			
			const lists = result.rows
				.map((row: any) => {
					const doc = row.doc;
					return List.fromJSON({
						id: doc._id.replace('list:', ''),
						type: doc.type,
						name: doc.name,
						itemIds: doc.itemIds,
						parentId: doc.parentId,
						createdAt: new Date(doc.createdAt),
						updatedAt: new Date(doc.updatedAt)
					});
				})
				.filter((list: List) => list.parentId === parentId);
			
			return lists;
		} catch (error) {
			console.error('Failed to get lists by parent ID:', error);
			return [];
		}
	}

	// Update an existing list
	async update(list: List): Promise<List> {
		try {
			// Get the current list to obtain the _rev
			const existingList = await this.db.get(`list:${list.id}`);

			const listData = list.toJSON();
			const pouchList: DatabaseList = {
				_id: `list:${listData.id}`,
				_rev: existingList._rev,
				type: listData.type,
				name: listData.name,
				itemIds: listData.itemIds,
				parentId: listData.parentId,
				createdAt: listData.createdAt.toISOString(),
				updatedAt: listData.updatedAt.toISOString()
			};

			const result = await this.db.put(pouchList);

			return List.fromJSON({
				id: listData.id,
				type: listData.type,
				name: listData.name,
				itemIds: listData.itemIds,
				parentId: listData.parentId,
				createdAt: listData.createdAt,
				updatedAt: listData.updatedAt
			});
		} catch (error) {
			throw new Error(`Failed to update list: ${error}`);
		}
	}

	// Delete a list by ID
	async delete(id: string): Promise<boolean> {
		try {
			const list = await this.db.get(`list:${id}`);
			await this.db.remove(list);
			return true;
		} catch (error) {
			if ((error as any).status === 404) {
				return false;
			}
			throw new Error(`Failed to delete list: ${error}`);
		}
	}

	// List all lists
	async list(): Promise<List[]> {
		try {
			const result = await this.db.allDocs({
				include_docs: true,
				startkey: 'list:',
				endkey: 'list:\uffff'
			});

			return result.rows
				.filter((row: any) => row.doc && row.doc._id.startsWith('list:'))
				.map((row: any) => {
					const list = row.doc as DatabaseList;
					// Ensure itemIds is an array, fallback to empty array if not iterable
					const itemIds = Array.isArray(list.itemIds) ? list.itemIds : [];
					return List.fromJSON({
						id: list._id.replace('list:', ''),
						type: list.type,
						name: list.name,
						itemIds: itemIds,
						createdAt: new Date(list.createdAt),
						updatedAt: new Date(list.updatedAt)
					});
				});
		} catch (error) {
			throw new Error(`Failed to list lists: ${error}`);
		}
	}

	// Search lists by name
	async search(query: string): Promise<List[]> {
		try {
			const lists = await this.list();
			const lowerQuery = query.toLowerCase();

			return lists.filter((list) => list.name.toLowerCase().includes(lowerQuery));
		} catch (error) {
			throw new Error(`Failed to search lists: ${error}`);
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

// Note: ListService should be instantiated only in the browser
// Use: const listService = new ListService();
