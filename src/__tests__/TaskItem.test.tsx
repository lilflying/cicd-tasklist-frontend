import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskItem } from '../components/TaskItem';
import type { Task } from '../types/task';

const mockTask: Task = {
  id: 1,
  title: 'Test Task',
  description: 'Test description',
  completed: false,
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-01-15T10:00:00Z',
};

describe('TaskItem', () => {
  it('renders task item', () => {
    render(<TaskItem task={mockTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('toggles task completion', () => {
    const onToggle = vi.fn();
    render(<TaskItem task={mockTask} onToggle={onToggle} onDelete={vi.fn()} onEdit={vi.fn()} />);
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(onToggle).toHaveBeenCalledWith(1);
  });

  it('enters edit mode when edit button is clicked', async () => {
    render(<TaskItem task={mockTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
    const editBtn = screen.getByTitle('Modifier');
    fireEvent.click(editBtn);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Titre de la tâche')).toBeInTheDocument();
    });
  });

  it('saves edited task', async () => {
    const onEdit = vi.fn();
    render(<TaskItem task={mockTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />);
    const editBtn = screen.getByTitle('Modifier');
    fireEvent.click(editBtn);
    const titleInput = await screen.findByPlaceholderText('Titre de la tâche');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Updated Task');
    const saveBtn = screen.getByText('Enregistrer');
    fireEvent.click(saveBtn);
    expect(onEdit).toHaveBeenCalledWith(1, { title: 'Updated Task', description: 'Test description' });
  });

  it('cancels edit mode', async () => {
    render(<TaskItem task={mockTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
    const editBtn = screen.getByTitle('Modifier');
    fireEvent.click(editBtn);
    const cancelBtn = await screen.findByText('Annuler');
    fireEvent.click(cancelBtn);
    await waitFor(() => {
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });
  });

  it('deletes task on second click', async () => {
    const onDelete = vi.fn();
    render(<TaskItem task={mockTask} onToggle={vi.fn()} onDelete={onDelete} onEdit={vi.fn()} />);
    const deleteBtn = screen.getByTitle('Supprimer');
    fireEvent.click(deleteBtn);
    expect(deleteBtn).toHaveTextContent('⚠️');
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it('shows completed state', () => {
    const completedTask = { ...mockTask, completed: true };
    const { container } = render(
      <TaskItem task={completedTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />
    );
    const taskItem = container.querySelector('.task-item');
    expect(taskItem).toHaveClass('task-completed');
  });

  it('does not save when title is empty', async () => {
    const onEdit = vi.fn();
    render(<TaskItem task={mockTask} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />);
    const editBtn = screen.getByTitle('Modifier');
    fireEvent.click(editBtn);
    const titleInput = await screen.findByPlaceholderText('Titre de la tâche');
    await userEvent.clear(titleInput);
    const saveBtn = screen.getByText('Enregistrer');
    fireEvent.click(saveBtn);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('renders without description', () => {
    const taskWithoutDesc = { ...mockTask, description: null };
    render(<TaskItem task={taskWithoutDesc} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.queryByText('Test description')).not.toBeInTheDocument();
  });
});
