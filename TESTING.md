# @filename: TESTING.md

# Quotation Form Generator - Testing Plan

This document outlines the testing strategy for the Quotation Form Generator application to ensure its quality, reliability, and usability.

## 1. Unit Tests

Unit tests focus on isolating and verifying the smallest parts of the application, such as individual functions or components.

**Key areas for unit testing:**

-   **Calculation Logic (`useMemo` hooks):**
    -   [ ] Verify `itemCalculations` computes `volWeight`, `billedWeight`, and `totalCost` correctly.
    -   [ ] Test with zero values (e.g., `length: 0`).
    -   [ ] Test with `actualWeight` greater than `volWeight` and vice-versa.
    -   [ ] Verify `grandTotal` correctly sums up only the `isSelected` items.
    -   [ ] Test `grandTotal` with zero selected items.

-   **Custom Hooks (`useLocalStorage`, `useFormValidation`):**
    -   [ ] `useLocalStorage`: Test that it correctly reads from, writes to, and initializes from local storage.
    -   [ ] `useLocalStorage`: Test its behavior when local storage is empty or contains malformed JSON.
    -   [ ] `useFormValidation`: Check that it correctly identifies missing required fields.
    -   [ ] `useFormValidation`: Test specific format validations (e.g., email).

-   **Utility Functions:**
    -   [ ] Test `getNextQuoteNumber` to ensure it generates sequential, correctly padded quote numbers (`Q-ST-0001`, `Q-ST-0002`, etc.).

## 2. Integration Tests

Integration tests check how different parts of the application work together.

**Key integration scenarios:**

-   **Form and Summary Interaction:**
    -   [ ] When a user enters dimensions in an `ItemCard`, verify that the `calculated-field` values update instantly.
    -   [ ] When the `ratePerKg` or `quantity` is changed, ensure the `Item Total` and the `Grand Total` in the summary sidebar update in real-time.
    -   [ ] Toggling the "Include in Quote" switch should immediately add/remove the item's cost from the `Grand Total`.

-   **State and Local Storage:**
    -   [ ] After creating a quote, verify it is correctly saved to local storage.
    -   [ ] Refreshing the page should persist the created quotes and the quote counter.

-   **Dashboard and Modal:**
    -   [ ] Clicking the "View" button on a quote in the dashboard should open the `QuotePreviewModal` with the correct data.
    -   [ ] The data displayed in the modal (client info, items, totals) must exactly match the saved quote's data.

## 3. End-to-End (E2E) Tests

E2E tests simulate a complete user journey from start to finish.

**User Flow 1: Create and Export a New Quote**

1.  [ ] Navigate to the "Create New Quote" view.
2.  [ ] **Step 1:** Fill in all client details. Click "Next".
3.  [ ] **Step 2:** Fill in all quotation details. Click "Next".
4.  [ ] **Step 3:** Fill in details for the first item.
5.  [ ] Click "+ Add Another Item". Fill in details for the second item.
6.  [ ] Un-check the "Include in Quote" toggle for the first item.
7.  [ ] Confirm the "Grand Total" in the summary only reflects the second item.
8.  [ ] Click "Generate Quote".
9.  [ ] **Verification:**
    -   A success toast "Quote successfully created!" appears.
    -   The user is redirected to the dashboard.
    -   The newly created quote appears at the top of the dashboard list.
    -   The `QuotePreviewModal` opens automatically, showing the correct details (only the second item should be listed).
10. [ ] In the modal, click "Export as PDF".
11. [ ] **Verification:** A PDF file is downloaded and its content is correct.
12. [ ] Close the modal.

**User Flow 2: Dashboard Interaction and Filtering**

1.  [ ] Create at least two quotes with different client names (e.g., "Client A", "Client B").
2.  [ ] Go to the "Dashboard" view.
3.  [ ] In the search bar, type "Client A".
4.  [ ] **Verification:** Only the quote for "Client A" is visible in the table.
5.  [ ] Clear the search bar.
6.  [ ] **Verification:** Both quotes are visible again.
7.  [ ] In the search bar, type a quote number.
8.  [ ] **Verification:** Only the matching quote is visible.

**User Flow 3: Form Validation and Error Handling**

1.  [ ] Go to the "Create New Quote" view.
2.  [ ] Click "Next" without filling in any details on Step 1.
3.  [ ] **Verification:** Error messages appear under each required field.
4.  [ ] Fill in an invalid email address (e.g., "test@test").
5.  [ ] **Verification:** An "invalid email" error message appears.
6.  [ ] Go to Step 3, ensure no items are selected, and click "Generate Quote" (after filling steps 1 & 2).
7.  [ ] **Verification:** A browser alert appears stating "Please select at least one item..."

## 4. Stress & Performance Testing

-   **Many Items:**
    -   [ ] Add 50+ items to a single quote.
    -   [ ] **Verification:** The UI should remain responsive, and calculations should still be instantaneous. There should be no noticeable lag when typing.
-   **Many Quotes:**
    -   [ ] Manually add 100+ quotes to local storage.
    -   [ ] **Verification:** The dashboard should load quickly, and filtering/searching should remain fast.
