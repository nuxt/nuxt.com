module.exports = {
  root: true,
  extends: ['@nuxt/eslint-config'],
  rules: {
    semi: ['error', 'never'],
    quotes: ['error', 'single'],
    indent: ['error', 2],
    'quote-props': ['error', 'as-needed'],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'comma-dangle': ['error', 'never'],
    'space-before-function-paren': ['error', 'always'],
    'vue/no-v-html': 0,
    'vue/multi-word-component-names': 0,
    'vue/max-attributes-per-line': ['error', { singleline: { max: 5 } }]
  }
}
