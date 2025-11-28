export interface ExplorerItem {
	id: string;
	name: string;
	icon: string;
	onClick?: (item: ExplorerItem, event: MouseEvent) => void;
	isFolder?: boolean;
	type?: 'list' | 'document' | 'character';
	isTemp?: boolean;
	isEditing?: boolean;
}

export type ExplorerItemType = 'list' | 'document' | 'character';

export interface ExplorerData {
	items: ExplorerItem[];
	type: ExplorerItemType;
	hasLoaded: boolean;
}
