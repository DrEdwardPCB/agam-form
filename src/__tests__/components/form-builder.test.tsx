import { render, screen, fireEvent } from '@testing-library/react';
import { FormBuilder } from '@/components/form-builder';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
}));

// Mock fetch
global.fetch = jest.fn();

describe('FormBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form builder with initial state', () => {
    render(<FormBuilder />);

    expect(screen.getByText('Form Title')).toBeInTheDocument();
    expect(screen.getByText('Form Description')).toBeInTheDocument();
    expect(screen.getByText('Form is active')).toBeInTheDocument();
    expect(screen.getByText('Add Question')).toBeInTheDocument();
  });

  it('adds a new question', () => {
    render(<FormBuilder />);

    const addButton = screen.getByText('Add Question');
    fireEvent.click(addButton);

    expect(screen.getByPlaceholderText('Question text')).toBeInTheDocument();
  });

  it('updates form title and description', async () => {
    render(<FormBuilder />);

    const titleInput = screen.getByPlaceholderText('Enter form title');
    const descriptionInput = screen.getByPlaceholderText('Enter form description');

    const user = userEvent.setup();
    await user.type(titleInput, 'Test Form');
    await user.type(descriptionInput, 'Test Description');

    expect(titleInput).toHaveValue('Test Form');
    expect(descriptionInput).toHaveValue('Test Description');
  });

  it('toggles form active state', () => {
    render(<FormBuilder />);

    const activeCheckbox = screen.getByLabelText('Form is active');
    expect(activeCheckbox).toBeChecked();

    fireEvent.click(activeCheckbox);
    expect(activeCheckbox).not.toBeChecked();
  });

  it('deletes a question', () => {
    render(<FormBuilder />);

    // Add a question
    const addButton = screen.getByText('Add Question');
    fireEvent.click(addButton);

    // Delete the question
    const deleteButton = screen.getAllByRole('button')[2];
    fireEvent.click(deleteButton);

    expect(screen.queryByPlaceholderText('Enter your question')).not.toBeInTheDocument();
  });

  it('marks a question as required', () => {
    render(<FormBuilder />);

    // Add a question
    const addButton = screen.getByText('Add Question');
    fireEvent.click(addButton);

    // Toggle required checkbox
    const requiredCheckbox = screen.getByLabelText('Required');
    fireEvent.click(requiredCheckbox);

    expect(requiredCheckbox).toBeChecked();
  });
});
