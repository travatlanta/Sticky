export const dynamic = "force-dynamic";

export default function TestPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Page</h1>
      <p>If you can see this, the basic Next.js server is working!</p>
      <p>Environment check:</p>
      <ul>
        <li>DATABASE_URL: {process.env.DATABASE_URL ? 'Set' : 'NOT SET'}</li>
        <li>NEXTAUTH_SECRET: {process.env.NEXTAUTH_SECRET ? 'Set' : 'NOT SET'}</li>
        <li>NEXTAUTH_URL: {process.env.NEXTAUTH_URL || 'NOT SET'}</li>
      </ul>
    </div>
  );
}
