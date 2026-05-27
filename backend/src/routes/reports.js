const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reports/doctor-stats
// FIX: Replaced slow sequential loops inside database hits with high-performance relational aggregates
router.get('/doctor-stats', authenticate, async (req, res) => {
  try {
    const start = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Pull down data structures in one pass using single query mappings
    const doctorsData = await prisma.doctor.findMany({
      include: {
        appointments: {
          select: { status: true }
        },
        queueTokens: {
          where: { createdAt: { gte: today } },
          select: { id: true }
        }
      }
    });

    const reportData = doctorsData.map((doc) => {
      const totalAppointments = doc.appointments.length;
      const completedAppointments = doc.appointments.filter(a => a.status === 'COMPLETED').length;
      const cancelledAppointments = doc.appointments.filter(a => a.status === 'CANCELLED').length;
      const todayQueueSize = doc.queueTokens.length;
      const revenue = completedAppointments * doc.consultationFee;

      return {
        id: doc.id,
        name: doc.name,
        specialization: doc.specialization,
        department: doc.department,
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        todayQueueSize,
        revenue,
      };
    });

    const durationMs = Date.now() - start;

    res.json({
      success: true,
      timeTakenMs: durationMs,
      data: reportData,
    });
  } catch (error) {
    console.error('Report calculation error:', error);
    res.status(500).json({ error: 'Analytics calculation loop crashed.' });
  }
});

module.exports = router;