declare module 'react-color' {
  import { Component } from 'react';

  interface ColorResult {
    hex: string;
    rgb: {
      r: number;
      g: number;
      b: number;
      a?: number;
    };
    hsl: {
      h: number;
      s: number;
      l: number;
      a?: number;
    };
  }

  interface SketchPickerProps {
    color?: string | ColorResult;
    onChange?: (color: ColorResult) => void;
    onChangeComplete?: (color: ColorResult) => void;
    presetColors?: string[];
    width?: string;
    styles?: any;
    className?: string;
  }

  export class SketchPicker extends Component<SketchPickerProps> {}
} 