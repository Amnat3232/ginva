declare module "chalk" {
  type ChalkFunction = (str: string | any) => any;

  interface Chalk {
    (str: string | any): string;
    red: ChalkFunction;
    green: ChalkFunction;
    yellow: ChalkFunction;
    blue: ChalkFunction;
    magenta: ChalkFunction;
    cyan: ChalkFunction;
    white: ChalkFunction;
    gray: ChalkFunction;
    bold: Chalk;
    dim: ChalkFunction;
    italic: ChalkFunction;
    underline: ChalkFunction;
    bgRed: ChalkFunction;
    bgGreen: ChalkFunction;
    bgYellow: ChalkFunction;
    bgBlue: ChalkFunction;
    bgMagenta: ChalkFunction;
    bgCyan: ChalkFunction;
    redBright: ChalkFunction;
    greenBright: ChalkFunction;
    yellowBright: ChalkFunction;
    blueBright: ChalkFunction;
    magentaBright: ChalkFunction;
    cyanBright: ChalkFunction;
  }

  const chalk: Chalk;
  export default chalk;
}
