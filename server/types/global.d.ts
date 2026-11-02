declare global {
    namespace App {
        namespace Components {
            interface ColumnDef<T> {
                id: string;
                header: string | React.ReactNode;
                cell: (rowData: T) => React.ReactNode;
                accessorKey?: keyof T;
                width?: number | string;
                align?: 'left' | 'center' | 'right';
                key: keyof T | string;
                sortable?: boolean;
            }

            interface ButtonProps {
                children: React.ReactNode;
                onClick?: () => void;
                disabled?: boolean;
                variant?: 'primary' | 'secondary' | 'danger' | 'outline';
                type?: 'button' | 'submit' | 'reset';
                className?: string;
                size?: 'sm' | 'md' | 'lg';
                loading?: boolean;
            }

            interface DataTableProps<T> {
                data: T[];
                columns: ColumnDef<T>[];
                keyExtractor: (row: T) => string | number;
                onRowClick?: (row: T) => void;
                emptyMessage?: string;
                loading?: boolean;
                height?: number | string;
            }
        }
        namespace State {
            interface ParsingState {
                input: string;
                output: string;
                format: Parsing.ParserType;
                isLoading: boolean;
                error: string | null;
                status: 'idle' | 'parsing' | 'done' | 'error';
                progress: number;
                result?: string;
            }

            interface HistoryItem {
                id: string;
                timestamp: number;
                input: string;
                output: string;
            }
        }
    }
    interface Window {
        parser: ParserAPI;
        myAPI: {
            loadPreferences: () => Promise<any>;
        };
    }
    interface Crypto {
        readonly subtle: SubtleCrypto;
    }

    interface SubtleCrypto {
        digest(algorithm: AlgorithmIdentifier, data: BufferSource): Promise<ArrayBuffer>;
    }
}