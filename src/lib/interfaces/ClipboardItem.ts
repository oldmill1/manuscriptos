import { Document } from '$lib/models/Document';
import { List } from '$lib/models/List';

export interface ClipboardItem {
	id: string;
	type: 'document' | 'list';
	name: string;
	data: Document | List; // Full object for copying
	originalParentId?: string; // For cut operations
}
