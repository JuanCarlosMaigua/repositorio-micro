import { Config } from '@jest/types'

const baseTestDir = '<rootDir>/test';

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
    reporters: [
      'default',
      [
        'jest-junit',
        {
          outputDirectory: 'report',
          outputName: 'report.xml',
        },
      ],
    ['jest-html-reporters', {
      publicPath: './report',
      filename: 'prueba_unitaria.html',
      pageTitle: "BANCO BOLIVARIANO - PRUEBA UNITARIA",
      expand: true
    }]
  ],
  coverageReporters: ['html'],
  coverageDirectory: './report/cobertura',
  collectCoverage: true,
};