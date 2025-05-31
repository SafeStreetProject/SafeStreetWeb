# 🚧 SafeStreet – Road Damage Detection and Alert System

SafeStreet is a real-time road damage detection and alert system designed to assist both citizens and municipal authorities in identifying, managing, and resolving road infrastructure issues such as potholes. Powered by AI-based image processing and geolocation, SafeStreet brings smarter streets to life.

---

## 🔗 Live Demo

> **Web Dashboard:** `http://192.168.245.132:3000`
> **AI Server:** `http://192.168.245.132:5000`

---

## 👥 Team G354

* **Project Title:** SafeStreet – Road Damage Detection and Alert System
* **Branch:** CSE
* **Group Mentor:** *Nidhi Ma'am*, IT Department
* **Institution:** Keshav Memorial Institution Of Technology

---

## 📸 Features

### 👤 User Features

* Upload road images via mobile or web
* AI automatically detects potholes & analyzes severity
* View status of reported issues
* Get notified when issues are resolved

### 🧑‍💼 Authority Features

* View real-time reported cases on a dashboard
* Track status: *Pending, In Progress, Resolved*
* Assign team members for resolution
* Upload completion images with proof

### 📊 Admin Dashboard

* Total, Resolved, In-progress, and Pending stats
* Case trends over last 30 days
* Pie & Line charts
* Location-based analytics

---

## 🛠️ Tech Stack

| Frontend      | Backend             | AI Server       | Database |
| ------------- | ------------------- | --------------- | -------- |
| HTML, CSS, JS | Node.js, Express.js | FastAPI, Python | MongoDB  |

Other Tools:

* JWT Authentication
* Multer (File Uploads)
* Chart.js (Analytics)
* Nominatim (Reverse Geocoding)
* Mailjet (OTP Email Verification)

---

## 🧠 How It Works

1. **User uploads a road image.**
2. **AI model** processes the image and identifies potholes, returns severity and confidence.
3. **Detected image is stored** and location is reverse-geocoded.
4. **Authorities view and manage cases** via web dashboard.
5. **Completion image** is uploaded after repair and marked as *Resolved*.

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/SafeStreetProject/SafeStreetWeb
cd safestreet
```

### 2. Install Dependencies

#### For Node.js (Web Backend)

```bash
npm install
```

#### For FastAPI (AI Backend)

```bash
pip install -r requirements.txt
```

### 3. Environment Variables

Create a `.env` file in both directories:

#### For Web Backend (`.env`)

```
JWT_SECRET=safestreet
AI_API_URL=http://192.168.245.132:5000/ai-process
MAILJET_API_KEY=your_key
MAILJET_API_SECRET=your_secret
```

#### For AI Server (`.env`)

```
MODEL_PATH=models/best.pt
```

### 4. Run the Project

#### Start AI Server

```bash
uvicorn main:app --reload --port 5000
```

#### Start Web Server

```bash
node index.js
```

---

## 📂 Folder Structure

```
safestreet/
├── middleware/
├── model/
├── node_modules/
├── routes/
├── public/
├── views/
├──index.js
├── .env
├── .gitignore
├── package-lock.json
├── package.json
└── README.md
```

---

## 🧢 Sample Test Credentials

| Role  | Email                          | Password    |
| ----- | -------------------            | ----------- |
| User  | `saiganeshsaga@gmail.com`      | `Kmit123$`  |
| Admin | `damerasanthosh2005@gmail.com` | `Kmit123$` |

---

## 🧱 Future Enhancements

* 🚨 Show construction alerts live on Google Maps *(Research in Progress)*
* 📱 Launch Mobile App with live photo capture
* 🚀 Offline submission + auto sync
* 📍 Cluster similar potholes for efficient resolution

---

## 📜 License

This project is for educational purposes under [MIT License](LICENSE).

---

> “SafeStreet – Making India’s roads smarter, safer, and pothole-free.”
