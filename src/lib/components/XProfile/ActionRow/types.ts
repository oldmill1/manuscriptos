export interface ActionRowProps {
	children?: any;
	action?: () => void;
	actionText?: string;
	disabled?: boolean;
	loading?: boolean;
}
