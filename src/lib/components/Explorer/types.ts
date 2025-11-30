export interface ExplorerItem {
	id: string;
	name: string;
	icon: string;
	onClick?: (item: ExplorerItem, event: MouseEvent) => void;
	isFolder?: boolean;
	type?: 'list' | 'document';
	isTemp?: boolean;
	isEditing?: boolean;
	listType?: 'character' | 'manuscript' | 'scene' | null; // List type for determining special icons
	parentId?: string | undefined; // Parent folder context for temporary items
}

export type ExplorerItemType = 'list' | 'document';

export interface ExplorerData {
	items: ExplorerItem[];
	type: ExplorerItemType;
	hasLoaded: boolean;
}
