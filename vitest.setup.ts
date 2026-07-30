import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom doesn't implement the Pointer Events API, so fireEvent.pointerDown/Move
// fall back to the generic Event constructor and silently drop clientX/clientY/pointerId;
// this minimal polyfill lets pointer-drag tests carry that data through.
if (typeof window !== 'undefined' && !window.PointerEvent) {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
    }
  }
  // @ts-expect-error - polyfilling a constructor jsdom doesn't provide
  window.PointerEvent = PointerEventPolyfill;
}

afterEach(() => {
  cleanup();
});
