import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../src/components/Modal.js';

describe('Modal', () => {
  it('does not render when closed', () => {
    render(
      <Modal open={false} onClose={() => {}}>
        Hidden
      </Modal>,
    );
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(
      <Modal open={true} onClose={() => {}}>
        Visible
      </Modal>,
    );
    expect(screen.getByText('Visible')).toBeInTheDocument();
  });

  it('renders title in header', () => {
    render(
      <Modal open={true} onClose={() => {}} title="My Modal">
        Content
      </Modal>,
    );
    expect(screen.getByText('My Modal')).toBeInTheDocument();
  });

  it('has dialog role with aria-modal', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test">
        Body
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'Test');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="Close Me">
        Body
      </Modal>,
    );
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        Body
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when clicking the overlay', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        Body
      </Modal>,
    );
    // The overlay is the parent of the dialog
    const overlay = screen.getByRole('dialog').parentElement!;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not close when clicking inside the modal content', () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose}>
        <p>Inside</p>
      </Modal>,
    );
    fireEvent.click(screen.getByText('Inside'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
