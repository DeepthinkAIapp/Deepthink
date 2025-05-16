declare module 'react-sketch-canvas' {
  import { Component, RefObject } from 'react';

  interface ReactSketchCanvasProps {
    ref?: RefObject<any>;
    strokeWidth?: number;
    strokeColor?: string;
    backgroundImage?: string;
    exportWithBackgroundImage?: boolean;
    style?: React.CSSProperties;
    strokeStyle?: 'solid' | 'dashed' | 'dotted';
    paths?: any[];
    allowOnlyPointerType?: 'all' | 'mouse' | 'touch' | 'pen';
    canvasColor?: string;
    exportWithTransparentBackground?: boolean;
    preserveBackgroundImageAspectRatio?: boolean;
  }

  export class ReactSketchCanvas extends Component<ReactSketchCanvasProps> {
    clearCanvas(): void;
    undo(): void;
    redo(): void;
    exportImage(type: string): Promise<string>;
  }
} 