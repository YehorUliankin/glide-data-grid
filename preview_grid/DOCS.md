# Glide Data Grid: Nested Group Headers

Техническая документация по добавленной поддержке многоуровневых групп заголовков в этой ветке.

## 1. Что именно реализовано

Раньше у колонки можно было указать только один `group` (одна строка групповых заголовков).

Теперь:

- `group` поддерживает:
  - `string` (как раньше),
  - `string[]` (вложенные группы: от внешней к внутренней).
- Глубина групп вычисляется автоматически по максимальной длине `group` среди всех колонок.
- Рендер, hit-test, события и выделение работают для нескольких строк групповых заголовков (`-2`, `-3`, `-4`, ...).

## 2. Модель данных

Ключевое изменение типа колонки:

```ts
type GridColumnGroup = string | readonly string[];

interface BaseGridColumn {
  readonly group?: GridColumnGroup;
}
```

Семантика:

- `group: "Users"` -> глубина 1.
- `group: ["Telemetry", "Runtime", "Metrics"]` -> глубина 3.
- Для коротких путей на верхних/нижних уровнях имя группы может быть `undefined`.

Вспомогательные функции:

- `getGroupDepth(columns)` -> максимальная глубина.
- `getColumnGroupName(group, levelFromBottom)`:
  - `levelFromBottom = 0` -> самый внутренний (нижний) уровень,
  - `1` -> на один уровень выше и т.д.

## 3. Координаты и геометрия

### 3.1 Индексы строк (`Item = [col, row]`)

- `row = -1` -> обычный заголовок колонки.
- `row <= -2` -> групповые заголовки (вложенные уровни).
- `row >= 0` -> данные.

При глубине `D`:

- верхний уровень группы: `row = -(D + 1)`,
- нижний уровень группы (ближе к header): `row = -2`.

Пример для `D = 4`:

- `-5` -> уровень 1 (самый верхний),
- `-4` -> уровень 2,
- `-3` -> уровень 3,
- `-2` -> уровень 4 (самый нижний),
- `-1` -> header колонок.

### 3.2 Высота заголовков

- `totalGroupHeaderHeight = groupHeaderHeight * groupHeaderDepth`
- `totalHeaderHeight = headerHeight + totalGroupHeaderHeight`

