// fork-add text-zoom

export const TEXT_ZOOM_STORAGE_KEY = 'maden.ui.textZoom';

// Steps, as a browser zooms
export const TEXT_ZOOM_STEPS = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];

export const parseTextZoom = (stored: string | null): number => {
  const zoom = Number(stored);

  return TEXT_ZOOM_STEPS.includes(zoom) ? zoom : 1;
};

export const zoomTextIn = (zoom: number): number =>
  TEXT_ZOOM_STEPS.find((step) => step > zoom) ?? zoom;

export const zoomTextOut = (zoom: number): number =>
  [...TEXT_ZOOM_STEPS].reverse().find((step) => step < zoom) ?? zoom;

// end-fork-add text-zoom
