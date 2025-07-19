# SkyWatch-Drone-Air-Traffic-Monitoring-System

An interactive, map-based web application for monitoring drone traffic using simulated data. This project visualizes real-time drone positions, analyzes frequency usage, and detects violations, all in a clean and responsive UI.

> ⚠️ **Note:** This system currently works with **simulated drones only**. Integration with real drone traffic is planned for future development.

<img width="1280" height="689" alt="image" src="https://github.com/user-attachments/assets/dfd7454e-3e65-402b-b6e5-3c52a8ce275d" />


<img width="1280" height="691" alt="image" src="https://github.com/user-attachments/assets/04e93135-d723-4c0a-aeaa-8616b028d0d9" />

## 📊 Technical Implementation Overview

### 🔑 Key Features
- 🌍 Interactive world map with zoom and pan capabilities
- 🛰️ Real-time drone visualization (color-coded by country)
- 📶 Frequency spectrum analysis using Chart.js
- 🚨 Violation detection system based on frequency/location
- 📋 Tabular display of violation reports

### ⚙️ Technical Stack

| Layer     | Tools Used                           |
|-----------|--------------------------------------|
| Frontend  | Leaflet.js, HTML/CSS, Chart.js        |
| Backend   | Python Flask, Flask-CORS              |
| Data      | GeoJSON (for country boundaries)      |
| Optional  | GeoPandas (for backend country detection) |

---

## 🧱 Technical Architecture

### 🎯 Frontend Components

#### 🗺️ Map Interface (`Leaflet.js`)
- Base world map with zoom and pan
- Country boundary polygons via GeoJSON
- Drone markers with color-coded country info
- Custom popups for each drone

#### 🧭 Control Panel (`HTML/CSS`)
- `Monitor Traffic` – generates random drones
- `Frequency Scan` – renders frequency spectrum chart
- `Detect Violations` – shows violations in table format

#### 📈 Data Visualization
- Frequency spectrum plotted using `Chart.js`
- Violation data displayed in a responsive table

---

### 🧠 Backend Services (`Flask`)

## 🧱 How to Use
1.Clone the repo
2.Install the necessary libraries
3.Run app.py

## Working Video
https://drive.google.com/file/d/17QI--9fQ-7L4NsNaFQe45btttB58y7kU/view?usp=sharing
