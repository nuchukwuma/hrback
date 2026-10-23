import mongoose from 'mongoose';

const appraisalCylcleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        startDate: {
            type: Date,
            required: true,
    },
        endDate: {
            type: Date,
            required: true,
    }, questions: [{
        text: {
            type: String,
        },
        rating: {
            type: Number,
            required: true,
            min: [1],
            max: [5],
                },
    }],
        status: {
            type: String,
            enum: ['upcoming','active','closed'],
            default: null,
            index: true,},    
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true,
        }, 
      
    }
);

const AppraisalCycle =  mongoose.model('AppraisalCycle','appraisalCycleSchema');

export default AppraisalCycle;