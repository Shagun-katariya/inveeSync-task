# Shagun Task

## Table of Contents

1. [Features](#features)
2. [Technologies Used](#technologies-used)
3. [Setup Instructions](#setup-instructions)
4. [Assumption for Bulk upload CSV and Download Template](#Assumption)
5. [Performance](#performance)
6. [Confusion](#confusion)
7. [Result](#result)

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

- **Frontend**: React.js
- **CSS Frameworks**: Custom CSS, Responsive Design
- **Libraries**:
  - `lodash.debounce`: For optimized search input handling
  - `useMemo` and `useCallback`: To optimize rendering and filtering logic
    and many more

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

## Assumption for Bulk upload CSV and Download Template
### CSV column names must look like this
        supplierItem	processDescription	qualityCheck	conversionRatio
        dummy1	      processdes1	        6	            4
        	      	                        3	            
        dummy3	      processdes3	    
        
### Download Template
    First, upload and fix bugs in the CSV files then you can download the updated CSV 


---

## Performance
   For security, we can add the API endpoint in the environment variable
   Added Performance and other aspects image in the root directory

---

## Confusion
There were a few aspects I didn’t fully grasp, such as the exact implementation of key validations. For instance, I included some UI validations not explicitly mentioned in the requirements, which led to confusion. Additionally, I wasn’t entirely clear about the specific details regarding the tenant ID, is_job_work, and factory ID. With a better understanding of these elements, I’m confident I could have delivered the task more effectively

---

## Result
This was a great project, and I truly enjoyed working on it. Thank you for the opportunity! Let’s connect if you feel my skills and approach align with your expectations

---
