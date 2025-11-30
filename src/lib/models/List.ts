import type { FileSystemItem } from '$lib/interfaces/FileSystemItem';

export type ListType = null | undefined | 'character' | 'manuscript' | 'scene';

export interface ListContent {
	id: string;
	type: ListType;
	name: string;
	itemIds: string[];
	parentId?: string;  // Parent folder ID for nesting
	path: string;      // Computed full path like "/root/folder/subfolder"
	level: number;     // Hierarchy depth (0 = root, 1 = child of root, etc.)
	documentIds: string[]; // Direct reference to documents in this list
	createdAt: Date;
	updatedAt: Date;
}

export class List implements FileSystemItem {
	private _id: string;
	private _type: ListType;
	private _name: string;
	private _itemIds: string[];
	private _parentId?: string;
	private _path: string;
	private _level: number;
	private _documentIds: string[];
	private _createdAt: Date;
	private _updatedAt: Date;

	constructor(type: ListType, customName?: string, parentId?: string, path?: string, level?: number, documentIds?: string[]) {
		this._id = crypto.randomUUID();
		this._type = type;
		this._name = customName || '';
		this._itemIds = [];
		this._parentId = parentId;
		this._path = path || this.generatePath(parentId); // Generate path if not provided
		this._level = level ?? this.calculateLevel(parentId); // Calculate level if not provided
		this._documentIds = documentIds ?? []; // Default to empty array
		this._createdAt = new Date();
		this._updatedAt = new Date();
	}

	// Helper methods for NoSQL optimization
	private generatePath(parentId?: string): string {
		// For now, simple path generation - will be enhanced later with full hierarchy
		return parentId ? `/${parentId}/${this._id}` : `/${this._id}`;
	}

	private calculateLevel(parentId?: string): number {
		// For now, simple level calculation - will be enhanced later with full hierarchy
		return parentId ? 1 : 0; // Root level = 0, child level = 1
	}

	// Getters
	// FileSystemItem interface implementation
	get id(): string { return this._id; }
	get name(): string { return this._name; }
	get parentId(): string | undefined { return this._parentId; }
	get path(): string { return this._path; }
	get level(): number { return this._level; }
	get createdAt(): Date { return this._createdAt; }
	get updatedAt(): Date { return this._updatedAt; }

	// List-specific properties
	get type(): ListType { return this._type; }
	get itemIds(): string[] { return [...this._itemIds]; }
	get documentIds(): string[] { return [...this._documentIds]; } // Return copy to prevent external mutation

	// Setters with automatic timestamp update
	set name(value: string) {
		this._name = value;
		this._updatedAt = new Date();
	}

	set parentId(value: string | undefined) {
		this._parentId = value;
		// Recalculate path and level when parent changes
		this._path = this.generatePath(value);
		this._level = this.calculateLevel(value);
		this._updatedAt = new Date();
	}

	set documentIds(value: string[]) {
		this._documentIds = [...value]; // Store copy to prevent external mutation
		this._updatedAt = new Date();
	}

	// Methods
	addItem(itemId: string): void {
		if (!this._itemIds.includes(itemId)) {
			this._itemIds.push(itemId);
			this._updatedAt = new Date();
		}
	}

	removeItem(itemId: string): void {
		const index = this._itemIds.indexOf(itemId);
		if (index > -1) {
			this._itemIds.splice(index, 1);
			this._updatedAt = new Date();
		}
	}

	hasItem(itemId: string): boolean {
		return this._itemIds.includes(itemId);
	}

	clearItems(): void {
		this._itemIds = [];
		this._updatedAt = new Date();
	}

	// Document management methods for NoSQL optimization
	addDocument(documentId: string): void {
		if (!this._documentIds.includes(documentId)) {
			this._documentIds.push(documentId);
			this._updatedAt = new Date();
		}
	}

	removeDocument(documentId: string): void {
		const index = this._documentIds.indexOf(documentId);
		if (index > -1) {
			this._documentIds.splice(index, 1);
			this._updatedAt = new Date();
		}
	}

	hasDocument(documentId: string): boolean {
		return this._documentIds.includes(documentId);
	}

	clearDocuments(): void {
		this._documentIds = [];
		this._updatedAt = new Date();
	}

	// Serialize for storage
	toJSON(): ListContent {
		return {
			id: this._id,
			type: this._type,
			name: this._name,
			itemIds: [...this._itemIds],
			parentId: this._parentId,
			path: this._path,
			level: this._level,
			documentIds: [...this._documentIds], // Return copy
			createdAt: this._createdAt,
			updatedAt: this._updatedAt
		};
	}

	// Create from JSON
	static fromJSON(data: ListContent): List {
		// Handle backwards compatibility for new fields
		const path = data.path || undefined;
		const level = data.level ?? undefined;
		const documentIds = data.documentIds ?? [];

		const list = new List(data.type, data.name, data.parentId, path, level, documentIds);
		list._id = data.id;
		list._itemIds = [...data.itemIds];
		
		// Handle backwards compatibility for new fields
		list._path = data.path || list.generatePath(data.parentId);
		list._level = data.level ?? list.calculateLevel(data.parentId);
		list._documentIds = data.documentIds ?? [];
		
		list._createdAt = new Date(data.createdAt);
		list._updatedAt = new Date(data.updatedAt);
		return list;
	}

	// Clone list
	clone(): List {
		return List.fromJSON(this.toJSON());
	}
}
