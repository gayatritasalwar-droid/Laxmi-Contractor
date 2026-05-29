const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ SIRF YEH 3 LINES CHANGE HUI HAI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms';
mongoose.connect(MONGODB_URI)
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.log('❌ MongoDB Error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  phone: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Worker Schema
const workerSchema = new mongoose.Schema({
  fullName: String,
  applicationId: String,
  department: String,
  designation: String,
  experience: String,
  status: String,
  salary: Number,
  dailyRate: Number,
  punchCode: String,
  contractor: String,
  contractorName: String,
  mobile: String,
  email: String,
  gender: String,
  dateOfBirth: Date,
  address: String,
  aadhar: String,
  userType: { type: String, default: 'worker' },
  bondYears: { type: Number, default: 2 },
  esiPfPercentage: { type: Number, default: 0 },
  applyESI: { type: Boolean, default: false },
  subDept: String,
  category: String,
  ceoName: String,
  ceoApprovedDate: Date,
  finalizedDate: Date,
  finalizedBy: String,
  joiningDate: Date,
  createdAt: { type: Date, default: Date.now }
});

const Worker = mongoose.model('Worker', workerSchema);

// ============ CREATE USERS (RUN ONCE) ============
app.get('/api/create-users', async (req, res) => {
  try {
    await User.deleteMany({});
    
    const users = await User.insertMany([
      { name: "Admin User", email: "a", password: "a123", role: "admin", phone: "9999999991" },
      { name: "Contractor User", email: "c", password: "c123", role: "contractor", phone: "9999999992" },
      { name: "Production Head", email: "ph", password: "ph123", role: "production", phone: "9999999993" },
      { name: "CEO User", email: "ceo", password: "ceo123", role: "ceo", phone: "9999999994" },
      { name: "HR User", email: "hr", password: "hr123", role: "hr", phone: "9999999995" }
    ]);
    
    console.log("✅ Users created");
    res.json({ success: true, message: "Users created successfully", users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ LOGIN ============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("📝 Login:", email);
    
    const user = await User.findOne({ email: email });
    
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: "Wrong password" });
    }
    
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ TEST ============
app.get('/api/test', (req, res) => {
  res.json({ message: "Backend working on port 5000" });
});

// ============ GET ALL WORKERS ============
app.get('/api/workers/all', async (req, res) => {
  try {
    const workers = await Worker.find({}).sort({ createdAt: -1 });
    res.json(workers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ CONTRACTOR REGISTER ============
app.post('/api/workers/contractor/register', async (req, res) => {
  try {
    const { fullName, department, designation, experience, contractorName, mobile, email, gender, dateOfBirth, address, aadhar } = req.body;
    
    const punchCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const worker = new Worker({
      fullName: fullName,
      applicationId: 'CONT' + Date.now(),
      department: department,
      designation: designation,
      experience: experience || '0',
      status: 'pending_contractor',
      contractor: contractorName || 'c',
      contractorName: contractorName || 'c',
      mobile: mobile,
      email: email,
      gender: gender,
      dateOfBirth: dateOfBirth,
      address: address,
      aadhar: aadhar,
      punchCode: punchCode,
      userType: 'worker',
      joiningDate: new Date(),
      createdAt: new Date()
    });
    
    await worker.save();
    console.log("✅ Worker saved:", worker.fullName, "Punch:", punchCode);
    res.status(201).json({ success: true, worker, punchCode });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ PRODUCTION APPROVE ============
app.put('/api/workers/approve/production/:id', async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { status: 'pending_ceo' },
      { new: true }
    );
    res.json(worker);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ CEO APPROVE ============
app.put('/api/workers/ceo-approve/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { dailyRate, bondYears, esiPfPercentage, applyESI, subDept, category, ceoName } = req.body;
    
    const monthlySalary = dailyRate * 26;
    
    const worker = await Worker.findByIdAndUpdate(
      id,
      {
        status: 'pending_hr',
        dailyRate: dailyRate,
        salary: monthlySalary,
        bondYears: bondYears,
        esiPfPercentage: esiPfPercentage,
        applyESI: applyESI,
        subDept: subDept,
        category: category,
        ceoName: ceoName,
        ceoApprovedDate: new Date()
      },
      { new: true }
    );
    
    res.json({ success: true, worker });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ CEO REJECT ============
app.put('/api/workers/ceo-reject/:id', async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(req.params.id, { status: 'rejected_by_ceo' }, { new: true });
    res.json({ success: true, worker });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ CEO HOLD ============
app.put('/api/workers/ceo-hold/:id', async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(req.params.id, { status: 'on_hold_ceo' }, { new: true });
    res.json({ success: true, worker });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ HR FINALIZE ============
app.put('/api/workers/finalize/hr/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { finalizedBy } = req.body;
    
    const worker = await Worker.findById(id);
    if (!worker) {
      return res.status(404).json({ success: false, error: "Worker not found" });
    }
    
    worker.status = 'finalized';
    worker.finalizedDate = new Date();
    worker.finalizedBy = finalizedBy;
    await worker.save();
    
    console.log("✅ HR Finalized:", worker.fullName, "Punch:", worker.punchCode);
    res.json({ success: true, worker });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ UPDATE WORKER ============
app.put('/api/workers/update/:id', async (req, res) => {
  try {
    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, worker });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ DELETE WORKER ============
app.delete('/api/workers/delete/:id', async (req, res) => {
  try {
    await Worker.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ GET USERS ============
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ CREATE USER (ADMIN) ============
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: "User already exists" });
    }
    const user = new User({ name, email, password: password || 'admin123', role: role || 'admin', phone: phone || '', createdAt: new Date() });
    await user.save();
    console.log("✅ User created:", user.email);
    res.status(201).json({ success: true, user });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ DELETE USER ============
app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============ DEBUG ============
app.get('/api/debug', async (req, res) => {
  const users = await User.find({});
  const workers = await Worker.find({});
  res.json({
    users: users.map(u => ({ email: u.email, role: u.role })),
    workersCount: workers.length
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server on http://localhost:${PORT}`);
  console.log('✅ MongoDB Connected');
  console.log('\n✅ LOGIN CREDENTIALS:');
  console.log('   Contractor: c / c123');
  console.log('   Production: ph / ph123');
  console.log('   CEO: ceo / ceo123');
  console.log('   HR: hr / hr123');
  console.log('   Admin: a / a123\n');
});

module.exports = app;