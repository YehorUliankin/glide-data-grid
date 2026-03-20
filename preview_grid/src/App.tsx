import { useCallback, useMemo } from "react";
import DataEditor, {
    GridCellKind,
    GridColumnIcon,
    type CellClickedEventArgs,
    type DataEditorProps,
    type GridCell,
    type GridColumn,
    type GroupHeaderClickedEventArgs,
    type Item,
} from "@glide-data-grid-local";

const ROWS = 200;

function createColumns(): GridColumn[] {
    return [
        { id: "name", title: "Name", width: 220, group: ["Users", "Profile"] },
        { id: "email", title: "Email", width: 280, group: ["Users", "Contacts"] },
        { id: "status", title: "Status", width: 150, group: ["Telemetry", "Flags"] },
        { id: "score", title: "Score", width: 120, group: ["Telemetry", "Metrics"] },
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

    const onCellClicked = useCallback(
        (cell: Item, event: CellClickedEventArgs) => {
            const [col, row] = cell;
            const column = columns[col];
            const content = getCellContent(cell);

            console.groupCollapsed(`[cell-click] col=${col}, row=${row}`);
            console.log("cell", cell);
            console.log("column", column);
            console.log("content", content);
            console.log("event", {
                kind: event.kind,
                location: event.location,
                bounds: event.bounds,
                localEventX: event.localEventX,
                localEventY: event.localEventY,
                button: event.button,
                buttons: event.buttons,
                shiftKey: event.shiftKey,
                ctrlKey: event.ctrlKey,
                metaKey: event.metaKey,
                isTouch: event.isTouch,
                isDoubleClick: event.isDoubleClick,
                isFillHandle: event.isFillHandle,
                isEdge: event.isEdge,
                scrollEdge: event.scrollEdge,
            });
            console.log("event_raw", event);
            console.groupEnd();
        },
        [columns, getCellContent]
    );

    const onGroupHeaderClicked = useCallback(
        (colIndex: number, event: GroupHeaderClickedEventArgs) => {
            const [col, row] = event.location;
            const column = columns[col];
            const levelFromBottom = row <= -2 ? -2 - row : undefined;

            console.groupCollapsed(
                `[group-click] group="${event.group}", colIndex=${colIndex}, row=${row}, levelFromBottom=${levelFromBottom}`
            );
            console.log("group", event.group);
            console.log("location", event.location);
            console.log("columnAtPointer", column);
            console.log("column.group raw", column?.group);
            console.log("event", { event });
            console.groupEnd();
        },
        [columns]
    );

    const getGroupDetails = useCallback<NonNullable<DataEditorProps["getGroupDetails"]>>((group, context) => {
        const palette = ["#eef6ff", "#e9faf1", "#fff5e9", "#f7efff", "#f5f7fa"];
        const levelFromBottom = context?.levelFromBottom ?? 0;
        const bg = palette[levelFromBottom % palette.length];

        return {
            name: group,
            actions: [
                {
                    icon: GridColumnIcon.ArrowLeft,
                    title: "Arrow left",
                    onClick: e => {
                        console.log("[group-action] arrowLeft", {
                            group,
                            context,
                            location: e.location,
                        });
                    },
                },
                {
                    icon: GridColumnIcon.ArrowRight,
                    title: "Arrow right",
                    onClick: e => {
                        console.log("[group-action] arrowRight", {
                            group,
                            context,
                            location: e.location,
                        });
                    },
                },
            ],
            overrideTheme: {
                bgGroupHeader: bg,
                bgGroupHeaderHovered: bg,
                textGroupHeader: "#1f2d3d",
            },
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
                    getGroupDetails={getGroupDetails}
                    onCellClicked={onCellClicked}
                    onGroupHeaderClicked={onGroupHeaderClicked}
                    rowMarkers="number"
                    smoothScrollX={true}
                    smoothScrollY={true}
                />
            </div>
        </main>
    );
}
