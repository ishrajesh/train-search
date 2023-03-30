const express = require('express');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const Train = require('./models/train.model');
const app = express();

app.use(express.json());

mongoose.connect('mongodb://localhost/trainSearch', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Could not connect to MongoDB', err));


// Create and save a new train
app.post(
    '/trains',
    [
      check('name').notEmpty().withMessage('Train name is required'),
      check('stops.*.station').notEmpty().withMessage('Station name is required'),
      check('stops.*.distanceFromPrevious').isNumeric().withMessage('Distance from previous station must be a number'),
      check('stops.*.departureTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Departure time must be in HH:mm format'),
    ],
    async (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }
  
      try {
        const train = new Train(req.body);
        await train.save();
        res.send(train);
      } catch (error) {
        next(error);
      }
    }
  );


// Retrieve all trains
app.get('/trains', async (req, res, next) => {
    try {
      const trains = await Train.find();
      res.send(trains);
    } catch (error) {
      next(error);
    }
  });

// Search trains based on the source and destination
app.get(
    '/trains/search',
    [
      check('source').notEmpty().withMessage('Source station is required'),
      check('destination').notEmpty().withMessage('Destination station is required'),
    ],
    async (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
      }
  
      try {

        // Implement search logic here
        const { source, destination } = req.query;
  
        const trains = await Train.find();
      
        const result = trains
          .map((train) => {
            const sourceIndex = train.stops.findIndex((stop) => stop.station === source);
            const destinationIndex = train.stops.findIndex((stop) => stop.station === destination);
      
            if (sourceIndex !== -1 && destinationIndex !== -1 && sourceIndex < destinationIndex) {
              const distance = train.stops
                .slice(sourceIndex, destinationIndex + 1)
                .reduce((total, stop) => total + stop.distanceFromPrevious, 0);
      
              const price = distance * 1.25;
      
              return {
                train: train.name,
                starting: train.stops[sourceIndex].departureTime,
                reaching: train.stops[destinationIndex].departureTime,
                distance: distance,
                price: price.toFixed(2),
              };
            }
      
            return null;
          })
          .filter((train) => train !== null);
      
        res.send(result);
      } catch (error) {
        next(error);
      }
    }
  );

// Error handling middleware for invalid requests
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});
  
// Error handling middleware for other potential issues
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});
  


const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});