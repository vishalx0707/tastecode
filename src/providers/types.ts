export interface Provider {
  name: string;
  binary: string;
  installed(): Promise<boolean>;
  run(prompt: string): Promise<number>;
}
