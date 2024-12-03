# Shagun Task

## Table of Contents

1. [Features](#features)
2. [Technologies Used](#technologies-used)
3. [Setup Instructions](#setup-instructions)
4. [Assumption](#Assumption)
5. [Details](#details)
6. [Performance](#performance)
7. [Extra Fetures](#extra-features)
8. [Result](#result)

---

## Features

- **Dynamic Responsiveness**
- **Advanced Filtering**
- **File Handling**
- **Data Management**
- **Validations**
- **User Experience**

---

## Technologies Used

- **Frontend**: React.js, Redux(State Management)
- **CSS Frameworks**: Custom CSS, Responsive Design
- **Libraries**:
  - `lodash.debounce`: For optimized search input handling
  - `useMemo` and `useCallback`: To optimize rendering and filtering logic
    and many more
  - `dotenv`: for best practise

---

## Setup Instructions

### Prerequisites

Ensure you have the following installed:

- Node.js (v14 or later)
- Git
- A code editor (e.g., VS Code)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Shagun-katariya/inveeSync-task.git
   cd shagun-task
   Install dependencies:

npm install
Start the development server:

npm start
Open the application in your browser at:

http://localhost:3000
---

## Assumption
### Google Drive(https://drive.google.com/file/d/1-NZ6MCxVhSNB-H5uIKXFkVxIs6gnn8bQ/view?usp=sharing)
Update the bom and items excel sheet for correct data upload with correct item_id and component_id
Highly recommend, use only UI for updations
        
### Download Template
    First, upload and fix bugs in the CSV files then you can download the updated CSV for the respected ones(items, or for bom)

---
## Details

### items
create item as per requirement and we can't create data until it meets all the required fields
we can edit, and delete items
Validations done when you are change the data

### bom
create bom as per requirement and we can't create data until it meets all the required fields
we can edit, and delete boms.
Validations done when you are change the data

### bulk data upload
If our are tab is selected for Items then we can upload bulk items, otherwise we can upload bul boms.

after upload, validations done, and we can download error file.

upon succesful upload we can donwload template file. 

---

## Performance
   For security, we can add the API endpoint in the environment variable
   Added Performance and other aspects image in the root directory

---
## Extra Fetures
created Audit log component where we can see past changes made by who, at what time, what changes made.
with searchable options via name, actions, and time

---

## Result
This was a great project, and I truly enjoyed working on it. Thank you for the opportunity! Let’s connect if you feel my skills and approach align with your expectations

---
