// SPDX-FileCopyrightText: Copyright (C) 2024 Adaline Simonian
// SPDX-License-Identifier: AGPL-3.0-or-later
//
// This file is part of Ordbok API.
//
// Ordbok API is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero General Public License as published by the Free
// Software Foundation, either version 3 of the License, or (at your option) any
// later version.
//
// Ordbok API is distributed in the hope that it will be useful, but WITHOUT ANY
// WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
// A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
// details.
//
// You should have received a copy of the GNU Affero General Public License
// along with Ordbok API. If not, see <https://www.gnu.org/licenses/>.

import {
  INJECTABLE_WATERMARK,
  CONTROLLER_WATERMARK,
} from '@nestjs/common/constants';
import { DEV_ONLY_WATERMARK } from './dev-only';
import { isProd } from './is-prod';

export type ClassExports<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends new (...args: any[]) => any ? K : never;
}[keyof T];

export type ClassExportsArray<T extends Record<string, any>> = Array<
  T[ClassExports<T>]
>;

/**
 * An iterable collection of Nest.js injectable classes or controllers.
 */
export class NestClassCollection<T extends (new (...args: any[]) => any)[]> {
  readonly #providers: T;

  constructor(providers: Iterable<T[number]>) {
    this.#providers = Array.from(providers) as T;
  }

  /**
   * Creates a collection from the export object of only the exported injectable
   * classes.
   *
   * @example
   * ```ts
   * import { Module } from '@nestjs/common';
   * import { NestClassCollection } from './utils';
   * import * as providers from './providers';
   *
   * @Module({
   *   providers: NestClassCollection.fromInjectables(providers).toArray(),
   * })
   * export class AppModule {}
   * ```
   */
  static fromInjectables<T extends Record<string, any>>(
    providers: T,
  ): NestClassCollection<ClassExportsArray<T>> {
    return new NestClassCollection(
      Object.values(providers).filter((provider) =>
        Reflect.getMetadata(INJECTABLE_WATERMARK, provider),
      ),
    );
  }

  /**
   * Creates a collection from the export object of only the exported
   * controllers.
   *
   * @example
   * ```ts
   * import { Module } from '@nestjs/common';
   * import { NestClassCollection } from './utils';
   * import * as controllers from './controllers';
   *
   * @Module({
   *   controllers: NestClassCollection.fromControllers(controllers).toArray(),
   * })
   * export class AppModule {}
   * ```
   */
  static fromControllers<T extends Record<string, any>>(
    providers: T,
  ): NestClassCollection<ClassExportsArray<T>> {
    return new NestClassCollection(
      Object.values(providers).filter((provider) =>
        Reflect.getMetadata(CONTROLLER_WATERMARK, provider),
      ),
    );
  }

  /**
   * Returns an array of the providers in the collection.
   */
  toArray(): T {
    return this.#providers.slice() as T;
  }

  /**
   * Filters the provider array to only include classes suitable for the
   * current environment.
   *
   * In other words, if the current environment is production, then development-
   * environment-only classes will be filtered out.
   */
  forEnvironment(): NestClassCollection<T> {
    const prod = isProd();

    return new NestClassCollection(
      this.#providers.filter((provider) => {
        if (Reflect.getMetadata(DEV_ONLY_WATERMARK, provider)) {
          return !prod;
        }

        return true;
      }) as T,
    );
  }

  /**
   * Filters the given providers out.
   */
  except<E extends T>(
    ...providers: E
  ): NestClassCollection<Exclude<T[number], E[number]>[]> {
    return new NestClassCollection(
      this.#providers.filter(
        (provider) => !providers.includes(provider),
      ) as Exclude<T[number], E[number]>[],
    );
  }

  /**
   * Concatenates the given collection of providers to the current collection.
   */
  concat<C extends (new (...args: any[]) => any)[]>(
    collection: NestClassCollection<C> | C,
  ): NestClassCollection<[...T, ...C]> {
    return new NestClassCollection<[...T, ...C]>(
      this.#providers.concat(
        collection instanceof NestClassCollection
          ? collection.#providers
          : collection,
      ),
    );
  }

  /**
   * Iterates over the providers.
   */
  *[Symbol.iterator](): IterableIterator<T[number]> {
    for (const provider of this.#providers) {
      yield provider;
    }
  }
}
