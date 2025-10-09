declare global {
  interface Window {
    appApi: {
      ping: () => Promise<string>;
    };
  }
}
