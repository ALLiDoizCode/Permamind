import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

describe('Table Component Family', () => {
  it('renders children correctly', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Column 1</TableHead>
            <TableHead>Column 2</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Value 1</TableCell>
            <TableCell>Value 2</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    expect(screen.getByText('Column 1')).toBeInTheDocument();
    expect(screen.getByText('Column 2')).toBeInTheDocument();
    expect(screen.getByText('Value 1')).toBeInTheDocument();
    expect(screen.getByText('Value 2')).toBeInTheDocument();
  });

  it('applies hover classes to TableRow', () => {
    render(
      <Table>
        <TableBody>
          <TableRow data-testid="table-row">
            <TableCell>Content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const row = screen.getByTestId('table-row');
    expect(row).toHaveClass('hover:bg-terminal-surface/50');
    expect(row).toHaveClass('transition-colors');
  });

  it('renders TableHead and TableCell with correct styling', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead data-testid="table-head">Header</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell data-testid="table-cell">Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const head = screen.getByTestId('table-head');
    const cell = screen.getByTestId('table-cell');

    // TableHead should have terminal theme classes
    expect(head).toHaveClass('font-mono');
    expect(head).toHaveClass('text-terminal-text');
    expect(head).toHaveClass('font-medium');

    // TableCell should have terminal theme classes
    expect(cell).toHaveClass('text-terminal-muted');
    expect(cell).toHaveClass('whitespace-nowrap');
  });

  it('table is scrollable on overflow', () => {
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    // Table wrapper should have overflow-x-auto
    const wrapper = container.querySelector('.overflow-x-auto');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders multiple rows correctly', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Version</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Skill A</TableCell>
            <TableCell>1.0.0</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Skill B</TableCell>
            <TableCell>2.0.0</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Skill C</TableCell>
            <TableCell>3.0.0</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    // All rows should be rendered
    expect(screen.getByText('Skill A')).toBeInTheDocument();
    expect(screen.getByText('Skill B')).toBeInTheDocument();
    expect(screen.getByText('Skill C')).toBeInTheDocument();

    // All versions should be rendered
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
    expect(screen.getByText('2.0.0')).toBeInTheDocument();
    expect(screen.getByText('3.0.0')).toBeInTheDocument();
  });

  it('applies font-mono class to table', () => {
    const { container } = render(
      <Table data-testid="table">
        <TableBody>
          <TableRow>
            <TableCell>Content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

    const table = container.querySelector('table');
    expect(table).toHaveClass('font-mono');
  });
});
