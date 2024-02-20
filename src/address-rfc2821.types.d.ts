// types for address-rfc2821 which doesn't have its own published TS types
// based on docs

declare module 'address-rfc2821' {
  export class Address {
    /**
     * Creates a new address object. The address is set by providing the local
     * part and the domain part separately. The domain part will be encoded to
     * punycode if necessary.
     * @param user The local part of the email address
     * @param host The domain part of the email address
     */
    constructor(user: string, host: string);

    /**
     * Creates a new address object by parsing the given email address.
     * @param email The email address to parse
     */
    constructor(email: string);

    /**
     * The local part of the email address.
     */
    user: string;

    /**
     * The domain part of the email address, decoded if necessary to punycode.
     */
    host: string;

    /**
     * The domain part of the email address, unencoded and case-preserved.
     */
    original_host: string;

    /**
     * Returns a string representation of the email address in the
     * `user@host` format.
     * @param use_punycode If true, {@link host} is used for the domain part
     * instead of {@link original_host}.
     */
    format(use_punycode?: boolean): string;

    /**
     * Returns a string representation of the email address in the
     * `user@host` format.
     * @param newval Defaults to null. If not null, the email address is set to
     * the given value.
     * @param use_punycode If true, {@link host} is used for the domain part
     * instead of {@link original_host}.
     */
    address(newval?: string, use_punycode?: boolean): string;

    /**
     * Provides the email address in `user@host` format. Same as {@link format}.
     * @param use_punycode If true, {@link host} is used for the domain part
     * instead of {@link original_host}.
     */
    toString(use_punycode?: boolean): string;
  }
}
