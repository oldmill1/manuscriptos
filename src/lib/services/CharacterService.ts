import { Character, type CharacterContent } from '$lib/models/Character';
import type { IDatabase } from '$lib/interfaces/IDatabase';
import { 
	DocumentNotFoundError, 
	DocumentCreationError, 
	DocumentUpdateError, 
	DocumentDeleteError, 
	DocumentConflictError,
	DocumentValidationError,
	DatabaseError 
} from '$lib/errors/DatabaseErrors';

interface DatabaseCharacter {
	_id: string;
	_rev?: string;
	type: "character";
	name: string;
	dob?: string | null;
	dod?: string | null;
	parentId?: string;
	path: string;
	level: number;
	createdAt: string;
	updatedAt: string;
}

export class CharacterService {
	private database: IDatabase;

	constructor(database: IDatabase) {
		this.database = database;
	}

	// Create a new character
	async create(character: Character): Promise<Character> {
		try {
			// Validate character
			if (!character.name?.trim()) {
				throw new DocumentValidationError('name', character.name);
			}

			const characterData = character.toJSON();
			console.log('CharacterService.create - characterData:', characterData);
			
			if (!characterData.id) {
				throw new DocumentValidationError('id', characterData.id);
			}
			
			const databaseCharacter: DatabaseCharacter = {
				_id: characterData.id,
				type: "character",
				name: characterData.name,
				dob: characterData.dob,
				dod: characterData.dod,
				parentId: characterData.parentId,
				path: characterData.path,
				level: characterData.level,
				createdAt: characterData.createdAt.toISOString(),
				updatedAt: characterData.updatedAt.toISOString()
			};
			console.log('CharacterService.create - databaseCharacter:', databaseCharacter);
			const result = await this.database.create(databaseCharacter);

			// Return a new character instance with the saved data
			return Character.fromJSON({
				id: result.id || result._id,
				name: characterData.name,
				dob: characterData.dob,
				dod: characterData.dod,
				parentId: characterData.parentId,
				path: characterData.path,
				level: characterData.level,
				createdAt: characterData.createdAt,
				updatedAt: characterData.updatedAt
			});
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error; // Re-throw our custom errors
			}
			throw new DocumentCreationError(character.name || 'unnamed', error as Error);
		}
	}

	// Read a character by ID
	async read(id: string): Promise<Character | null> {
		try {
			if (!id?.trim()) {
				throw new DocumentValidationError('id', id);
			}

			const result = await this.database.read(id);
			if (!result) return null;
			
			// Handle backwards compatibility - old characters might not have type field
			if (!result.type) {
				result.type = "character"; // Assume it's a character if no type specified
			}
			
			// Only process characters (skip documents/lists that might be in same database)
			if (result.type !== "character") {
				return null;
			}
			
			// Map database result to CharacterContent format
			const characterContent = {
				id: result._id || result.id,
				name: result.name,
				dob: result.dob,
				dod: result.dod,
				parentId: result.parentId,
				path: result.path || `/${result._id || result.id}`, // Default path if missing
				level: result.level ?? (result.parentId ? 1 : 0), // Calculate level if missing
				createdAt: new Date(result.createdAt),
				updatedAt: new Date(result.updatedAt)
			};
			
			return Character.fromJSON(characterContent);
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error; // Re-throw our custom errors
			}
			throw new DocumentNotFoundError(id, error as Error);
		}
	}

	// Update an existing character
	async update(character: Character): Promise<Character> {
		try {
			// Validate character
			if (!character.id?.trim()) {
				throw new DocumentValidationError('id', character.id);
			}
			if (!character.name?.trim()) {
				throw new DocumentValidationError('name', character.name);
			}

			const characterData = character.toJSON();
			const updateData: DatabaseCharacter = {
				_id: characterData.id,
				type: "character",
				name: characterData.name,
				dob: characterData.dob,
				dod: characterData.dod,
				parentId: characterData.parentId,
				path: characterData.path,
				level: characterData.level,
				createdAt: characterData.createdAt.toISOString(),
				updatedAt: characterData.updatedAt.toISOString()
			};
			
			const result = await this.database.update(updateData);

			return Character.fromJSON({
				id: result.id || result._id,
				name: characterData.name,
				dob: characterData.dob,
				dod: characterData.dod,
				parentId: characterData.parentId,
				path: characterData.path,
				level: characterData.level,
				createdAt: characterData.createdAt,
				updatedAt: characterData.updatedAt
			});
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error; // Re-throw our custom errors
			}
			throw new DocumentUpdateError(character.id, error as Error);
		}
	}

	// Delete a character by ID
	async delete(id: string): Promise<boolean> {
		try {
			if (!id?.trim()) {
				throw new DocumentValidationError('id', id);
			}
			return await this.database.delete(id);
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error; // Re-throw our custom errors
			}
			throw new DocumentDeleteError(id, error as Error);
		}
	}

	// List all characters
	async list(): Promise<Character[]> {
		try {
			const results = await this.database.list();

			return results
				.filter((row: any) => {
					// Use consistent type field
					return row.type === 'character';
				})
				.map((row: any) => {
					return Character.fromJSON({
						id: row._id || row.id,
						name: row.name,
						dob: row.dob,
						dod: row.dod,
						parentId: row.parentId,
						path: row.path || `/${row._id || row.id}`, // Default path if missing
						level: row.level ?? (row.parentId ? 1 : 0), // Calculate level if missing
						createdAt: new Date(row.createdAt),
						updatedAt: new Date(row.updatedAt)
					});
				});
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error; // Re-throw our custom errors
			}
			throw new DatabaseError('Failed to list characters', error as Error);
		}
	}

	// Get characters by parent ID (for nested folders)
	async getByParentId(parentId?: string): Promise<Character[]> {
		try {
			const results = await this.database.getByParentId(parentId);
			
			return results
				.filter((row: any) => {
					// Use consistent type field
					return row.type === 'character';
				})
				.map((row: any) => {
					console.log('CharacterService.getByParentId - raw row from database:', row);
					try {
						const characterData = {
							id: row._id || row.id,
							name: row.name,
							dob: row.dob,
							dod: row.dod,
							parentId: row.parentId,
							path: row.path || `/${row._id || row.id}`, // Default path if missing
							level: row.level ?? (row.parentId ? 1 : 0), // Calculate level if missing
							createdAt: new Date(row.createdAt),
							updatedAt: new Date(row.updatedAt)
						};
						console.log('CharacterService.getByParentId - characterData before fromJSON:', characterData);
						return Character.fromJSON(characterData);
					} catch (validationError) {
						// Skip invalid characters (e.g., those with undefined names)
						console.warn('Skipping invalid character:', row._id || row.id, validationError);
						return null;
					}
				})
				.filter((character: Character | null): character is Character => {
					return character !== null;
				});
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error; // Re-throw our custom errors
			}
			throw new DatabaseError('Failed to get characters by parent ID', error as Error);
		}
	}

	// Search characters by name
	async search(query: string): Promise<Character[]> {
		try {
			if (!query?.trim()) {
				return [];
			}

			const results = await this.database.search(query);
			const lowerQuery = query.toLowerCase();

			return results.filter(
				(character: any) =>
					character.name.toLowerCase().includes(lowerQuery)
			).map((character: any) => {
				return Character.fromJSON({
					id: character._id || character.id,
					name: character.name,
					dob: character.dob,
					dod: character.dod,
					parentId: character.parentId,
					path: character.path || `/${character._id || character.id}`, // Default path if missing
					level: character.level ?? (character.parentId ? 1 : 0), // Calculate level if missing
					createdAt: new Date(character.createdAt),
					updatedAt: new Date(character.updatedAt)
				});
			});
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error; // Re-throw our custom errors
			}
			throw new DatabaseError('Failed to search characters', error as Error);
		}
	}

	// Get database info
	async getInfo(): Promise<any> {
		try {
			return await this.database.getInfo();
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error; // Re-throw our custom errors
			}
			throw new DatabaseError('Failed to get database info', error as Error);
		}
	}

	// Destroy the database
	async destroy(): Promise<void> {
		try {
			await this.database.destroy();
		} catch (error) {
			if (error instanceof DatabaseError) {
				throw error; // Re-throw our custom errors
			}
			throw new DatabaseError('Failed to destroy database', error as Error);
		}
	}
}

// Note: CharacterService should be instantiated with a database implementation
// Use: const characterService = new CharacterService(new PouchDatabase('manuscriptOS_DB'));
