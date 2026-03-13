# Usability Testing Guide

This document describes how usability testing is performed for the **Aunt Leah’s Case Management System**.  
The goal is to ensure staff members can complete common tasks efficiently, understand navigation easily, and interact with system features without confusion.

Our usability testing focuses on validating that core workflows are intuitive and that users can complete most actions within **three clicks or fewer** from the main interface.

---

# Usability Principles

The following usability principles guide our testing.

## Task Efficiency
Users should be able to complete common workflows quickly.

Examples:
- Adding a new client
- Creating or editing case notes
- Searching for a client
- Viewing analytics dashboards

Goal: core tasks should require **no more than three clicks** when possible.

---

## Navigation Clarity
Users should easily understand how to move between system pages.

Checks include:
- Clear navigation menu labels
- Logical page flow between features
- Ability to return to previous pages without confusion

---

## Form Usability
Forms should be easy to understand and prevent invalid input.

Checks include:
- Required fields are clearly indicated
- Invalid input produces clear error messages
- Confirmation appears after saving data

---

## Information Visibility
Important information should be easy to locate and interpret.

Checks include:
- Case notes are displayed chronologically
- Client profiles display relevant information clearly
- Dashboards present readable summaries of data

---

# Usability Test Tasks

Testers should attempt the following tasks without guidance.

## Task 1 – Add a Client
1. Navigate to the client management page
2. Create a new client record
3. Save the client information

Expected Result:
- The form is clear and easy to complete
- Client is successfully saved

---

## Task 2 – Search for a Client
1. Use the search feature
2. Locate an existing client
3. Open the client profile

Expected Result:
- Search results appear quickly
- The correct client profile opens

---

## Task 3 – Add a Case Note
1. Navigate to a client profile
2. Add a case note
3. Save the note

Expected Result:
- The note is saved successfully
- Notes appear in chronological order

---

## Task 4 – View Analytics Dashboard
1. Navigate to the reports or dashboard page
2. Review available program statistics
3. Attempt exporting report data (not yet implemented) 

Expected Result:
- Data is clearly displayed
- Export options are visible and functional

---

# Known Usability Issues

The following usability issues were discovered during peer testing:

- Edit icons are small and difficult to notice
- Reports page layout is visually compact
- Navigation on the home page caused confusion for some users
- Client search initially limited results to 30 entries
- UI bugs apparent 
- Invalid credentials for login should be displayed below 

These issues have been documented in the project issue tracker and will be addressed in future updates.


- Increase visibility of edit and action buttons
- Improve dashboard layout and spacing
- Expand client search results
- Clarify navigation elements on the home page
