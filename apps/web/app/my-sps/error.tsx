"use client";
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){return <main role="alert"><h1>My SPS unavailable</h1><p>Unable to load your workspace.</p><button onClick={reset}>Retry</button></main>;}
