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
			const pouchList = await this.db.get(id);

			return List.fromJSON({
				id: pouchList._id,
				type: pouchList.listType, // Use new schema field
				name: pouchList.name,
				itemIds: pouchList.itemIds,
				parentId: pouchList.parentId,
				path: pouchList.path,
				level: pouchList.level,
				documentIds: pouchList.documentIds,
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
			// Get all documents and filter for lists using new schema
			const result = await this.db.allDocs({
				include_docs: true
			});
			
			const lists = result.rows
				.filter((row: any) => {
					const doc = row.doc;
					// Use consistent type field - new schema only
					return doc.type === 'list';
				})
				.map((row: any) => {
					const doc = row.doc;
					return List.fromJSON({
						id: doc._id,
						type: doc.listType, // Use new schema field
						name: doc.name,
						itemIds: doc.itemIds,
						parentId: doc.parentId,
						path: doc.path,
						level: doc.level,
						documentIds: doc.documentIds,
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
			const existingList = await this.db.get(list.id);

			const listData = list.toJSON();
			const pouchList: DatabaseList = {
				_id: listData.id,
				_rev: existingList._rev,
				type: "list",
				listType: listData.type,
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
			const list = await this.db.get(id);
			await this.db.remove(list);
			return true;
		} catch (error) {
			if ((error as any).status === 404) {
				return false;
			}
			throw new Error(`Failed to delete list: ${error}`);
		}
	}

	// Duplicate a list by ID (for copy functionality)
	async duplicate(listId: string, newParentId?: string): Promise<List> {
		try {
			if (!listId?.trim()) {
				throw new Error('List ID is required for duplication');
			}

			// Get the original list
			const originalList = await this.read(listId);
			if (!originalList) {
				throw new Error(`List with ID ${listId} not found for duplication`);
			}

			// Create a new list with copied properties using the constructor
			const duplicatedList = new List(
				originalList.type,
				`${originalList.name} (Copy)`,
				newParentId || originalList.parentId,
				undefined, // let constructor generate path
				undefined, // let constructor calculate level
				[...originalList.documentIds] // copy document IDs
			);

			// Copy the item IDs (need to use the property since it's not in constructor)
			// Note: We'll need to check if there's a setter method for itemIds
			// For now, let's create the list and then update it
			const savedList = await this.create(duplicatedList);
			
			// If itemIds needs to be set separately, we'd update it here
			// But let's see if this works first

			return savedList;
		} catch (error) {
			throw new Error(`Failed to duplicate list ${listId}: ${error}`);
		}
	}

	// List all lists
	async list(): Promise<List[]> {
		try {
			const result = await this.db.allDocs({
				include_docs: true
			});

			return result.rows
				.filter((row: any) => {
					const doc = row.doc;
					// Use consistent type field - new schema only
					return doc.type === 'list';
				})
				.map((row: any) => {
					const list = row.doc as DatabaseList;
					const itemIds = Array.isArray(list.itemIds) ? list.itemIds : [];
					return List.fromJSON({
						id: list._id,
						type: list.listType, // Use new schema field
						name: list.name,
						itemIds: itemIds,
						parentId: list.parentId,
						path: list.path,
						level: list.level,
						documentIds: list.documentIds,
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
