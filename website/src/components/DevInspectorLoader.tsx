'use client';

import dynamic from 'next/dynamic';

// next/dynamic with ssr:false must live in a Client Component.
// This wrapper is imported by layout.tsx (a Server Component) so the
// dynamic() call is valid and DevInspector's browser-only code is never
// server-rendered or included in the SSR pass.
const DevInspector = dynamic(() => import('./DevInspector'), { ssr: false });

export default DevInspector;
