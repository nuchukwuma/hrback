import mongoose from 'mongoose';
import personalInfoSchema from '../nestedSchema/personalInfo.js';

const tempSchema = new mongoose.Schema(
    {
    personalInfo:
     {
         type: personalInfoSchema,
         default: () => ({}),
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
      index: true,
    },
    notes: {
        type: String,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    }, 
    statusTemp: {
        type: String,
        enum: ['active','inactive'],
        default: 'inactive',
        index: true,
    },     
    }
);

const Temp = mongoose.model('Temp','tempSchema');

export default Temp;