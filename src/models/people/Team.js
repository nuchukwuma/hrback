import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        dept: {
           type: String,
            required: true,
            unique: true, 
        },
        managerId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
              default: null,
              index: true,
            }
    }
);

const Team = mongoose.model('Team', teamSchema);

export default Team;