/*
  Ambient module declarations for compiled common helpers.  These
  declarations re‑export the corresponding TypeScript types from the
  source files so that the compiler can find them when importing
  compiled JavaScript from the common package.  Without these
  declarations TypeScript reports that the modules have an implicit
  'any' type.
*/
declare module '../../common/dist/key-utils.js' {
  export * from '../../common/src/key-utils';
}
declare module '../../common/dist/zcap-utils.js' {
  export * from '../../common/src/zcap-utils';
}
declare module '../../common/dist/logger.js' {
  export * from '../../common/src/logger';
}