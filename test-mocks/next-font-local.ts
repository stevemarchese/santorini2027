export default function localFont(options: { variable?: string }) {
  return {
    className: 'mock-local-font',
    variable: options.variable ?? '--font-mock',
    style: { fontFamily: 'mock-local-font' },
  };
}
