export interface IDatabase {
	create(data: any): Promise<any>;
	read(id: string): Promise<any>;
	update(data: any): Promise<any>;
	delete(id: string): Promise<boolean>;
	list(): Promise<any[]>;
	getByParentId(parentId?: string): Promise<any[]>;
	search(query: string): Promise<any[]>;
	getInfo(): Promise<any>;
	destroy(): Promise<void>;
}
