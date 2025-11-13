# Drop Set Suite Implementation

## Overview
Added conditional "Drop Set Suite" functionality to the Weekly Program View editor. When a coach selects "Drop Set" as an intensification technique for a General block exercise, additional fields appear to specify the details of the drop set suite (follow-up portion).

## Features

### Conditional UI Fields
When `intensification_technique === "drop-set"`:
- **Suite - Reps**: Number input for reps in the drop set suite
- **Suite - Poids (kg)**: Decimal input for weight in kg for the drop set suite

### Grid Layout Adjustments
- When drop set fields are shown:
  - Intensification Technique: `col-span-3`
  - Drop Set Reps: `col-span-2`
  - Drop Set Poids: `col-span-2`
  - Notes: `col-span-2` (reduced from col-span-3)
- When drop set fields are hidden:
  - Intensification Technique: `col-span-3`
  - Notes: `col-span-3` (for General blocks) or `col-span-2` (for Force blocks)

## Implementation Details

### Database Schema (Migration)
File: `supabase/add-drop-set-suite.sql`

```sql
ALTER TABLE sets ADD COLUMN IF NOT EXISTS drop_set_reps INTEGER NULL;
ALTER TABLE sets ADD COLUMN IF NOT EXISTS drop_set_weight DECIMAL(5,2) NULL;
```

### TypeScript Interface
Updated `Set` interface in `src/components/coach/WeekEditor.tsx`:

```typescript
interface Set {
  id?: string;
  exercise_name: string;
  exercise_type: string;
  set_number: number;
  prescribed_reps: number | null;
  prescribed_weight: number | null;
  prescribed_rpe: number | null;
  actual_rpe: number | null;
  notes: string | null;
  intensification_technique?: string | null;
  drop_set_reps?: number | null;        // NEW
  drop_set_weight?: number | null;      // NEW
}
```

### Component Implementation
Location: `src/components/coach/WeekEditor.tsx` (lines 844-900)

#### JSX Rendering

```tsx
{/* Drop set suite fields - only show if "drop-set" is selected */}
{set.intensification_technique === "drop-set" && (
  <>
    <div className="col-span-2">
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">Suite - Reps</Label>
        <Input
          type="number"
          placeholder="Reps"
          value={set.drop_set_reps || ""}
          onChange={(e) =>
            handleUpdateSet(
              session.id!,
              set.id!,
              "drop_set_reps",
              e.target.value ? parseInt(e.target.value) : null
            )
          }
          className="h-9"
        />
      </div>
    </div>
    <div className="col-span-2">
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">Suite - Poids (kg)</Label>
        <Input
          type="number"
          step="0.5"
          placeholder="Poids"
          value={set.drop_set_weight || ""}
          onChange={(e) =>
            handleUpdateSet(
              session.id!,
              set.id!,
              "drop_set_weight",
              e.target.value ? parseFloat(e.target.value) : null
            )
          }
          className="h-9"
        />
      </div>
    </div>
  </>
)}
```

#### Data Persistence
The existing `handleUpdateSet` function already supports these new fields through its generic field-value pattern:
- `handleUpdateSet(session.id!, set.id!, "drop_set_reps", value)`
- `handleUpdateSet(session.id!, set.id!, "drop_set_weight", value)`

No modifications to `handleUpdateSet` were needed.

## User Experience Flow

1. Coach creates/edits a General block training week
2. Coach views a series (set) of an exercise
3. Coach selects "Drop Set" from intensification technique dropdown
4. UI automatically shows two new input fields:
   - Input for drop set suite reps
   - Input for drop set suite weight
5. Coach fills in the values
6. Values are saved automatically via `handleUpdateSet`
7. If coach changes technique to something else, fields disappear automatically

## Technical Notes

- Fields only appear for General blocks (checked via `isGeneralBlock` parent condition)
- Conditional rendering is reactive - changes appear immediately
- Data types:
  - `drop_set_reps`: INTEGER (no decimals for reps)
  - `drop_set_weight`: DECIMAL(5,2) (up to 999.99 kg)
- Form validation: Inputs accept only numeric values (HTML5 `type="number"`)
- Input step for weight: 0.5 kg increments for realistic weight values

## Testing Checklist

- [ ] Navigate to coach dashboard → athlete → blocks → edit week
- [ ] Edit a General block training week
- [ ] Select an exercise and select "Drop Set" from technique dropdown
- [ ] Verify Suite - Reps and Suite - Poids fields appear
- [ ] Enter values (e.g., 5 reps, 20 kg)
- [ ] Verify values are saved (refresh page or check database)
- [ ] Change technique to something else
- [ ] Verify fields disappear automatically
- [ ] Change technique back to "Drop Set"
- [ ] Verify previously entered values are still there

## Database Migration

Execute before deploying:
```bash
supabase db push supabase/add-drop-set-suite.sql
```

Or manually in Supabase dashboard:
1. Go to SQL Editor
2. Create new query
3. Copy contents of `supabase/add-drop-set-suite.sql`
4. Execute

## Future Enhancements

- Add drop set suite fields for other intensification techniques that might need follow-up parameters
- Create data model for reusable "drop set configurations" (predefined suite values)
- Add visual indicator when drop set suite data exists for a set
- Export training programs with drop set suite details
