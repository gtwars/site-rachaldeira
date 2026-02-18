import React from 'react';

export function Table({ children, className = '', ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
    return (
        <div className="w-full overflow-auto">
            <table className={`w-full text-sm ${className}`} {...props}>
                {children}
            </table>
        </div>
    );
}

export function TableHeader({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <thead className={`border-b border-gray-200 ${className}`} {...props}>
            {children}
        </thead>
    );
}

export function TableBody({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <tbody className={`divide-y divide-gray-200 ${className}`} {...props}>
            {children}
        </tbody>
    );
}

export function TableRow({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
    return (
        <tr className={`hover:bg-gray-50 ${className}`} {...props}>
            {children}
        </tr>
    );
}

export function TableHead({ children, className = '', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return (
        <th className={`px-4 py-3 text-left font-medium text-gray-700 ${className}`} {...props}>
            {children}
        </th>
    );
}

export function TableCell({ children, className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return (
        <td className={`px-4 py-3 text-gray-900 ${className}`} {...props}>
            {children}
        </td>
    );
}
