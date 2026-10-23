import mongoose from 'mongoose';

const requestActivityLogSchema = new mongoose.Schema(
    {
            userId: { 
               type: mongoose.Schema.Types.ObjectId, 
               ref: 'User', 
               required: true }, 
            subjectUserId: { 
               type: mongoose.Schema.Types.ObjectId, 
               ref: 'User' },        
            action: { 
               type: String, 
               required: true }, 
            topic: { 
               type: String,
                index: true },      
            description: { 
               type: String },       
            resourceType: { type: String },      
            resourceId: { type: mongoose.Schema.Types.ObjectId },
            hrOnly: { 
               type: Boolean, 
               default: false },  
            ip: { type: String },  
    },
   { timestamps: { createdAt: true, updatedAt: false } }
);

requestActivityLogSchema.index({ createdAt: -1 });
requestActivityLogSchema.index({ userId: 1, createdAt: -1 });
requestActivityLogSchema.index({ subjectUserId: 1, createdAt: -1 });

const RequestActivityLog = mongoose.model('RequestActivityLog', requestActivityLogSchema);

export default RequestActivityLog;