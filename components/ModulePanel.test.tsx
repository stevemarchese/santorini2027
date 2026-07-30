import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModulePanel from './ModulePanel';

describe('ModulePanel', () => {
  it('renders its children', () => {
    render(
      <ModulePanel>
        <p>Hello</p>
      </ModulePanel>
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('does not move when draggable is false, even if pointer events fire', () => {
    const { container } = render(
      <ModulePanel>
        <p>Hello</p>
      </ModulePanel>
    );
    const panel = container.querySelector('.animate-module-in') as HTMLElement;
    fireEvent.pointerDown(panel, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(panel, { clientX: 50, clientY: 50, pointerId: 1 });
    expect(panel.style.transform).toBe('');
  });

  it('moves within bounds when draggable is true', () => {
    const { container } = render(
      <ModulePanel draggable>
        <p>Hello</p>
      </ModulePanel>
    );
    const panel = container.querySelector('.animate-module-in') as HTMLElement;
    fireEvent.pointerDown(panel, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(panel, { clientX: 40, clientY: 20, pointerId: 1 });
    expect(panel.style.transform).toBe('translate(40px, 20px)');
  });

  it('clamps the offset so the panel cannot be dragged fully off-screen', () => {
    const { container } = render(
      <ModulePanel draggable>
        <p>Hello</p>
      </ModulePanel>
    );
    const panel = container.querySelector('.animate-module-in') as HTMLElement;
    // jsdom's default viewport is 1024x768, so maxX = 1024/2 - 80 = 432, maxY = 768/2 - 80 = 304.
    // Drag far past those limits and confirm the offset is clamped, not raw.
    fireEvent.pointerDown(panel, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(panel, { clientX: 2000, clientY: 2000, pointerId: 1 });
    expect(panel.style.transform).toBe('translate(432px, 304px)');
  });

  it('does not start a drag when pointerdown originates on an interactive child', () => {
    render(
      <ModulePanel draggable>
        <button type="button">Click me</button>
      </ModulePanel>
    );
    const panel = document.querySelector('.animate-module-in') as HTMLElement;
    const button = screen.getByRole('button', { name: 'Click me' });
    fireEvent.pointerDown(button, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(panel, { clientX: 50, clientY: 50, pointerId: 1 });
    // draggable=true always renders a transform from offset state, so the untouched
    // baseline is 'translate(0px, 0px)' rather than ''. What matters is that the
    // 50,50 pointermove had no effect, proving the guard clause blocked the drag.
    expect(panel.style.transform).toBe('translate(0px, 0px)');
  });
});
