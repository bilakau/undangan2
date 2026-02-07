// api/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// --- DATABASE CONNECTION & CACHING ---
// Di serverless, koneksi harus di-cache agar tidak bikin DB 'meledak' karena koneksi baru terus menerus.
let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        isConnected = true;
        console.log("MongoDB Connected");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
};

// --- SCHEMA & MODEL ---
const GuestSchema = new mongoose.Schema({
    nama: String,
    hadir: String,
    ucapan: String,
    tanggal: { type: Date, default: Date.now }
});

// Cek apakah model sudah ada (untuk menghindari error overwrite di hot-reload serverless)
const Guest = mongoose.models.Guest || mongoose.model('Guest', GuestSchema);

// --- ROUTES ---

// Default route
app.get('/api', (req, res) => {
    res.send("API Wedding is running...");
});

// API 1: Simpan Tamu (POST)
app.post('/api/rsvp', async (req, res) => {
    await connectDB(); // Connect dulu
    try {
        const { nama, hadir, ucapan } = req.body;
        if (!nama || !ucapan) {
            return res.status(400).json({ error: "Nama dan Ucapan wajib diisi" });
        }
        const newGuest = new Guest({ nama, hadir, ucapan });
        await newGuest.save();
        res.status(201).json(newGuest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API 2: Ambil Daftar Tamu (GET)
app.get('/api/guests', async (req, res) => {
    await connectDB(); // Connect dulu
    try {
        const guests = await Guest.find().sort({ tanggal: -1 }); // Terbaru diatas
        res.json(guests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export app untuk Vercel Serverless
module.exports = app;
