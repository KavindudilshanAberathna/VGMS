# Vehicle Garage Management System (VGMS)

The Vehicle Garage Management System (VGMS) is a role-based, full-stack web application developed to streamline and digitize operations in Sri Lankan vehicle garages. Designed to reduce inefficiencies in manual garage workflows, VGMS supports appointment scheduling, task assignment, part tracking, customer feedback, and secure multi-role access.

---
##  Table of Contents

- [Project Summary](#project-summary)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [User Roles](#user-roles)
- [Installation Guide](#installation-guide)
- [Future Enhancements](#future-enhancements)
- [Acknowledgements](#acknowledgements)
- [License](#license)
- [Author](#Author)

---

##  Project Summary

**Project Title:** Vehicle Garage Management System  
**Developer:** Kavindu Dilshan Aberathna  
**University:** Plymouth University  
**Project Type:** Final Year Individual Project  
**Supervisor:** Mr. Naji Saravanapawan  

VGMS was created to replace manual garage operations with a responsive, secure, and user-friendly web-based system. It is tailored for small to mid-sized garages in Sri Lanka to improve service efficiency, transparency, and customer engagement.

---

##  key Features

###  Admin
- Manage customers, mechanics, and appointments
- Assign and track mechanic tasks
- Oversee inventory with low-stock alerts
- Generate invoices and manage feedback
- View a complete mechanic calendar

###  Mechanic
- View and update assigned tasks
- Mark spare parts used
- Access personal service calendar
- View published customer feedback

###  Customer
- Register and book services online
- Track vehicle service status
- Confirm payment and receive auto-generated invoices
- Submit and view published feedback

---

##  Technology Stack

| Layer           | Technologies                         |
|-----------------|--------------------------------------|
| Frontend        | HTML5, Tailwind CSS, JavaScript, EJS |
| Backend         | Node.js, Express.js                  |
| Database        | MongoDB (NoSQL) + Mongoose ODM       |
| UI/UX Design    | Figma                                |
| Research Tools  | Google Forms                         |
| Version Control | Git + GitHub                         |

---

### System Architecture

A modular full-stack JavaScript system using RESTful API design:

- **Frontend:** Static SPA-like pages rendered using HTML + Tailwind
- **Backend:** Node.js with Express.js routing and middleware
- **Database:** MongoDB schema for users, appointments,feedbacks,invoices etc.
- **Role-based Authentication & Authorization**

---

##  User Roles

1. **Administrator**
   - Manage all users and data
   - assign mechanics, manage feedbacks, inventory management etc.
2. **Customer**
   - Book appointments, give feedbacks,get notifications etc.
3. **Mechanic**
   - view tasks, complete tasks, view own feedback etc.

---

##  Installation Guide

### Prerequisites
- Node.js
- MongoDB (local or Atlas)
- Git

### Clone and Setup

using Git bash

git clone https://github.com/KavindudilshanAberathna/VGMS.git
cd lms-project
npm install
npm run dev

# Open in browser
http://localhost:3000


### Clone and Setup

download .zip folder and unzip it
open with vs code
cd lms-project
npm install
npm run dev

# Open in browser
http://localhost:3000


### Future Enhancements

Mobile App (Android/iOS)
Sinhala and Tamil language support
Multi-garage SaaS platform
SMS Notifications
Reports and analytics dashboard
AI-based appointment and inventory suggestions

### Acknowledgements

Mr. Naji Saravanapawan – Supervisor
NSBM Green University lecturers
Garage owners, mechanics & customers of near garages
garage owners & mechanics for testing & feedback
Open-source developers & communities (MongoDB, Express, Tailwind, Figma)

### License

This project was developed as part of the final year university curriculum and is intended for educational and developmental use.

### Author

Ranketi dewage kavindu Dilshan Aberathna
Faculty of Computing, Plymouth University