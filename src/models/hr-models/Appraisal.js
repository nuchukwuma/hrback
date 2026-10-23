import mongoose from 'mongoose';

const appraisalSchema = new mongoose.Schema(
    {
        cycleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AppraisalCycle',
            default: null,
            index: true,
        },
        employmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true,
        },
        reviewedId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true,
        },
        selfAssessment: [
            {
                question: {
                    type: String,
                },
                answer: {
                    type: String,
                },                
            }
        ],   
        managerAssessment: [
            {
                question: {
                    type: String,
                },
                answer: {
                    type: String,
                }, 
                rating: {
                    type: Number,
                    required: true,
                    min: [1],
                    max: [5],
                },               
            }
        ],
        overallRating: {
                    type: Number,
                    required: true,
                    min: [1],
                    max: [5],            
        },
        status: {
            type: String,
            enum: ['upcoming','active','closed'],
            default: null,
            index: true,            
        }             
    },
);

const Appraisal = mongoose.model('Appraisal','appraisalSchema');

export default Appraisal;
