import React from 'react';

// FIX: This component was based on a deprecated feature (Amortized Expenses)
// that was removed from the app's context and types, causing multiple build errors.
// The component is not used anywhere in the app, so it has been stubbed out
// to resolve the errors.

// The original props interface is kept to avoid breaking potential imports,
// though none were found in the project.
interface AmortizedExpenseManagerProps {
    onClose: () => void;
}

const AmortizedExpenseManager: React.FC<AmortizedExpenseManagerProps> = () => {
    return null; // Return null as the component's functionality is removed.
};

export default AmortizedExpenseManager;
