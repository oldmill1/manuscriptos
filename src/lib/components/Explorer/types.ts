export interface ExplorerItem {
	id: string;
	name: string;
	icon: string;
	onClick?: (item: ExplorerItem, event: MouseEvent) => void;
	isFolder?: boolean;
	type?: 'list' | 'document';
	isTemp?: boolean;
	isEditing?: boolean;
	listType?: 'character' | 'manuscript' | null; // List type for determining special icons
}

export type ExplorerItemType = 'list' | 'document';

export interface ExplorerData {
	items: ExplorerItem[];
	type: ExplorerItemType;
	hasLoaded: boolean;
}
