const express = require('express');
const { PrismaClient, Prisma } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/doctors
// FIX: Patched SQL Injection completely by switching to safe parameterized template tags
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, specialization } = req.query;

    let queryCondition = Prisma.sql`WHERE 1=1`;

    if (search && specialization && specialization !== 'All') {
      queryCondition = Prisma.sql`WHERE name ILIKE ${'%' + search + '%'} AND specialization = ${specialization}`;
    } else if (search) {
      queryCondition = Prisma.sql`WHERE name ILIKE ${'%' + search + '%'}`;
    } else if (specialization && specialization !== 'All') {
      queryCondition = Prisma.sql`WHERE specialization = ${specialization}`;
    }

    const doctors = await prisma.$queryRaw`SELECT * FROM "Doctor" ${queryCondition}`;
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Database diagnostic engine execution failure.' });
  }
});

// GET /api/doctors/stats
// FIX: Consolidated separate blocking async lookups into a single concurrent execution block
router.get('/stats', authenticate, async (req, res) => {
  try {
    const start = Date.now();

    // Fire off all independent aggregate queries concurrently
    const [totalDoctors, surgeonsCount, averageFee, highestExperience] = await Promise.all([
      prisma.doctor.count(),
      prisma.doctor.count({ where: { department: 'Surgery' } }),
      prisma.doctor.aggregate({ _avg: { consultationFee: true } }),
      prisma.doctor.aggregate({ _max: { experience: true } })
    ]);

    const durationMs = Date.now() - start;

    res.json({
      success: true,
      data: {
        total: totalDoctors,
        surgeons: surgeonsCount,
        averageFee: Math.round(averageFee._avg.consultationFee || 0),
        maxExperience: highestExperience._max.experience || 0,
      },
      debugInfo: {
        executionTimeMs: durationMs,
        notes: 'Optimized using concurrent Promise allocation models.'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Telemetry parsing failures.' });
  }
});

// GET /api/doctors/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Target practitioner file not identified.' });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;