const mongoose = require('mongoose');

const TrainSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stops: [
    {
      station: { type: String, required: true },
      distanceFromPrevious: { type: Number, required: true },
      departureTime: { type: String, required: true },
    },
  ],
});

module.exports = mongoose.model('Train', TrainSchema);