Именно эта высота теперь используется сквозь весь пайплайн (скролл, hit-test, рендер линий, ring'и).

## 4. Как это рисуется

Основная логика:

1. Вычисляется `groupHeaderDepth`.
2. `walkGroups(...)` проходит по всем уровням сверху вниз.
3. На каждом уровне колонки объединяются в span'ы по совпадающему имени группы на этом уровне.
4. Для каждого span вызывается отрисовка прямоугольника группы, текста, иконок и actions.
5. Потом рисуются разделители между уровнями.

Важно:

- sticky-колонки учитываются отдельно (span не пересекает sticky boundary).
- clipping учитывает текущий viewport.
- damage rendering тоже знает про все header-строки, а не только про `-2/-1`.

## 5. Hit-test и события

### 5.1 Определение строки по `y`

`getRowIndexForY(...)` теперь учитывает глубину групп. Клик в зоне group headers возвращает конкретный `row` нужного уровня (`-2`, `-3`, ...), а не всегда `-2`.

### 5.2 Границы элемента

`computeBounds(...)` принимает `groupHeaderDepth` и умеет считать bounds для любого group-header уровня:

- определяет `levelFromBottom = -2 - row`,
- ищет span влево/вправо по этому уровню,
- возвращает общий прямоугольник group span.

### 5.3 Тип события group header

`GridMouseGroupHeaderEventArgs.location` теперь `[number, number]` (а не `[number, -2]`), чтобы передавать любой header level.

`args.group` теперь уровень-зависимый: имя группы берется из реально кликнутого уровня.

## 6. Что изменилось относительно оригинала

| Область | Оригинал | Сейчас |
|---|---|---|
| Тип `column.group` | Только `string` | `string` или `string[]` |
| Кол-во строк групп | Фиксировано 1 | По глубине, фактически не ограничено (практически используйте 3-4+) |
| Индекс group row | Всегда `-2` | `-2`, `-3`, `-4`, ... |
| Hit-test по header | Один group level | Любой уровень |
| Bounds group header | Только один уровень | Уровень-зависимый span |
| Selection group click | По одному уровню | По уровню клика |
| Scrolling total height | `header + 1*groupHeaderHeight` | `header + depth*groupHeaderHeight` |
| Highlight/focus regions | 1 group row | Все group rows |

## 7. Как использовать

### 7.1 Минимальный пример колонок

```ts
const columns: GridColumn[] = [
  { id: "name", title: "Name", width: 220, group: ["Users", "Profile"] },
  { id: "email", title: "Email", width: 280, group: ["Users", "Contacts"] },
  { id: "status", title: "Status", width: 150, group: ["Telemetry", "Runtime", "Flags"] },
  { id: "score", title: "Score", width: 120, group: ["Telemetry", "Runtime", "Metrics", "Quality"] },
];
```

### 7.2 Совместимость

Старый формат остается валидным:

```ts
{ id: "id", title: "ID", group: "Common" }
```

Можно смешивать `string` и `string[]` в одном наборе колонок.

### 7.3 Работа с кликами по group header

В `onGroupHeaderClicked`:

- `args.location[1]` -> уровень (`-2`, `-3`, ...),
- `args.group` -> имя группы именно этого уровня.

Для поведения "выделить всю группу уровня" используйте уровень из `location[1]` (в текущей реализации `DataEditor` это уже делает).

### 7.4 Тема групп

`getGroupDetails(name)` продолжает принимать строковый ключ группы.
Для header ячейки и overlay темы в `DataEditor` берется leaf group (`levelFromBottom = 0`).

## 8. Ограничения и нюансы

- Глубина технически не ограничена кодом, но UX обычно разумнее держать в пределах 3-4 уровней.
- Сравнение групп на уровне сейчас по имени строки (`isGroupEqual`), без полного path-контекста.
- Если у двух веток одинаковые имена на одном уровне, они считаются одной группой на этом уровне (если колонки соседние).

## 9. Где смотреть в коде

Основные точки:

- `packages/core/src/internal/data-grid/data-grid-types.ts`
- `packages/core/src/internal/data-grid/render/data-grid-lib.ts`
- `packages/core/src/internal/data-grid/render/data-grid-render.walk.ts`
- `packages/core/src/internal/data-grid/render/data-grid-render.header.ts`
- `packages/core/src/internal/data-grid/data-grid.tsx`
- `packages/core/src/data-editor/data-editor.tsx`
- `packages/core/src/internal/scrolling-data-grid/scrolling-data-grid.tsx`
- `preview_grid/src/App.tsx`

## 10. Локальный запуск примера

Из корня репозитория:

```bash
npm run dev --prefix preview_grid
```

Открыть:

`http://localhost:5174`

## 11. New Group Theming Context (Nested Paths)

`getGroupDetails` now receives an optional second argument with nested context:

```ts
type GroupDetailsContext = {
  path: readonly string[];      // from outermost to current level
  levelFromBottom: number;      // 0 = leaf (innermost), 1 = parent, ...
};
```

Callback shape:

```ts
getGroupDetails?: (groupName: string, context?: GroupDetailsContext) => GroupDetails
```

Example:

```ts
getGroupDetails={(group, ctx) => {
  const key = ctx?.path.join(" > ") ?? group;
  const depth = ctx?.levelFromBottom ?? 0;

  return {
    name: group,
    overrideTheme: {
      bgGroupHeader: depth === 0 ? "#eef6ff" : "#f8fbff",
      textGroupHeader: key.startsWith("Telemetry") ? "#5a2d00" : "#1f2a44",
    },
  };
}}
```

This enables reliable theming for subgroup trees of arbitrary depth.
