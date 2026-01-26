import 'hono';

declare module 'hono' {
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
