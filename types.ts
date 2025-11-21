export interface PhotoData {
  id: string;
  imageData: string;
  timestamp: string; // Formatted Beijing time
  rawTimestamp: number;
  caption: string;
  x: number;
  y: number;
  rotation: number;
}

export interface CameraProps {
  onCapture: (imageData: string) => void;
}

export interface PhotoProps {
  data: PhotoData;
  onUpdateCaption: (id: string, newCaption: string) => void;
  onDelete: (id: string) => void;
  zIndex: number;
  onDragStart: () => void;
}