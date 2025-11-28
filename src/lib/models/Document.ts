import { generateTimeBasedTitle } from '$lib/utils/timeTitle';
import { DocumentValidationError } from '$lib/errors/DatabaseErrors';

export interface DocumentContent {
	id: string;
	title: string;
	content: string;
	parentId?: string;  // Parent folder ID for hierarchy
	path: string;      // Computed full path like "/root/folder/subfolder"
	level: number;     // Hierarchy depth (0 = root, 1 = child of root, etc.)
	isInFavorites: boolean; // Denormalized for quick favorites filtering
	listIds: string[];     // All lists this document belongs to
	createdAt: Date;
	updatedAt: Date;
}

export class Document {
	private _id: string;
	private _title: string;
	private _content: string;
	private _parentId?: string;
	private _path: string;
	private _level: number;
	private _isInFavorites: boolean;
	private _listIds: string[];
	private _createdAt: Date;
	private _updatedAt: Date;

	constructor(title: string = '', content: string = '', parentId?: string, path?: string, level?: number, isInFavorites?: boolean, listIds?: string[]) {
		// Validate title
		this.validateTitle(title);
		
		// Validate content
		this.validateContent(content);
		
		// Validate parentId
		if (parentId !== undefined) {
			this.validateParentId(parentId);
		}

		this._id = crypto.randomUUID();
		this._title = title || generateTimeBasedTitle();
		this._content = content;
		this._parentId = parentId;
		this._path = path || this.generatePath(parentId); // Generate path if not provided
		this._level = level ?? this.calculateLevel(parentId); // Calculate level if not provided
		this._isInFavorites = isInFavorites ?? false; // Default to false
		this._listIds = listIds ?? []; // Default to empty array
		this._createdAt = new Date();
		this._updatedAt = new Date();
	}

	// Validation methods
	private validateTitle(title: any): void {
		// Type validation
		if (title !== null && title !== undefined && typeof title !== 'string') {
			throw new DocumentValidationError('title', title);
		}

		// If title is provided, validate its content
		if (title && title.trim().length > 0) {
			const trimmedTitle = title.trim();
			
			// Length validation
			if (trimmedTitle.length === 0) {
				throw new DocumentValidationError('title', 'empty');
			}
			
			if (trimmedTitle.length > 200) {
				throw new DocumentValidationError('title', 'too long');
			}
			
			// Character validation - prevent control characters
			if (/[\x00-\x1F\x7F]/.test(trimmedTitle)) {
				throw new DocumentValidationError('title', 'invalid characters');
			}
		}
	}

	private validateContent(content: any): void {
		// Type validation
		if (content !== null && content !== undefined && typeof content !== 'string') {
			throw new DocumentValidationError('content', content);
		}

		// Content length validation (prevent extremely large documents)
		if (content && content.length > 1_000_000) { // 1MB limit
			throw new DocumentValidationError('content', 'too long');
		}
	}

	private validateParentId(parentId: any): void {
		// Type validation
		if (typeof parentId !== 'string') {
			throw new DocumentValidationError('parentId', parentId);
		}

		// Empty string validation
		if (parentId.trim().length === 0) {
			throw new DocumentValidationError('parentId', 'empty');
		}

		// UUID validation (basic format check)
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(parentId.trim())) {
			throw new DocumentValidationError('parentId', 'invalid format');
		}
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
	get id(): string {
		return this._id;
	}

	get title(): string {
		return this._title;
	}

	get content(): string {
		return this._content;
	}

	get createdAt(): Date {
		return this._createdAt;
	}

	get updatedAt(): Date {
		return this._updatedAt;
	}

	get parentId(): string | undefined {
		return this._parentId;
	}

	get path(): string {
		return this._path;
	}

	get level(): number {
		return this._level;
	}

	get isInFavorites(): boolean {
		return this._isInFavorites;
	}

	get listIds(): string[] {
		return [...this._listIds]; // Return copy to prevent external mutation
	}

