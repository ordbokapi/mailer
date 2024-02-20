import { INJECTABLE_WATERMARK } from '@nestjs/common/constants';
import 'reflect-metadata';

export type ClassExports<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends new (...args: any[]) => any ? K : never;
}[keyof T];

export type ClassExportsArray<T extends Record<string, any>> = Array<
  T[ClassExports<T>]
>;

/**
 * Returns only the Nest-injectable classes from an export object. Uses Reflect
 * metadata to determine if a class is injectable.
 *
 * @example
 * ```ts
 * import { Module } from '@nestjs/common';
 * import { getInjectables } from '../utils';
 * import * as providers from '../providers';
 *
 * @Module({
 *   providers: getInjectables(providers),
 * })
 * export class AppModule {}
 * ```
 */
export function getInjectables<T extends Record<string, any>>(
  providers: T,
): ClassExportsArray<T> {
  // check for the INJECTABLE_WATERMARK to determine if a class is injectable
  return Object.values(providers).filter((provider) =>
    Reflect.getMetadata(INJECTABLE_WATERMARK, provider),
  );
}
