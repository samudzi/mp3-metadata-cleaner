declare module 'browser-id3-writer' {
  export interface ID3WriterFrameAPIC {
    type: number;
    data: ArrayBuffer | Uint8Array;
    description: string;
    mimeType: string;
  }

  export interface ID3WriterFrameUSLT {
    description: string;
    lyrics: string;
    language?: string;
  }

  export class ID3Writer {
    constructor(buffer: ArrayBuffer);
    setFrame(frameName: string, value: any): this;
    addTag(): this;
    getBlob(): Blob;
    getURL(): string;
    arrayBuffer: ArrayBuffer;
  }

  export default ID3Writer;
}
