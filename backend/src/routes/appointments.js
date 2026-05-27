const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/appointments
// FIX: Consolidated lookups into relation joins to completely mitigate N+1 loop performance degradation
router.get('/', authenticate, async (req, res) => {
  try {
    const { doctorId, status } = req.query;

    const where = {};
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;

    // Single unified fetch executing joins at database engine level
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: { id: true, name: true, phoneNumber: true, age: true, medicalHistory: true }
        },
        doctor: {
          select: { id: true, name: true, specialization: true }
        }
      },
      orderBy: { appointmentDate: 'asc' },
    });

    res.json({
      success: true,
      count: appointments.length,
      appointments: appointments,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve scheduled directory blocks.' });
  }
});

// POST /api/appointments
router.post('/', authenticate, async (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, reason } = req.body;

    if (!patientId || !doctorId || !appointmentDate) {
      return res.status(400).json({ error: 'Patient, Doctor, and Appointment Date fields are mandatory.' });
    }

    const appDate = new Date(appointmentDate);
    
    // FIX: Block out a realistic 30-minute operational window (30m before and after) to prevent overlaps
    const startWindow = new Date(appDate.getTime() - 30 * 60 * 1000);
    const endWindow = new Date(appDate.getTime() + 30 * 60 * 1000);

    const conflictingBooking = await prisma.appointment.findFirst({
      where: {
        doctorId,
        appointmentDate: {
          gte: startWindow,
          lte: endWindow
        },
        status: { not: 'CANCELLED' },
      },
    });

    if (conflictingBooking) {
      return res.status(400).json({
        error: 'Scheduling conflict: The selected physician has an active slot allocation within this time block.',
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        appointmentDate: appDate,
        reason: reason || '',
        status: 'PENDING',
      },
    });

    res.status(201).json({
      message: 'Appointment recorded successfully',
      appointment,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete transaction logging maps.' });
  }
});

// PATCH /api/appointments/:id
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status definition parameter is missing.' });
    }

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute status transition state updates.' });
  }
});

module.exports = router;