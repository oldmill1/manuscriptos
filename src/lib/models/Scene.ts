import { generateTimeBasedTitle } from '$lib/utils/timeTitle';
import { DocumentValidationError } from '$lib/errors/DatabaseErrors';

export interface SceneContent {
	id: string;
	title: string;      // Scene title/name for identification
	content: string;    // The actual scene content (like document.text)
	characterId?: string; // Reference to character this scene is associated with
	// Future attachment fields can be added here:
	// storyId?: string;  // For future story association
	// locationId?: string; // For future location association
	createdAt: Date;
	updatedAt: Date;
}

export class Scene {
	private _id: string;
	private _title: string;
	private _content: string;
	private _characterId?: string;
	private _createdAt: Date;
	private _updatedAt: Date;

	constructor(title: string = '', content: string = '', characterId?: string) {
		// Validate title
		this.validateTitle(title);
		
		// Validate content
		this.validateContent(content);
		
		// Validate characterId if provided
		if (characterId !== undefined) {
			this.validateCharacterId(characterId);
		}

		this._id = crypto.randomUUID();
		this._title = title || generateTimeBasedTitle();
		this._content = content;
		this._characterId = characterId;
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

		// Content length validation (prevent extremely large scenes)
		if (content && content.length > 1_000_000) { // 1MB limit
			throw new DocumentValidationError('content', 'too long');
		}
	}

	private validateCharacterId(characterId: any): void {
		// Type validation
		if (typeof characterId !== 'string') {
			throw new DocumentValidationError('characterId', characterId);
		}

		// Empty string validation
		if (characterId.trim().length === 0) {
			throw new DocumentValidationError('characterId', 'empty');
		}

		// UUID validation (basic format check)
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		if (!uuidRegex.test(characterId.trim())) {
			throw new DocumentValidationError('characterId', 'invalid format');
		}
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

	get characterId(): string | undefined {
		return this._characterId;
	}

	get createdAt(): Date {
		return this._createdAt;
	}

	get updatedAt(): Date {
		return this._updatedAt;
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

	set characterId(value: string | undefined) {
		if (value !== undefined) {
			this.validateCharacterId(value);
		}
		this._characterId = value;
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

	// Attachment management
	attachToCharacter(characterId: string): void {
		this.validateCharacterId(characterId);
		this._characterId = characterId;
		this._updatedAt = new Date();
	}

	detachFromCharacter(): void {
		this._characterId = undefined;
		this._updatedAt = new Date();
	}

	isAttachedToCharacter(characterId: string): boolean {
		return this._characterId === characterId;
	}

	// Serialize for storage
	toJSON(): SceneContent {
		return {
			id: this._id,
			title: this._title,
			content: this._content,
			characterId: this._characterId,
			createdAt: this._createdAt,
			updatedAt: this._updatedAt
		};
	}

	// Create from JSON with validation
	static fromJSON(data: SceneContent): Scene {
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

		// Validate optional characterId
		if (data.characterId !== undefined) {
			if (typeof data.characterId !== 'string') {
				throw new DocumentValidationError('characterId', data.characterId);
			}
		}

		// Create scene with validated data
		const scene = new Scene(data.title, data.content, data.characterId);
		scene._id = data.id;
		// IMPORTANT: Preserve the original title from JSON, don't regenerate it
		scene._title = data.title;
		scene._content = data.content;
		scene._characterId = data.characterId;
		scene._createdAt = data.createdAt;
		scene._updatedAt = data.updatedAt;
		return scene;
	}

	// Clone scene
	clone(): Scene {
		return Scene.fromJSON(this.toJSON());
	}
}