	// Setters with automatic timestamp update and validation
	set title(value: string) {
		this.validateTitle(value);
		this._title = value || generateTimeBasedTitle();
		this._updatedAt = new Date();
	}

	set content(value: string) {
		this.validateContent(value);
		this._content = value;
		this._updatedAt = new Date();
	}

	set parentId(value: string | undefined) {
		if (value !== undefined) {
			this.validateParentId(value);
		}
		this._parentId = value;
		// Recalculate path and level when parent changes
		this._path = this.generatePath(value);
		this._level = this.calculateLevel(value);
		this._updatedAt = new Date();
	}

	set isInFavorites(value: boolean) {
		this._isInFavorites = value;
		this._updatedAt = new Date();
	}

	set listIds(value: string[]) {
		this._listIds = [...value]; // Store copy to prevent external mutation
		this._updatedAt = new Date();
	}

	// Methods
	updateContent(newContent: string): void {
		this.validateContent(newContent);
		this._content = newContent;
		this._updatedAt = new Date();
	}

	updateTitle(newTitle: string): void {
		this.validateTitle(newTitle);
		this._title = newTitle || generateTimeBasedTitle();
		this._updatedAt = new Date();
	}

	// List management methods for NoSQL optimization
	addToList(listId: string): void {
		if (!this._listIds.includes(listId)) {
			this._listIds.push(listId);
			this._updatedAt = new Date();
		}
	}

	removeFromList(listId: string): void {
		const index = this._listIds.indexOf(listId);
		if (index > -1) {
			this._listIds.splice(index, 1);
			this._updatedAt = new Date();
		}
	}

	isInList(listId: string): boolean {
		return this._listIds.includes(listId);
	}

	// Serialize for storage
	toJSON(): DocumentContent {
		return {
			id: this._id,
			title: this._title,
			content: this._content,
			parentId: this._parentId,
			path: this._path,
			level: this._level,
			isInFavorites: this._isInFavorites,
			listIds: [...this._listIds], // Return copy
			createdAt: this._createdAt,
			updatedAt: this._updatedAt
		};
	}

	// Create from JSON with validation
	static fromJSON(data: DocumentContent): Document {
		// Validate the input data structure
		if (!data || typeof data !== 'object') {
			throw new DocumentValidationError('data', data);
		}

		// Validate required fields
		if (!data.id || typeof data.id !== 'string') {
			throw new DocumentValidationError('id', data.id);
		}

		if (!data.title || typeof data.title !== 'string') {
			throw new DocumentValidationError('title', data.title);
		}

		if (typeof data.content !== 'string') {
			throw new DocumentValidationError('content', data.content);
		}

		if (!data.createdAt || !(data.createdAt instanceof Date)) {
			throw new DocumentValidationError('createdAt', data.createdAt);
		}

		if (!data.updatedAt || !(data.updatedAt instanceof Date)) {
			throw new DocumentValidationError('updatedAt', data.updatedAt);
		}

		// Validate optional parentId
		if (data.parentId !== undefined) {
			if (typeof data.parentId !== 'string') {
				throw new DocumentValidationError('parentId', data.parentId);
			}
		}

		// Handle backwards compatibility for new fields
		const path = data.path || undefined;
		const level = data.level ?? undefined;
		const isInFavorites = data.isInFavorites ?? false;
		const listIds = data.listIds ?? [];

		// Create document with validated data
		const doc = new Document(data.title, data.content, data.parentId, path, level, isInFavorites, listIds);
		doc._id = data.id;
		// IMPORTANT: Preserve the original title from JSON, don't regenerate it
		doc._title = data.title;
		
		// Handle backwards compatibility for new fields
		doc._path = data.path || doc.generatePath(data.parentId);
		doc._level = data.level ?? doc.calculateLevel(data.parentId);
		doc._isInFavorites = data.isInFavorites ?? false;
		doc._listIds = data.listIds ?? [];
		
		doc._createdAt = data.createdAt;
		doc._updatedAt = data.updatedAt;
		return doc;
	}

	// Clone document
	clone(): Document {
		return Document.fromJSON(this.toJSON());
	}
}
