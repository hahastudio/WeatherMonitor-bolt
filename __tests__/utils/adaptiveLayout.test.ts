import { adaptiveLayout } from '../../hooks/useAdaptiveLayout';

describe('available window layout', () => {
  it.each([320, 360, 390])(
    'keeps floating phone navigation at %s dp',
    (width) => {
      expect(adaptiveLayout(width, 800)).toMatchObject({
        rail: false,
        columns: false,
      });
    },
  );
  it('uses a focused pane in intermediate windows and readable columns when they fit', () => {
    expect(adaptiveLayout(600, 800)).toMatchObject({
      rail: true,
      columns: false,
    });
    [720, 840, 1024].forEach((width) =>
      expect(adaptiveLayout(width, 800).columns).toBe(true),
    );
  });
  it('falls back for large fonts or short landscape windows', () => {
    expect(adaptiveLayout(840, 800, 1.5).columns).toBe(false);
    expect(adaptiveLayout(840, 360).columns).toBe(false);
    expect(adaptiveLayout(1024, 800, 1.5).columns).toBe(true);
  });
});
