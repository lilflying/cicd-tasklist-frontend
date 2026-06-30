import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  it('renders the app with header', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Mes Tâches')).toBeInTheDocument();
    });
  });

  it('renders task form', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId('task-form')).toBeInTheDocument();
    });
  });

  it('shows empty state when no tasks', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Aucune tâche')).toBeInTheDocument();
    });
  });
});
