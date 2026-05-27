const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorizeAdminOnlyLegacy } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/patients
// FIX: Migrated from scaling-vulnerable in-memory slicing to native database engine compilation filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, gender } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const whereClause = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (gender && gender !== 'All') {
      whereClause.gender = { equals: gender, mode: 'insensitive' };
    }

    // Parallel multi-query processing offload mapping
    const [patients, totalMatching] = await Promise.all([
      prisma.patient.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: limit
      }),
      prisma.patient.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalMatching / limit);

    res.json({
      success: true,
      patients,
      pagination: {
        page,
        limit,
        totalPatients: totalMatching,
        totalPages,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to filter systemic core directory listings.' });
  }
});

// GET /api/patients/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: { appointments: true },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient metadata file cannot be tracked.' });
    }

    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Internal extraction pipeline failure.' });
  }
});

// POST /api/patients
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, email, phoneNumber, age, gender, medicalHistory } = req.body;

    if (!name || !phoneNumber || !age || !gender) {
      return res.status(400).json({ error: 'Name, phoneNumber, age, and gender parameters must be populated.' });
    }

    // Strict regex phone evaluation to clean database pollution
    const phonePattern = /^\+?[0-9\s\-]{7,15}$/;
    if (!phonePattern.test(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid structured formatting patterns detected on cell routing strings.' });
    }

    const patient = await prisma.patient.create({
      data: {
        name,
        email: email || null,
        phoneNumber,
        age: parseInt(age),
        gender,
        medicalHistory: medicalHistory || null,
      },
    });

    res.status(201).json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to instantiate record fields under current cluster arrays.' });
  }
});

// DELETE /api/patients/:id
router.delete('/:id', authenticate, authorizeAdminOnlyLegacy, async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await prisma.patient.findUnique({ where: { id } });
    if (!patient) {
      return res.status(404).json({ error: 'Target record directory tracking points missing.' });
    }

    await prisma.patient.delete({ where: { id } });

    res.json({ message: `Successfully expunged directory system tracking tokens for ${patient.name}` });
  } catch (error) {
    res.status(500).json({ error: 'Database context wipe rejection failures.' });
  }
});

module.exports = router;