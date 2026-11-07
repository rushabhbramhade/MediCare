declare namespace google {
  namespace maps {
    class Map {
      constructor(div: HTMLElement, opts?: MapOptions);
    }
    interface MapOptions {
      center: LatLng | LatLngLiteral;
      zoom?: number;
      scrollwheel?: boolean;
    }
    interface LatLngLiteral {
      lat: number;
      lng: number;
    }
    class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
      addListener(eventName: string, handler: () => void): void;
      setTitle(title: string): void;
    }
    interface MarkerOptions {
      position: LatLng | LatLngLiteral;
      map?: Map | null;
      title?: string;
      icon?: {
        path?: string;
        scale?: number;
        fillColor?: string;
        fillOpacity?: number;
        strokeColor?: string;
        strokeWeight?: number;
      };
    }
    const SymbolPath: { CIRCLE: string };
  }
}

interface Window {
  google?: typeof google.maps;
}
