// Unified base interface for all file system items (documents, lists, folders, etc.)
export interface FileSystemItem {
	id: string;
	name: string;
	parentId?: string;
	path: string;
	level: number;
	createdAt: Date;
	updatedAt: Date;
}
