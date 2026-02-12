import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NanoEditor } from './NanoEditor';

// --- Factory Functions ---

type NanoEditorPropsConfig = {
  readonly filePath?: string;
  readonly initialContent?: string;
  readonly isNewFile?: boolean;
  readonly onSaveResult?: { readonly allowed: boolean; readonly error?: string };
  readonly onCreateResult?: { readonly allowed: boolean; readonly error?: string };
};

const createMockProps = (config: NanoEditorPropsConfig = {}) => {
  const {
    filePath = '/home/user/test.js',
    initialContent = '',
    isNewFile = false,
    onSaveResult = { allowed: true },
    onCreateResult = { allowed: true },
  } = config;

  return {
    filePath,
    initialContent,
    isNewFile,
    onSave: vi.fn(() => onSaveResult),
    onCreate: vi.fn(() => onCreateResult),
    onClose: vi.fn(),
  };
};

const getTextarea = (): HTMLTextAreaElement =>
  screen.getByTestId('nano-editor-textarea') as HTMLTextAreaElement;

// --- Tests ---

describe('NanoEditor', () => {
  describe('rendering', () => {
    it('should render with initial content in textarea', () => {
      const props = createMockProps({ initialContent: 'const x = 42;' });
      render(<NanoEditor {...props} />);

      expect(getTextarea().value).toBe('const x = 42;');
    });

    it('should show filename in header', () => {
      const props = createMockProps({ filePath: '/home/user/script.js' });
      render(<NanoEditor {...props} />);

      expect(screen.getByText('/home/user/script.js')).toBeInTheDocument();
    });

    it('should show GNU nano version in header', () => {
      const props = createMockProps();
      render(<NanoEditor {...props} />);

      expect(screen.getByText('GNU nano 7.2')).toBeInTheDocument();
    });

    it('should show New File indicator for new files', () => {
      const props = createMockProps({ isNewFile: true });
      render(<NanoEditor {...props} />);

      expect(screen.getByText('[ New File ]')).toBeInTheDocument();
    });

    it('should show keyboard shortcuts in help bar', () => {
      const props = createMockProps();
      render(<NanoEditor {...props} />);

      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Exit')).toBeInTheDocument();
    });
  });

  describe('saving', () => {
    it('should call onSave with current content on Ctrl+S for existing files', () => {
      const props = createMockProps({ initialContent: 'original' });
      render(<NanoEditor {...props} />);

      fireEvent.keyDown(getTextarea(), { key: 's', ctrlKey: true });

      expect(props.onSave).toHaveBeenCalledWith('original');
    });

    it('should call onCreate for new files on first save', () => {
      const props = createMockProps({ isNewFile: true, initialContent: '' });
      render(<NanoEditor {...props} />);

      fireEvent.change(getTextarea(), { target: { value: 'new content' } });
      fireEvent.keyDown(getTextarea(), { key: 's', ctrlKey: true });

      expect(props.onCreate).toHaveBeenCalledWith('new content');
    });

    it('should call onSave after first save of new file', () => {
      const props = createMockProps({ isNewFile: true });
      render(<NanoEditor {...props} />);

      // First save creates
      fireEvent.keyDown(getTextarea(), { key: 's', ctrlKey: true });
      expect(props.onCreate).toHaveBeenCalledTimes(1);

      // Second save updates
      fireEvent.change(getTextarea(), { target: { value: 'updated' } });
      fireEvent.keyDown(getTextarea(), { key: 's', ctrlKey: true });
      expect(props.onSave).toHaveBeenCalledWith('updated');
    });

    it('should show error message on save failure', () => {
      const props = createMockProps({
        onSaveResult: { allowed: false, error: 'Permission denied' },
      });
      render(<NanoEditor {...props} />);

      fireEvent.keyDown(getTextarea(), { key: 's', ctrlKey: true });

      expect(screen.getByText('[ Error: Permission denied ]')).toBeInTheDocument();
    });
  });

  describe('modified indicator', () => {
    it('should show Modified indicator after editing', () => {
      const props = createMockProps({ initialContent: 'original' });
      render(<NanoEditor {...props} />);

      expect(screen.queryByText('Modified')).not.toBeInTheDocument();

      fireEvent.change(getTextarea(), { target: { value: 'changed' } });

      expect(screen.getByText('Modified')).toBeInTheDocument();
    });

    it('should hide Modified indicator after saving', () => {
      const props = createMockProps({ initialContent: 'original' });
      render(<NanoEditor {...props} />);

      fireEvent.change(getTextarea(), { target: { value: 'changed' } });
      expect(screen.getByText('Modified')).toBeInTheDocument();

      fireEvent.keyDown(getTextarea(), { key: 's', ctrlKey: true });
      expect(screen.queryByText('Modified')).not.toBeInTheDocument();
    });
  });

  describe('exiting', () => {
    it('should call onClose on Ctrl+X when not modified', () => {
      const props = createMockProps();
      render(<NanoEditor {...props} />);

      fireEvent.keyDown(getTextarea(), { key: 'x', ctrlKey: true });

      expect(props.onClose).toHaveBeenCalled();
    });

    it('should call onClose on Escape when not modified', () => {
      const props = createMockProps();
      render(<NanoEditor {...props} />);

      fireEvent.keyDown(getTextarea(), { key: 'Escape' });

      expect(props.onClose).toHaveBeenCalled();
    });

    it('should show exit prompt on Ctrl+X when modified', () => {
      const props = createMockProps();
      render(<NanoEditor {...props} />);

      fireEvent.change(getTextarea(), { target: { value: 'changed' } });
      fireEvent.keyDown(getTextarea(), { key: 'x', ctrlKey: true });

      expect(screen.getByText('Save modified buffer?')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should save and close on Y during exit prompt', () => {
      const props = createMockProps();
      render(<NanoEditor {...props} />);

      fireEvent.change(getTextarea(), { target: { value: 'changed' } });
      fireEvent.keyDown(getTextarea(), { key: 'x', ctrlKey: true });
      fireEvent.keyDown(getTextarea(), { key: 'y' });

      expect(props.onSave).toHaveBeenCalledWith('changed');
      expect(props.onClose).toHaveBeenCalled();
    });

    it('should close without saving on N during exit prompt', () => {
      const props = createMockProps();
      render(<NanoEditor {...props} />);

      fireEvent.change(getTextarea(), { target: { value: 'changed' } });
      fireEvent.keyDown(getTextarea(), { key: 'x', ctrlKey: true });
      fireEvent.keyDown(getTextarea(), { key: 'n' });

      expect(props.onSave).not.toHaveBeenCalled();
      expect(props.onClose).toHaveBeenCalled();
    });

    it('should cancel exit on C during exit prompt', () => {
      const props = createMockProps();
      render(<NanoEditor {...props} />);

      fireEvent.change(getTextarea(), { target: { value: 'changed' } });
      fireEvent.keyDown(getTextarea(), { key: 'x', ctrlKey: true });
      fireEvent.keyDown(getTextarea(), { key: 'c' });

      expect(props.onClose).not.toHaveBeenCalled();
      expect(screen.queryByText('Save modified buffer?')).not.toBeInTheDocument();
    });
  });
});
