import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskForm } from '../components/TaskForm';

describe('TaskForm', () => {
  it('renders form with create mode by default', () => {
    render(<TaskForm onSubmit={vi.fn()} />);
    expect(screen.getByText('Nouvelle tâche')).toBeInTheDocument();
    expect(screen.getByText('Ajouter')).toBeInTheDocument();
  });

  it('renders form with edit mode', () => {
    render(<TaskForm onSubmit={vi.fn()} mode="edit" initialValues={{ title: 'Test', description: 'Desc' }} />);
    expect(screen.getByText('Modifier la tâche')).toBeInTheDocument();
    expect(screen.getByText('Modifier')).toBeInTheDocument();
  });

  it('submits form with title and description', async () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} />);

    const titleInput = screen.getByPlaceholderText('Titre de la tâche *');
    const descInput = screen.getByPlaceholderText('Description (optionnel)');
    const submitBtn = screen.getByText('Ajouter');

    await userEvent.type(titleInput, 'New Task');
    await userEvent.type(descInput, 'Task description');
    fireEvent.click(submitBtn);

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'New Task',
      description: 'Task description',
    });
  });

  it('shows validation error when title is empty', async () => {
    render(<TaskForm onSubmit={vi.fn()} />);
    const submitBtn = screen.getByText('Ajouter');
    fireEvent.click(submitBtn);
    expect(screen.getByText('Le titre est requis')).toBeInTheDocument();
  });

  it('clears validation error when user types', async () => {
    render(<TaskForm onSubmit={vi.fn()} />);
    const submitBtn = screen.getByText('Ajouter');
    fireEvent.click(submitBtn);

    const titleInput = screen.getByPlaceholderText('Titre de la tâche *') as HTMLInputElement;
    await userEvent.type(titleInput, 'T');

    expect(screen.queryByText('Le titre est requis')).not.toBeInTheDocument();
  });

  it('shows cancel button when onCancel is provided', () => {
    render(<TaskForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Annuler')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn();
    render(<TaskForm onSubmit={vi.fn()} onCancel={onCancel} />);
    const cancelBtn = screen.getByText('Annuler');
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalled();
  });

  it('fills form with initial values', () => {
    render(<TaskForm onSubmit={vi.fn()} initialValues={{ title: 'Edit me', description: 'Edit desc' }} />);
    const titleInput = screen.getByPlaceholderText('Titre de la tâche *') as HTMLInputElement;
    const descInput = screen.getByPlaceholderText('Description (optionnel)') as HTMLTextAreaElement;

    expect(titleInput.value).toBe('Edit me');
    expect(descInput.value).toBe('Edit desc');
  });

  it('resets form after create submission', async () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} mode="create" />);

    const titleInput = screen.getByPlaceholderText('Titre de la tâche *') as HTMLInputElement;
    const submitBtn = screen.getByText('Ajouter');

    await userEvent.type(titleInput, 'New Task');
    fireEvent.click(submitBtn);

    expect(titleInput.value).toBe('');
  });
});
