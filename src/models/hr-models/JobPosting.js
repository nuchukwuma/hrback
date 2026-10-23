import mongoose from 'mongoose';

const jobPostingSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
         department: {
            type: String,
            required: true,
        }, 
        description: {
            type: String,
            required: true,
        }, 
        teamId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Team',
          default: null,
          index: true,
        },
       requestedBy: {
           type: mongoose.Schema.Types.ObjectId,
           ref: 'User',
           default: null,
           index: true,       
        },  
        statusJob: {
            type: String,
            enum: ['draft','open','closed'],
            default: null,
            required: true,
        },                               
    },
);

const JobPosting = mongoose.model('JobPosting','jobPostingSchema');

export default JobPosting;
