import { parseHostMessage, type HostMessage, type WebviewMessage } from '../core/protocol';
export type WebviewApi = Readonly<{
  getState(): unknown;
  setState(state: Readonly<{ sleeping: boolean }>): void;
  postMessage(message: WebviewMessage): void;
}>;
export function restoreSleeping(value: unknown): boolean {
  return typeof value === 'object' && value !== null && 'sleeping' in value && value.sleeping === true;
}
export function connectMessaging(api: WebviewApi, receive: (message: HostMessage) => void): () => void {
  const listener = (event: MessageEvent<unknown>) => {
    const message = parseHostMessage(event.data);
    if (message) receive(message);
  };
  window.addEventListener('message', listener);
  api.postMessage({ v: 1, type: 'ready' });
  return () => window.removeEventListener('message', listener);
}
