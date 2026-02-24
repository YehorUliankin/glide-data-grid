import { useCallback, useMemo } from "react";
import DataEditor, { GridCellKind, type GridCell, type GridColumn, type Item } from "@glide-data-grid-local";

const ROWS = 200;

function createColumns(): GridColumn[] {
    return [
        { id: "name", title: "Name", width: 220, group: ["Users", "Profile"] },
        { id: "email", title: "Email", width: 280, group: ["Users", "Contacts"] },
        { id: "status", title: "Status", width: 150, group: ["Telemetry", "Runtime", "Flags"] },
        { id: "score", title: "Score", width: 120, group: ["Telemetry", "Runtime", "Metrics", "Quality"] },
    ];
}

export default function App() {
    const columns = useMemo(createColumns, []);

    const getCellContent = useCallback((cell: Item): GridCell => {
        const [col, row] = cell;

        if (col === 0) {
            const value = `User ${row + 1}`;
            return {
                kind: GridCellKind.Text,
                allowOverlay: true,
                readonly: false,
                data: value,
                displayData: value,
            };
        }

        if (col === 1) {
            const value = `user${row + 1}@example.com`;
            return {
                kind: GridCellKind.Text,
                allowOverlay: true,
                readonly: false,
                data: value,
                displayData: value,
            };
        }

        if (col === 2) {
            const value = row % 2 === 0 ? "Active" : "Paused";
            return {
                kind: GridCellKind.Text,
                allowOverlay: true,
                readonly: false,
                data: value,
                displayData: value,
            };
        }

        const value = `${Math.round(((row % 50) / 49) * 100)}%`;
        return {
            kind: GridCellKind.Text,
            allowOverlay: true,
            readonly: false,
            data: value,
            displayData: value,
        };
    }, []);

    return (
        <main className="page">
            <h1>Glide Data Grid Preview</h1>
            <p>Local React + Vite page using source files from this repository.</p>
            <div className="grid-shell">
                <DataEditor
                    width="100%"
                    height={520}
                    columns={columns}
                    rows={ROWS}
                    getCellContent={getCellContent}
                    rowMarkers="number"
                    smoothScrollX={true}
                    smoothScrollY={true}
                />
            </div>
        </main>
    );
}
