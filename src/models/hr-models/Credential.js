import mongoose from 'mongoose';

const credentialSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true,
        },
        name: {
            type: String,
            required: true,
        },
        issuer: {
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
        }, 
    }
);

const Credential = mongoose.model('Credential','credentialSchema');

export default Credential;