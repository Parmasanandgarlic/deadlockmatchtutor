export default function Footer() {
  return (
    <footer className="border-t border-deadlock-border py-6 mt-12">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-deadlock-muted">
        <p>Deadlock Match Analyzer &mdash; Not affiliated with Valve Corporation.</p>
        <p>
          Data sourced from{' '}
          <a
            href="https://deadlock-api.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-deadlock-accent hover:underline"
          >
            deadlock-api.com
          </a>
        </p>
      </div>
    </footer>
  );
}
