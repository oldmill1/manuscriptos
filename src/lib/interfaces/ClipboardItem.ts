import { Document } from '$lib/models/Document';
import type { FileSystemItem } from './FileSystemItem';

// Universal clipboard item interface for copy/paste operations
export interface ClipboardItem {
	id: string;
	type: 'document' | 'list';
	name: string;
	data: FileSystemItem; // Use unified interface instead of union type
	originalParentId?: string; // For cut operations
}
