declare module 'fabric' {
  export class Canvas {
    constructor(element: HTMLCanvasElement | string | null, options?: any);
    width?: number;
    height?: number;
    isDrawingMode: boolean;
    freeDrawingBrush: any;
    add(...objects: any[]): Canvas;
    remove(object: any): Canvas;
    setDimensions(dimensions: { width: number; height: number }): Canvas;
    renderAll(): Canvas;
    getActiveObject(): any;
    getActiveObjects(): any[];
    setActiveObject(object: any): Canvas;
    discardActiveObject(): Canvas;
    sendObjectToBack(object: any): Canvas;
    loadFromJSON(json: any): Promise<Canvas>;
    toJSON(): any;
    on(event: string, handler: Function): Canvas;
    dispose(): void;
  }

  export class IText {
    constructor(text: string, options?: any);
    type: string;
    set(key: string, value: any): IText;
  }

  export class Rect {
    constructor(options?: any);
  }

  export class Circle {
    constructor(options?: any);
  }

  export class Triangle {
    constructor(options?: any);
  }

  export class Polygon {
    constructor(points: Array<{ x: number; y: number }>, options?: any);
  }

  export class Path {
    constructor(path: string, options?: any);
  }

  export class PencilBrush {
    constructor(canvas: Canvas);
    color: string;
    width: number;
  }

  export class FabricImage {
    width?: number;
    height?: number;
    static fromURL(url: string, options?: any): Promise<FabricImage>;
    scale(value: number): FabricImage;
    set(options: any): FabricImage;
  }
}
