const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mock database for observations
let observations = [];

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Physics Lab Backend is running' });
});

app.post('/experiment/start', (req, res) => {
    const { experimentId, studentId } = req.body;
    console.log(`Starting experiment ${experimentId} for student ${studentId}`);
    observations = []; // Clear for new session
    res.json({ success: true, message: 'Experiment started', startTime: new Date() });
});

app.post('/experiment/record', (req, res) => {
    const { trial, R, l } = req.body;

    // Meter Bridge formula: X = R * (100 - l) / l
    if (!l || l === 0) {
        return res.status(400).json({ success: false, error: 'Invalid balance length' });
    }

    const X = R * (100 - l) / l;
    const observation = { trial, R, l, X: parseFloat(X.toFixed(2)) };
    observations.push(observation);

    res.json({ success: true, observation });
});

app.get('/experiment/results', (req, res) => {
    if (observations.length === 0) {
        return res.status(404).json({ success: false, error: 'No observations recorded' });
    }

    const sumX = observations.reduce((acc, obs) => acc + obs.X, 0);
    const meanX = sumX / observations.length;

    // Assuming a true value for error calculation (can be passed from frontend or defined)
    const trueValue = observations[0].trueValue || meanX;
    const percentageError = Math.abs((meanX - trueValue) / trueValue) * 100;

    res.json({
        success: true,
        summary: {
            observations,
            meanValue: parseFloat(meanX.toFixed(2)),
            percentageError: parseFloat(percentageError.toFixed(2))
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
