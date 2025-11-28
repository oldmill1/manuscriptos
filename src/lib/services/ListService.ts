import { List, type ListContent, type ListType } from '$lib/models/List';
// PouchDB is loaded via CDN and declared globally in app.d.ts

interface DatabaseList {
	_id: string;
	_rev?: string;
	type: "list"; // Consistent type field like documents
	listType: ListType; // Renamed from type to avoid conflict
	name: string;
	itemIds: string[];
	parentId?: string;
	path: string;
	level: number;
	documentIds: string[];
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
				_id: listData.id, // No more prefix - consistent with documents
				type: "list", // Consistent type field
				listType: listData.type, // Actual list type (favorites/custom)
				name: listData.name,
				itemIds: listData.itemIds,
				parentId: listData.parentId,
				path: listData.path,
				level: listData.level,
				documentIds: listData.documentIds,
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
				path: listData.path,
				level: listData.level,
				documentIds: listData.documentIds,
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
			// Try new unprefixed ID first, then fallback to old prefixed ID
			let pouchList;
			try {
				pouchList = await this.db.get(id);
			} catch (newIdError) {
				// Try old prefixed ID as fallback
				pouchList = await this.db.get(`list:${id}`);
			}

			// Handle backwards compatibility for new fields
			return List.fromJSON({
				id: pouchList._id.replace('list:', ''), // Remove prefix if present
				type: pouchList.listType || pouchList.type, // listType is the actual ListType, type is "list"
				name: pouchList.name,
				itemIds: pouchList.itemIds,
				parentId: pouchList.parentId,
				path: pouchList.path || `/${pouchList._id.replace('list:', '')}`, // Default path if missing
				level: pouchList.level ?? (pouchList.parentId ? 1 : 0), // Calculate level if missing
				documentIds: pouchList.documentIds || [], // Default to empty array
				createdAt: new Date(pouchList.createdAt),
				updatedAt: new Date(pouchList.updatedAt)
			});
		} catch (error) {
			if ((error as any).status === 404) {
				return null;
			}
			throw new Error(`Failed to read list: ${error}`);
		}
	}

	// Get lists by parent ID (for nested folders)
	async getByParentId(parentId?: string): Promise<List[]> {
		try {
			// Get all documents and filter for lists (both old prefixed and new unprefixed)
			const result = await this.db.allDocs({
				include_docs: true
			});
			
			const lists = result.rows
				.filter((row: any) => {
					const doc = row.doc;
					// Handle backwards compatibility - check both old and new patterns
					const isList = doc.type === 'list' || 
								  (doc._id && doc._id.startsWith('list:')) ||
								  (doc.type && (doc.type === 'favorites' || doc.type === 'custom'));
					return isList;
				})
				.map((row: any) => {
					const doc = row.doc;
					return List.fromJSON({
						id: doc._id.replace('list:', ''), // Remove prefix if present
						type: doc.listType || doc.type, // listType is the actual ListType, type is "list"
						name: doc.name,
						itemIds: doc.itemIds,
						parentId: doc.parentId,
						path: doc.path || `/${doc._id.replace('list:', '')}`, // Default path if missing
						level: doc.level ?? (doc.parentId ? 1 : 0), // Calculate level if missing
						documentIds: doc.documentIds || [], // Default to empty array
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
			// Try to get existing list with new unprefixed ID first, then fallback to old prefixed ID
			let existingList;
			try {
				existingList = await this.db.get(list.id);
			} catch (newIdError) {
				// Try old prefixed ID as fallback
				existingList = await this.db.get(`list:${list.id}`);
			}

			const listData = list.toJSON();
			const pouchList: DatabaseList = {
				_id: listData.id, // Use new unprefixed ID
				_rev: existingList._rev,
				type: "list", // Consistent type field
				listType: listData.type, // Actual list type
				name: listData.name,
				itemIds: listData.itemIds,
				parentId: listData.parentId,
				path: listData.path,
				level: listData.level,
				documentIds: listData.documentIds,
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
				path: listData.path,
				level: listData.level,
				documentIds: listData.documentIds,
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
			// Try to get list with new unprefixed ID first, then fallback to old prefixed ID
			let list;
			try {
				list = await this.db.get(id);
			} catch (newIdError) {
				// Try old prefixed ID as fallback
				list = await this.db.get(`list:${id}`);
			}
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
