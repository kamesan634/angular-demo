/**
 * Jest 測試設定
 */
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/', '<rootDir>/e2e/'],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'lcov', 'text-summary'],
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.module.ts',
    '!src/app/**/*.routes.ts',
    '!src/main.ts',
  ],
  moduleNameMapper: {
    '@core/(.*)': '<rootDir>/src/app/core/$1',
    '@shared/(.*)': '<rootDir>/src/app/shared/$1',
    '@features/(.*)': '<rootDir>/src/app/features/$1',
    '@layout/(.*)': '<rootDir>/src/app/layout/$1',
    '@env/(.*)': '<rootDir>/src/environments/$1',
  },
  testMatch: ['**/*.spec.ts'],
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|@angular|@swimlane|primeng|primeicons)'],
};
