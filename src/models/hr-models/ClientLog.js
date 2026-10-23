import mongoose from 'mongoose';

const clientLogSchema = new mongoose.Schema(
    {
       subjectName: {
            type: String,
            required: true,
       },
       teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
            default: null,
            index: true,        
       },
       createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null,
          index: true,
       },
       involvedStaff: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          default: null,
          index: true,            
        }
       ],
       details: {
            type: String,
            required: true,
       }
    }
);

const ClientLog = mongoose.model('ClientLog','clientLogSchema');

export default ClientLog;