import 'hono';

declare module 'hono' {
  interface ContextVariableMap {
    lang: string;
  }

  type ContextRenderer = (
    content: string | Promise<string> | JSX.Element,
    props?: { title?: string },
  ) => Response | Promise<Response>;
}

// HonoX Client-Side Directives
declare module 'hono/jsx' {
  namespace JSX {
    interface IntrinsicAttributes {
      '$client:load'?: boolean;
      '$client:visible'?: boolean;
      '$client:idle'?: boolean;
      '$client:media'?: string;
      '$client:only'?: boolean;
    }
  }
}
