import * as fs from "fs";
import * as path from "path";

export const SAFE_PROXY_FACTORY_ADDRESS =
  "0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2";
export const SAFE_SINGLETON_ADDRESS =
  "0x3E5c63644E683549055b9Be8653de26E0B4CD36E";
export const SAFE_VERSION = "1.3.0";
export const SAFE_THRESHOLD = 1;

export const MUMBAI_RPC_URL = "https://rpc-mumbai.maticvigil.com/";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const TARGET_TOPIC =
  "0x141df868a6331af528e38c83b7aa03edc19be66e37ae67f9285bf4f8e3c6a1a8";

export function loadABI(filePath: string): any[] {
  const absolutePath = path.resolve(__dirname, filePath);
  const abiData = fs.readFileSync(absolutePath, "utf-8");
  return JSON.parse(abiData);
}

export function randomIntFromInterval(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchData(url: string) {
  const res = await fetch(url);
  const data = await res.json();
  return data;
}
