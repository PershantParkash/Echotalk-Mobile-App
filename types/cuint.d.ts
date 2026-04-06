declare module "cuint" {
  export const UINT32: (...args: unknown[]) => {
    and: (other: unknown) => { toNumber: () => number };
  };
}
