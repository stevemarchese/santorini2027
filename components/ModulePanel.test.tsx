import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModulePanel from './ModulePanel';

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
}

describe('ModulePanel', () => {
  const originalInnerWidth = window.innerWidth;
  afterEach(() => {
    setViewportWidth(originalInnerWidth);
  });

  it('renders its children', () => {
    render(
      <ModulePanel>
        <p>Hello</p>
      </ModulePanel>
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('uses max-w-2xl with no responsive left offset when wide is true', () => {
    const { container } = render(
      <ModulePanel wide>
        <p>Hello</p>
      </ModulePanel>
    );
    const panel = container.querySelector('.animate-module-in') as HTMLElement;
    expect(panel.className).toContain('max-w-2xl');
    expect(panel.className).not.toContain('max-w-md');
    expect(panel.className).not.toContain('ml-[60px]');
  });

  it("keeps today's max-w-md and offset classes when wide is omitted", () => {
    const { container } = render(
      <ModulePanel>
        <p>Hello</p>
      </ModulePanel>
    );
    const panel = container.querySelector('.animate-module-in') as HTMLElement;
    expect(panel.className).toContain('max-w-md');
    expect(panel.className).toContain('sm:ml-[60px]');
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

  it('does not drag on mobile viewport widths, staying centered', () => {
    setViewportWidth(390);
    const { container } = render(
      <ModulePanel draggable>
        <p>Hello</p>
      </ModulePanel>
    );
    const panel = container.querySelector('.animate-module-in') as HTMLElement;
    fireEvent.pointerDown(panel, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(panel, { clientX: 50, clientY: 50, pointerId: 1 });
    expect(panel.style.transform).toBe('translate(0px, 0px)');
  });
});
