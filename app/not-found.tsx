import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="page-shell">
      <section className="card">
        <p className="eyebrow">Not found</p>
        <h2>That analysis page does not exist.</h2>
        <p>Go back to the RepoForge home page and submit a repository URL to start a new analysis.</p>
        <Link className="secondary-link" href="/">
          Return home
        </Link>
      </section>
    </main>
  );
}
