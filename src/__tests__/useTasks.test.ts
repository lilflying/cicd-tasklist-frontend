import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTasks } from '../hooks/useTasks';
import * as taskApi from '../api/taskApi';

vi.mock('../api/taskApi');

const mockTask = {
  id: 1,
  title: 'Test Task',
  description: 'Test desc',
  completed: false,
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-01-15T10:00:00Z',
};

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads tasks on mount', async () => {
    (taskApi.getTasks as any).mockResolvedValue([mockTask]);
    const { result } = renderHook(() => useTasks());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks).toEqual([mockTask]);
  });

  it('adds a task', async () => {
    (taskApi.getTasks as any).mockResolvedValue([]);
    (taskApi.createTask as any).mockResolvedValue(mockTask);
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => { result.current.addTask({ title: 'New Task' }); });
    await waitFor(() => { expect(result.current.tasks).toContainEqual(mockTask); });
  });

  it('removes a task', async () => {
    (taskApi.getTasks as any).mockResolvedValue([mockTask]);
    (taskApi.deleteTask as any).mockResolvedValue(undefined);
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => { result.current.removeTask(1); });
    await waitFor(() => { expect(result.current.tasks).toEqual([]); });
  });

  it('toggles task completion', async () => {
    (taskApi.getTasks as any).mockResolvedValue([mockTask]);
    (taskApi.updateTask as any).mockResolvedValue({ ...mockTask, completed: true });
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => { result.current.toggleComplete(1); });
    await waitFor(() => { expect(result.current.tasks[0].completed).toBe(true); });
  });

  it('handles errors', async () => {
    (taskApi.getTasks as any).mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Network error');
  });

  it('edits a task', async () => {
    (taskApi.getTasks as any).mockResolvedValue([mockTask]);
    (taskApi.updateTask as any).mockResolvedValue({ ...mockTask, title: 'Updated' });
    const { result } = renderHook(() => useTasks());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await waitFor(() => { result.current.editTask(1, { title: 'Updated' }); });
    await waitFor(() => { expect(result.current.tasks[0].title).toBe('Updated'); });
  });
});
