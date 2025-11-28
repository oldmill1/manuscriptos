import { generateTimeBasedTitle } from '$lib/utils/timeTitle';
import { DocumentValidationError } from '$lib/errors/DatabaseErrors';

export interface CharacterContent {
	id: string;
	name: string;
	dob?: string | null;  // Date of birth as string, optional
	dod?: string | null;  // Date of death as string, optional
	parentId?: string;    // Parent folder ID for hierarchy
	path: string;         // Computed full path like "/root/folder/subfolder"
	level: number;        // Hierarchy depth (0 = root, 1 = child of root, etc.)
	createdAt: Date;
	updatedAt: Date;
}

export class Character {
	private _id: string;
	private _name: string;
	private _dob?: string | null;
	private _dod?: string | null;
	private _parentId?: string;
	private _path: string;
	private _level: number;
	private _createdAt: Date;
	private _updatedAt: Date;

	constructor(name: string = '', dob?: string | null, dod?: string | null, parentId?: string, path?: string, level?: number) {
		// Validate name
		this.validateName(name);
		
		// Validate dates if provided
		if (dob !== undefined && dob !== null) {
			this.validateDate(dob, 'dob');
		}
		
		if (dod !== undefined && dod !== null) {
			this.validateDate(dod, 'dod');
		}

		// Validate parentId
		if (parentId !== undefined) {
			this.validateParentId(parentId);
		}

		this._id = crypto.randomUUID();
		this._name = name || generateTimeBasedTitle();
		this._dob = dob ?? null;
		this._dod = dod ?? null;
		this._parentId = parentId;
		this._path = path || this.generatePath(parentId); // Generate path if not provided
		this._level = level ?? this.calculateLevel(parentId); // Calculate level if not provided
		this._createdAt = new Date();
		this._updatedAt = new Date();
	}

	// Validation methods
	private validateName(name: any): void {
		// Type validation
		if (name !== null && name !== undefined && typeof name !== 'string') {
			throw new DocumentValidationError('name', name);
		}

		// If name is provided, validate its content
		if (name && name.trim().length > 0) {
			const trimmedName = name.trim();
			
			// Length validation
			if (trimmedName.length === 0) {
				throw new DocumentValidationError('name', 'empty');
			}
			
			if (trimmedName.length > 200) {
				throw new DocumentValidationError('name', 'too long');
			}
			
			// Character validation - prevent control characters
			if (/[\x00-\x1F\x7F]/.test(trimmedName)) {
				throw new DocumentValidationError('name', 'invalid characters');
			}
		}
	}

	private validateDate(date: any, fieldName: string): void {
		// Type validation
		if (typeof date !== 'string') {
			throw new DocumentValidationError(fieldName, date);
		}

		// Empty string validation
		if (date.trim().length === 0) {
			throw new DocumentValidationError(fieldName, 'empty');
		}

		// Basic date format validation - allow flexible formats like "1990", "circa 1800s", "Unknown"
		// For now, just ensure it's a reasonable string without control characters
		if (/[\x00-\x1F\x7F]/.test(date.trim())) {
			throw new DocumentValidationError(fieldName, 'invalid characters');
		}

		// Length validation
		if (date.trim().length > 100) {
			throw new DocumentValidationError(fieldName, 'too long');
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

	get name(): string {
		return this._name;
	}

	get dob(): string | null | undefined {
		return this._dob;
	}

	get dod(): string | null | undefined {
		return this._dod;
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

	// Setters with automatic timestamp update and validation
	set name(value: string) {
		this.validateName(value);
		this._name = value || generateTimeBasedTitle();
		this._updatedAt = new Date();
	}

	set dob(value: string | null | undefined) {
		if (value !== undefined && value !== null) {
			this.validateDate(value, 'dob');
		}
		this._dob = value ?? null;
		this._updatedAt = new Date();
	}

	set dod(value: string | null | undefined) {
		if (value !== undefined && value !== null) {
			this.validateDate(value, 'dod');
		}
		this._dod = value ?? null;
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

	// Methods
	updateName(newName: string): void {
		this.validateName(newName);
		this._name = newName || generateTimeBasedTitle();
		this._updatedAt = new Date();
	}

	updateDates(dob?: string | null, dod?: string | null): void {
		if (dob !== undefined && dob !== null) {
			this.validateDate(dob, 'dob');
		}
		if (dod !== undefined && dod !== null) {
			this.validateDate(dod, 'dod');
		}
		this._dob = dob ?? null;
		this._dod = dod ?? null;
		this._updatedAt = new Date();
	}

	// Serialize for storage
	toJSON(): CharacterContent {
		return {
			id: this._id,
			name: this._name,
			dob: this._dob,
			dod: this._dod,
			parentId: this._parentId,
			path: this._path,
			level: this._level,
			createdAt: this._createdAt,
			updatedAt: this._updatedAt
		};
	}

	// Create from JSON with validation
	static fromJSON(data: CharacterContent): Character {
		// Validate the input data structure
		if (!data || typeof data !== 'object') {
			throw new DocumentValidationError('data', data);
		}

		// Validate required fields
		if (!data.id || typeof data.id !== 'string') {
			throw new DocumentValidationError('id', data.id);
		}

		if (!data.name || typeof data.name !== 'string') {
			throw new DocumentValidationError('name', data.name);
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

		// Validate optional date fields
		if (data.dob !== undefined && data.dob !== null) {
			if (typeof data.dob !== 'string') {
				throw new DocumentValidationError('dob', data.dob);
			}
		}

		if (data.dod !== undefined && data.dod !== null) {
			if (typeof data.dod !== 'string') {
				throw new DocumentValidationError('dod', data.dod);
			}
		}

		// Handle backwards compatibility for new fields
		const path = data.path || undefined;
		const level = data.level ?? undefined;

		// Create character with validated data
		const character = new Character(data.name, data.dob, data.dod, data.parentId, path, level);
		character._id = data.id;
		// IMPORTANT: Preserve the original name from JSON, don't regenerate it
		character._name = data.name;
		character._dob = data.dob;
		character._dod = data.dod;
		
		// Handle backwards compatibility for new fields
		character._path = data.path || character.generatePath(data.parentId);
		character._level = data.level ?? character.calculateLevel(data.parentId);
		
		character._createdAt = data.createdAt;
		character._updatedAt = data.updatedAt;
		return character;
	}

	// Clone character
	clone(): Character {
		return Character.fromJSON(this.toJSON());
	}
}
