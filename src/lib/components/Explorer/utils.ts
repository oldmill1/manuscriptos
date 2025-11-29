import { List } from '$lib/models/List';
import { Document } from '$lib/models/Document';
import type { ExplorerItem, ExplorerData } from './types';

export function convertListsToExplorerItems(
	lists: List[], 
	onListClick?: (list: List, event: MouseEvent) => void
): ExplorerItem[] {
	return lists.map(list => ({
		id: list.id,
		name: list.name || 'Untitled List',
		icon: '/icons/folder.png',
		isFolder: true,
		onClick: onListClick ? (item: ExplorerItem, event: MouseEvent) => {
			const originalList = lists.find(l => l.id === item.id);
			if (originalList) onListClick(originalList, event);
		} : undefined
	}));
}

export function convertDocumentsToExplorerItems(
	documents: Document[], 
	onDocumentClick?: (doc: Document, event: MouseEvent) => void
): ExplorerItem[] {
	return documents.map(doc => ({
		id: doc.id,
		name: doc.title || 'Untitled Document',
		icon: '/icons/new.png',
		isFolder: false,
		onClick: onDocumentClick ? (item: ExplorerItem, event: MouseEvent) => {
			const originalDoc = documents.find(d => d.id === item.id);
			if (originalDoc) onDocumentClick(originalDoc, event);
		} : undefined
	}));
}


export function createExplorerData(
	items: ExplorerItem[], 
	type: 'list' | 'document', 
	hasLoaded: boolean = true
): ExplorerData {
	return {
		items,
		type,
		hasLoaded
	};
}
