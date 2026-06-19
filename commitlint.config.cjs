module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [1, 'always', 100],
    'body-max-line-length': [0, 'always', Infinity],
    'body-leading-blank': [1, 'always'],
  },
};
