export interface DocumentContent {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Document {
  private _id: string;
  private _title: string;
  private _content: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(title: string = '', content: string = '') {
    this._id = crypto.randomUUID();
    this._title = title;
    this._content = content;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  get content(): string {
    return this._content;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Setters with automatic timestamp update
  set title(value: string) {
    this._title = value;
    this._updatedAt = new Date();
  }

  set content(value: string) {
    this._content = value;
    this._updatedAt = new Date();
  }

  // Methods
  updateContent(newContent: string): void {
    this._content = newContent;
    this._updatedAt = new Date();
  }

  updateTitle(newTitle: string): void {
    this._title = newTitle;
    this._updatedAt = new Date();
  }

  // Serialize for storage
  toJSON(): DocumentContent {
    return {
      id: this._id,
      title: this._title,
      content: this._content,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }

  // Create from JSON
  static fromJSON(data: DocumentContent): Document {
    const doc = new Document(data.title, data.content);
    doc._id = data.id;
    doc._createdAt = new Date(data.createdAt);
    doc._updatedAt = new Date(data.updatedAt);
    return doc;
  }

  // Clone document
  clone(): Document {
    return Document.fromJSON(this.toJSON());
  }
}
