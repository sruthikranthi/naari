import nextConfig from 'eslint-config-next';

export default [
  ...nextConfig,
  {
    rules: {
      'react-hooks/use-memo': 'off',
    },
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
  },
];

