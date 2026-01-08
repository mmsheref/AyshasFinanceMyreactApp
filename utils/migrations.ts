
import { DailyRecord, CustomExpenseStructure, ExpenseCategory } from '../types';
import { DEFAULT_EXPENSE_STRUCTURE } from '../constants';

/**
 * Migrates an old expense structure format (where categories contained an array of strings)
 * to the new format (an array of objects with name and defaultValue).
 * @param structure The custom expense structure to migrate.
 * @returns The migrated, new-format custom expense structure.
 */
export const migrateStructure = (structure: any): CustomExpenseStructure => {
    if (!structure || typeof structure !== 'object' || Array.isArray(structure)) {
        return DEFAULT_EXPENSE_STRUCTURE;
    }
    const firstCategoryValue = Object.values(structure)[0];
    // If the first value is an array of strings, it's the old format.
    if (Array.isArray(firstCategoryValue) && (firstCategoryValue.length === 0 || typeof firstCategoryValue[0] === 'string')) {
      console.log("Migrating expense structure to new format with default values.");
      const newStructure: CustomExpenseStructure = {};
      for (const category in structure) {
        newStructure[category] = (structure[category] as string[]).map(itemName => ({
          name: itemName,
          defaultValue: 0,
        }));
      }
      return newStructure;
    }
    // Already new format or empty
    return structure;
};

/**
 * Runs all necessary migrations on records data, such as converting `billPhoto` to `billPhotos`
 * and adding the new `morningSales` field.
 * This ensures backward compatibility with older backup data.
 * @param recordsToMigrate An array of daily records.
 * @returns An object containing the migrated records and a boolean indicating if an update was needed.
 */
export const runMigration = (recordsToMigrate: DailyRecord[]): { migratedRecords: DailyRecord[], needsUpdate: boolean } => {
    let needsUpdate = false;
    const migratedRecords = JSON.parse(JSON.stringify(recordsToMigrate)); // Deep copy

    migratedRecords.forEach((rec: any) => { // Use 'any' to check for legacy properties
        
        // Migration 1: Add morningSales if it doesn't exist
        if (typeof rec.morningSales === 'undefined') {
            rec.morningSales = 0;
            needsUpdate = true;
        }

        // Migration 3: Add isClosed if it doesn't exist
        if (typeof rec.isClosed === 'undefined') {
            rec.isClosed = false;
            needsUpdate = true;
        }

        if (!rec.expenses) {
            rec.expenses = [];
        }

        // Migration 2: Convert single billPhoto to billPhotos array
        rec.expenses.forEach((cat: ExpenseCategory) => {
            if (!cat.items) {
                cat.items = [];
            }
            cat.items.forEach((item: any) => {
                if (item.billPhoto && (!item.billPhotos || item.billPhotos.length === 0)) {
                    item.billPhotos = [item.billPhoto];
                    delete item.billPhoto;
                    needsUpdate = true;
                }
            });
        });
    });
    return { migratedRecords, needsUpdate };
};
