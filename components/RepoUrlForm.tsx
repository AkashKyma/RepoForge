'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RepoUrlForm() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/analyses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl }),
      });

      const payload = (await response.json()) as { id?: string; error?: string };

      if (!response.ok || !payload.id) {
        throw new Error(payload.error ?? 'Unable to create analysis.');
      }

      router.push(`/analyses/${payload.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create analysis.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="hero-form" onSubmit={handleSubmit}>
      <label className="field-group">
        <span>GitHub repository URL</span>
        <input
          type="url"
          name="repoUrl"
          placeholder="https://github.com/vercel/next.js"
          value={repoUrl}
          onChange={(event) => setRepoUrl(event.target.value)}
          required
          autoComplete="off"
        />
      </label>
      <p className="helper-text">Phase 1 analyzes public repositories and produces technical plus commercial reports.</p>
      {error ? <p className="error-text">{error}</p> : null}
      <button className="primary-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Starting analysis…' : 'Analyze repository'}
      </button>
    </form>
  );
}
