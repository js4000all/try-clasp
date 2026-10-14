function hello(): void {
  console.log("Hello from GAS!");
}

(globalThis as any).hello = hello;
