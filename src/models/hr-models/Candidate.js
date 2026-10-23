import mongoose from 'mongoose';
import personalInfoSchema from '../nestedSchema/personalInfo.js';

const candidateSchema = new mongoose.Schema(
    {
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'JobPosting',
            default: null,
            index: true,
        },
        personalInfo: {
            type: personalInfoSchema,
             default: () => ({}),
        },
        resumeUrl: {
            type: String,
            trim: true,  
        },
        referredBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null,
          index: true,        
        },
        stageCandidate: {
            type: String,
            enum: ['applied','screening','interview','hired','offer','rejected'],
            default: null,
            index: true,
        },
        feedback: [
            {
                by: {
                  type: mongoose.Schema.Types.ObjectId,
                  ref: 'User',
                  default: null,
                  index: true,        
                },
                rating: {
                    type: Number,
                    required: true,
                    min: [1],
                    max: [5],
                },
                comment: {
                    type: String,
                },
                date: {
                    type: Date,
                }
            }
        ],
    }
);

const Candidate = mongoose.model('Çandidate','candiadateSchema');

export default Candidate;
